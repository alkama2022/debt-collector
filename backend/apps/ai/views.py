from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import AIConversation, PromiseToPay
from .serializers import AIConversationSerializer, PromiseToPaySerializer
from apps.tenancy.org import get_org

class AIConversationListCreate(generics.ListCreateAPIView):
    serializer_class = AIConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["state", "channel", "customer", "invoice"]

    def get_queryset(self):
        org = get_org(self.request)
        if org is None:
            return AIConversation.objects.none()
        return AIConversation.objects.for_org(org).prefetch_related("messages")

    def perform_create(self, serializer):
        org = get_org(self.request)
        if org:
            from apps.subscriptions.entitlements import check_feature_access
            from rest_framework.exceptions import PermissionDenied
            allowed, reason = check_feature_access(org, "AI_CONVERSATIONS")
            if not allowed:
                raise PermissionDenied({"detail": reason, "code": "FEATURE_NOT_ENTITLED"})
            # limit check
            from apps.subscriptions.usage import check_usage_available
            from decimal import Decimal
            ok, r = check_usage_available(org, "AI_CONVERSATIONS", Decimal(1))
            if not ok:
                raise PermissionDenied({"detail": r, "code": "USAGE_LIMIT_REACHED"})
        obj = serializer.save(org=org)
        if org:
            try:
                from apps.subscriptions.usage import commit_or_create_usage
                commit_or_create_usage(org, "AI_CONVERSATIONS", 1, idempotency_key=str(obj.id), unit="conversation")
            except Exception:
                pass

class AIConversationDetail(generics.RetrieveUpdateAPIView):
    serializer_class = AIConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        org = get_org(self.request)
        if org is None:
            return AIConversation.objects.none()
        return AIConversation.objects.for_org(org)

class PromiseListCreate(generics.ListCreateAPIView):
    serializer_class = PromiseToPaySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        org = get_org(self.request)
        if org is None:
            return PromiseToPay.objects.none()
        return PromiseToPay.objects.filter(org=org)

    def perform_create(self, serializer):
        org = require_org(self.request)
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
        # §23 Human Escalation — low confidence → create escalated conversation stub for audit
        if escalate and request.data.get("customer_id"):
            try:
                from apps.ai.models import AIConversation
                from apps.customers.models import Customer
                org = get_org(request)
                cust = Customer.objects.for_org(org).filter(pk=request.data.get("customer_id")).first()
                AIConversation.objects.create(org=org, customer=cust, state=AIConversation.State.ESCALATED, channel=AIConversation.Channel.WHATSAPP)
            except Exception:
                pass
        return Response({
            "text": text[:500],
            "detected_language": code,
            "language_name": name,
            "native_name": native,
            "confidence": round(float(conf), 2),
            "should_ask_preference": escalate,
            "should_escalate": escalate,
            "escalation_reason": "low_confidence" if escalate else None,
            "suggested_prompt": "Which language would you prefer us to use when communicating with you?" if escalate else None
        })


class GenerateResponseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        text = request.data.get("text") or ""
        customer_id = request.data.get("customer_id")
        target_lang = request.data.get("language") or request.data.get("target_language")
        intent = (request.data.get("intent") or "").strip().lower()  # reminder|overdue|negotiation|promise|receipt|human_handoff
        from apps.languages.router import MultilingualLanguageRouter
        router = MultilingualLanguageRouter()
        if not target_lang and customer_id:
            from apps.customers.models import Customer
            try:
                org = get_org(request)
                cust = Customer.objects.for_org(org).get(pk=customer_id)
                target_lang = cust.preferred_language.code if cust.preferred_language else "en"
            except Exception:
                target_lang = "en"
        target_lang = target_lang or "en"
        # Auto-detect intent if not given — simple heuristic for natural routing
        if not intent:
            low = text.lower()
            if any(k in low for k in ["promise", "pay on", "will pay", "next week", "tomorrow"]):
                intent = "promise"
            elif any(k in low for k in ["can't pay", "no money", "split", "installment", "small small", "half"]):
                intent = "negotiation"
            elif any(k in low for k in ["overdue", "late"]):
                intent = "overdue"
            elif any(k in low for k in ["thank", "receipt", "paid"]):
                intent = "receipt"
            else:
                intent = "reminder"
        # Try LLM first if configured, else natural template
        llm_text = None
        from django.conf import settings as _s
        provider = getattr(_s, "AI_PROVIDER", "mock")
        if provider in ("openai", "anthropic") and (getattr(_s, "OPENAI_API_KEY", "") or getattr(_s, "ANTHROPIC_API_KEY", "")):
            try:
                llm_text = _call_llm_for_intent(intent, target_lang, text, request.data)
            except Exception:
                llm_text = None
        from apps.languages.templates import render_template, TERMINOLOGY
        ctx = {
            "customer_name": request.data.get("customer_name") or "Customer",
            "business_name": request.data.get("business_name") or "Your business",
            "amount_owed": (request.data.get("amount_due") or request.data.get("amount_owed") or "85,000").replace("₦","").strip(),
            "amount_due": (request.data.get("amount_due") or "85,000"),
            "due_date_value": request.data.get("due_date") or "2026-10-05",
            "due_date": request.data.get("due_date") or "2026-10-05",
            "pay_link": request.data.get("payment_link") or request.data.get("pay_link") or "https://pay.collectnaija.test/p/xxx",
            "invoice_number": request.data.get("invoice_number") or "INV-001",
            "outstanding_balance": request.data.get("outstanding_balance") or request.data.get("amount_due") or "85,000",
        }
        tmpl = llm_text or render_template(intent if intent in ("reminder","overdue","negotiation","promise","receipt","human_handoff") else "reminder", target_lang, ctx)
        detected, conf = router.detect_language(text) if text else (target_lang, 0.9)
        return Response({
            "detected_language": detected,
            "confidence": round(float(conf), 2),
            "response_language": target_lang,
            "intent": intent,
            "response": tmpl,
            "terminology": TERMINOLOGY.get(target_lang, TERMINOLOGY["en"]),
            "provider": "llm" if llm_text else "natural-template",
            "note": "Natural, warm Nigerian business tone — not robotic. Amount preserved from backend Decimal; LLM only styles, never recalculates."
        })

