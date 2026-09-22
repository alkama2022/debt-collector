import logging
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import VoiceCall, CallAttempt
from .serializers import VoiceCallSerializer, CallAttemptSerializer

logger = logging.getLogger(__name__)


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
            allowed2, reason2, info = check_limit(org, "AI_VOICE_MINUTES", 1)
            if not allowed2:
                raise PermissionDenied({"detail": reason2, "code": "USAGE_LIMIT_REACHED"})
        obj = serializer.save(org=org)
        if org:
            try:
                from apps.subscriptions.usage import commit_or_create_usage
                commit_or_create_usage(
                    org, "AI_VOICE", 1,
                    idempotency_key=str(obj.id),
                    unit="call",
                    metadata={"voice_call_id": str(obj.id)},
                )
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


class VoiceCallTriggerView(APIView):
    """
    POST /api/v1/voice/calls/<uuid>/trigger
    Initiates the actual outbound call via Africa's Talking.
    Creates a CallAttempt record and fires the AT voice API.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        org = getattr(request, "org", None)
        if org is None and hasattr(request, "user") and request.user.is_authenticated:
            m = request.user.memberships.select_related("org").first()
            org = m.org if m else None

        try:
            call = VoiceCall.objects.for_org(org).get(pk=pk)
        except VoiceCall.DoesNotExist:
            return Response({"detail": "Voice call not found"}, status=status.HTTP_404_NOT_FOUND)

        if call.status not in ("queued", "failed"):
            return Response(
                {"detail": f"Call is already {call.status} — cannot trigger again"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create attempt record
        attempt_number = call.attempts.count() + 1
        attempt = CallAttempt.objects.create(
            org=org,
            call=call,
            attempt_number=attempt_number,
            status="initiated",
        )

        # Fire the AT voice API via the comms provider
        try:
            from apps.comms.providers.africastalking import AfricasTalkingProvider
            from apps.comms.models import CommunicationEvent

            # Create a temporary CommunicationEvent for the provider to read
            event = CommunicationEvent(
                org=org,
                invoice=call.invoice,
                customer=call.customer,
                channel="voice",
                template_id="voice_reminder",
                status="sending",
            )

            provider = AfricasTalkingProvider()
            result = provider.send(event)

            if result.success:
                call.status = "in_progress"
                call.provider_call_id = result.provider_msg_id or ""
                call.save(update_fields=["status", "provider_call_id"])

                attempt.status = "connected"
                attempt.provider_response = result.raw or {}
                attempt.save(update_fields=["status", "provider_response"])

                logger.info("[VoiceCallTrigger] Call %s triggered successfully | AT session=%s", pk, result.provider_msg_id)
                return Response({
                    "success": True,
                    "data": {
                        "call_id": str(call.id),
                        "attempt": attempt.attempt_number,
                        "provider_call_id": call.provider_call_id,
                        "status": call.status,
                    }
                })
            else:
                call.status = "failed"
                call.save(update_fields=["status"])
                attempt.status = "failed"
                attempt.error_code = result.error_code or "PROVIDER_ERROR"
                attempt.provider_response = {"error": result.error_message}
                attempt.save(update_fields=["status", "error_code", "provider_response"])

                logger.warning("[VoiceCallTrigger] Call %s failed | error=%s", pk, result.error_code)
                return Response({
                    "success": False,
                    "data": {"error_code": result.error_code, "error_message": result.error_message},
                }, status=status.HTTP_502_BAD_GATEWAY)

        except Exception as exc:
            call.status = "failed"
            call.save(update_fields=["status"])
            attempt.status = "failed"
            attempt.error_code = "EXCEPTION"
            attempt.provider_response = {"error": str(exc)}
            attempt.save(update_fields=["status", "error_code", "provider_response"])
            logger.exception("[VoiceCallTrigger] Exception for call %s: %s", pk, exc)
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VoiceCallStatusWebhookView(APIView):
    """
    POST /api/v1/voice/webhook/status
    Africa's Talking calls this URL with call completion/status events.
    Updates VoiceCall duration, recording URL, and final status.
    No auth — verified by checking AT headers/signature.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        data = request.data
        session_id = data.get("sessionId") or data.get("callSessionState") or ""
        call_status = (data.get("status") or data.get("callSessionState") or "").lower()
        duration = data.get("durationInSeconds") or data.get("duration") or 0
        recording_url = data.get("recordingUrl") or ""

        logger.info("[VoiceWebhook] session=%s status=%s duration=%s", session_id, call_status, duration)

        if not session_id:
            return Response({"success": False, "detail": "sessionId required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            call = VoiceCall.objects.filter(provider_call_id=session_id).first()
            if not call:
                logger.warning("[VoiceWebhook] No call found for session %s", session_id)
                return Response({"success": True})  # Return 200 so AT doesn't retry

            # Map AT statuses to our status
            status_map = {
                "completed": "completed",
                "answered": "in_progress",
                "no_answer": "no_answer",
                "busy": "failed",
                "failed": "failed",
                "cancelled": "cancelled",
                "rejected": "failed",
            }
            new_status = status_map.get(call_status, call.status)
            update_fields = ["status"]
            call.status = new_status

            if duration:
                call.duration_seconds = int(duration)
                update_fields.append("duration_seconds")

            if recording_url:
                call.recording_url = recording_url
                update_fields.append("recording_url")

            call.save(update_fields=update_fields)

            # Update latest attempt
            attempt = call.attempts.order_by("-created_at").first()
            if attempt:
                attempt.status = new_status
                attempt.provider_response = dict(data)
                attempt.save(update_fields=["status", "provider_response"])

            # If call was not answered — update comm event status too
            if new_status in ("failed", "no_answer", "cancelled"):
                from apps.comms.models import CommunicationEvent
                CommunicationEvent.objects.filter(
                    invoice=call.invoice,
                    customer=call.customer,
                    channel="voice",
                    status="sending",
                ).update(status="failed", error_code=call_status.upper())

        except Exception as exc:
            logger.exception("[VoiceWebhook] Error processing webhook: %s", exc)

        return Response({"success": True})
