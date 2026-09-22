from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import VoiceCall, CallAttempt
from .serializers import VoiceCallSerializer, CallAttemptSerializer

class VoiceCallListCreate(generics.ListCreateAPIView):
    serializer_class = VoiceCallSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "customer", "invoice"]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return VoiceCall.objects.none()
        return VoiceCall.objects.for_org(org).prefetch_related("attempts")

    def perform_create(self, serializer):
        org = getattr(self.request, "org", None)
        if org is None and hasattr(self.request, "user") and self.request.user.is_authenticated:
            m = self.request.user.memberships.select_related("org").first()
            org = m.org if m else None
        if org:
            from apps.subscriptions.entitlements import check_feature_access, check_limit
            from rest_framework.exceptions import PermissionDenied
            allowed, reason = check_feature_access(org, "AI_VOICE")
            if not allowed:
                raise PermissionDenied({"detail": reason, "code": "FEATURE_NOT_ENTITLED", "upgrade": "professional"})
            # metering: check voice minutes before allowing
            allowed2, reason2, info = check_limit(org, "AI_VOICE_MINUTES", 1)
            if not allowed2:
                raise PermissionDenied({"detail": reason2, "code": "USAGE_LIMIT_REACHED"})
        obj = serializer.save(org=org)
        if org:
            try:
                from apps.subscriptions.usage import commit_or_create_usage
                from django.utils import timezone
                commit_or_create_usage(org, "AI_VOICE", 1, idempotency_key=str(obj.id), unit="call", metadata={"voice_call_id": str(obj.id)})
            except Exception:
                pass

class VoiceCallDetail(generics.RetrieveUpdateAPIView):
    serializer_class = VoiceCallSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return VoiceCall.objects.none()
        return VoiceCall.objects.for_org(org)