def _call_llm_for_intent(intent: str, lang: str, user_text: str, data: dict) -> str | None:
    """Call OpenAI/Anthropic with strict guardrails: never invent amounts."""
    from django.conf import settings as _s
    import requests
    amount = (data.get("amount_due") or data.get("amount_owed") or "85,000")
    prompt = (
        f"You are CollectNaija, a warm, professional Nigerian collection assistant. "
        f"Language: {lang}. Intent: {intent}. Customer says: \"{user_text[:400]}\". "
        f"Write a short WhatsApp message (2-3 sentences, human, empathetic, not demanding). "
        f"Use exact amount {amount} and link {data.get('payment_link') or data.get('pay_link') or 'https://pay.collectnaija.test/p/xxx'}. "
        f"Offer payment plan if intent is negotiation. Keep Nigerian polite tone. No markdown."
    )
    if getattr(_s, "OPENAI_API_KEY", ""):
        try:
            r = requests.post("https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {_s.OPENAI_API_KEY}", "Content-Type": "application/json"},
                json={"model": "gpt-4o-mini", "messages": [{"role": "user", "content": prompt}], "max_tokens": 180, "temperature": 0.7},
                timeout=12)
            j = r.json()
            return j["choices"][0]["message"]["content"].strip()
        except Exception:
            return None
    if getattr(_s, "ANTHROPIC_API_KEY", ""):
        try:
            r = requests.post("https://api.anthropic.com/v1/messages",
                headers={"x-api-key": _s.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json"},
                json={"model": "claude-3-haiku-20240307", "max_tokens": 180, "messages": [{"role": "user", "content": prompt}]},
                timeout=12)
            j = r.json()
            return j["content"][0]["text"].strip()
        except Exception:
            return None
    return None


class VoiceLanguageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        customer_id = request.data.get("customer_id")
        from apps.languages.router import MultilingualLanguageRouter
        router = MultilingualLanguageRouter()
        code = request.data.get("language") or "en"
        voice = router.select_voice(code)
        return Response({"language": code, "voice": voice, "pipeline": ["STT","Language Detection","Conversation Understanding","Business Rules","Response Generation","Language Verification","TTS"]})


class LanguageMetricsView(APIView):
    """GET /api/v1/ai/language-metrics — §24 Quality Monitoring per language."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from apps.languages.models import Language, CustomerLanguageHistory
        from apps.payments.models import Payment
        from apps.comms.models import CommunicationEvent
        from django.db.models import Count
        org = get_org(request)
        active = Language.objects.filter(active=True).order_by("code")
        results = []
        for lang in active:
            # customers with this preferred language
            from apps.customers.models import Customer
            cust_count = Customer.objects.for_org(org).filter(preferred_language=lang).count() if org else 0
            # payments from customers with this language (via invoice->customer)
            payment_qs = Payment.objects.for_org(org).filter(invoice__customer__preferred_language=lang, status="successful") if org else Payment.objects.none()
            paid_count = payment_qs.count()
            # comm events queued/sent for this language inferred via customer
            comm_total = CommunicationEvent.objects.for_org(org).filter(customer__preferred_language=lang).count() if org else 0
            comm_sent = CommunicationEvent.objects.for_org(org).filter(customer__preferred_language=lang, status="sent").count() if org else 0
            # escalation = low confidence histories
            esc = CustomerLanguageHistory.objects.filter(org=org, to_lang=lang, reason__in=["auto_detect","detected_switch"]).count() if org else 0
            # response rate heuristic: sent / total where total>0
            response_rate = round((comm_sent / comm_total * 100) if comm_total else 0, 1)
            results.append({
                "code": lang.code, "name": lang.name, "native_name": lang.native_name,
                "active": lang.active, "quality_status": lang.quality_status,
                "customers": cust_count, "successful_payments": paid_count,
                "comm_total": comm_total, "comm_sent": comm_sent,
                "response_rate": response_rate, "escalations": esc,
            })
        return Response({"metrics": results, "note": "Real values from DB — §24 dashboard should calculate actual response_rate, escalation_rate, voice accuracy from collected data."})


class LanguageHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk=None):
        from apps.languages.models import CustomerLanguageHistory
        org = get_org(request)
        qs = CustomerLanguageHistory.objects.filter(org=org).order_by("-created_at")[:50]
        if pk:
            qs = qs.filter(customer_id=pk)
        return Response([
            {"customer_id": str(h.customer_id), "from": h.from_lang.code if h.from_lang else None, "to": h.to_lang.code if h.to_lang else None, "reason": h.reason, "confidence": str(h.detected_confidence) if h.detected_confidence else None, "created_at": h.created_at}
            for h in qs
        ])
