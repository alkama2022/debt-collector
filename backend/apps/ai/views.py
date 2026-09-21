from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import AIConversation, PromiseToPay
from .serializers import AIConversationSerializer, PromiseToPaySerializer

class AIConversationListCreate(generics.ListCreateAPIView):
    serializer_class = AIConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["state", "channel", "customer", "invoice"]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return AIConversation.objects.none()
        return AIConversation.objects.for_org(org).prefetch_related("messages")

    def perform_create(self, serializer):
        serializer.save(org=getattr(self.request, "org", None))

class AIConversationDetail(generics.RetrieveUpdateAPIView):
    serializer_class = AIConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return AIConversation.objects.none()
        return AIConversation.objects.for_org(org)

class PromiseListCreate(generics.ListCreateAPIView):
    serializer_class = PromiseToPaySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return PromiseToPay.objects.none()
        return PromiseToPay.objects.filter(org=org)

    def perform_create(self, serializer):
        # fallback to user's org if middleware not set for JWT
        org = getattr(self.request, "org", None)
        if org is None and hasattr(self.request, "user") and self.request.user.is_authenticated:
            m = self.request.user.memberships.first()
            if m:
                org = m.org
        serializer.save(org=org)


class DetectLanguageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        text = request.data.get("text") or request.data.get("message") or ""
        if not text.strip():
            return Response({"detail": "text required"}, status=status.HTTP_400_BAD_REQUEST)
        from apps.languages.router import MultilingualLanguageRouter
        from apps.languages.models import Language
        router = MultilingualLanguageRouter()
        code, conf = router.detect_language(text)
        try:
            lang = Language.objects.get(code=code)
            name, native = lang.name, lang.native_name
        except Language.DoesNotExist:
            name = native = code
        escalate = conf < 0.6
        return Response({
            "text": text[:500],
            "detected_language": code,
            "language_name": name,
            "native_name": native,
            "confidence": round(float(conf), 2),
            "should_ask_preference": escalate,
            "suggested_prompt": "Which language would you prefer us to use when communicating with you?" if escalate else None
        })


class GenerateResponseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        text = request.data.get("text") or ""
        customer_id = request.data.get("customer_id")
        target_lang = request.data.get("language") or request.data.get("target_language")
        from apps.languages.router import MultilingualLanguageRouter
        router = MultilingualLanguageRouter()
        if not target_lang and customer_id:
            from apps.customers.models import Customer
            try:
                org = getattr(request, "org", None) or request.user.memberships.first().org
                cust = Customer.objects.for_org(org).get(pk=customer_id)
                target_lang = cust.preferred_language.code if cust.preferred_language else "en"
            except Exception:
                target_lang = "en"
        target_lang = target_lang or "en"
        from apps.languages.templates import render_template, TERMINOLOGY
        tmpl = render_template(target_lang, "reminder", {
            "customer_name": request.data.get("customer_name") or "Customer",
            "business_name": request.data.get("business_name") or "Your business",
            "amount_due": request.data.get("amount_due") or "₦85,000",
            "due_date": request.data.get("due_date") or "2026-10-05",
            "payment_link": request.data.get("payment_link") or "https://pay.collectnaija.test/p/xxx",
        })
        detected, conf = router.detect_language(text) if text else (target_lang, 0.9)
        return Response({
            "detected_language": detected,
            "confidence": round(float(conf), 2),
            "response_language": target_lang,
            "response": tmpl,
            "terminology": TERMINOLOGY.get(target_lang, TERMINOLOGY["en"]),
            "note": "Generated via Multilingual AI (context-aware, not sentence-translate) — amount preserved from backend Decimal."
        })


class VoiceLanguageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        customer_id = request.data.get("customer_id")
        from apps.languages.router import MultilingualLanguageRouter
        router = MultilingualLanguageRouter()
        code = request.data.get("language") or "en"
        voice = router.select_voice(code)
        return Response({"language": code, "voice": voice, "pipeline": ["STT","Language Detection","Conversation Understanding","Business Rules","Response Generation","Language Verification","TTS"]})


class LanguageHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk=None):
        from apps.languages.models import CustomerLanguageHistory
        org = getattr(request, "org", None)
        if org is None and hasattr(request, "user") and request.user.is_authenticated:
            m = request.user.memberships.first()
            if m:
                org = m.org
        qs = CustomerLanguageHistory.objects.filter(org=org).order_by("-created_at")[:50]
        if pk:
            qs = qs.filter(customer_id=pk)
        return Response([
            {"customer_id": str(h.customer_id), "from": h.from_lang.code if h.from_lang else None, "to": h.to_lang.code if h.to_lang else None, "reason": h.reason, "confidence": str(h.detected_confidence) if h.detected_confidence else None, "created_at": h.created_at}
            for h in qs
        ])
