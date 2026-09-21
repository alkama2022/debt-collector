import hmac
import hashlib
import uuid
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import WebhookEvent

def verify_signature(provider, payload_raw, signature):
    # Mock HMAC verify: if secret not set, accept; else check HMAC SHA512
    secret = ""
    if provider == "paystack":
        secret = getattr(settings, "PAYSTACK_WEBHOOK_SECRET", "")
    elif provider == "flutterwave":
        secret = getattr(settings, "FLUTTERWAVE_SECRET_KEY", "")
    if not secret:
        return True
    if not signature:
        return False
    expected = hmac.new(secret.encode(), payload_raw, hashlib.sha512).hexdigest()
    return hmac.compare_digest(expected, signature)

class PaymentWebhookView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, provider):
        provider = provider.lower()
        if provider not in ("paystack", "flutterwave", "manual"):
            return Response({"success": False, "message": "Unknown provider"}, status=status.HTTP_400_BAD_REQUEST)
        raw = request.body or b"{}"
        sig = request.headers.get("x-paystack-signature") or request.headers.get("X-Paystack-Signature") or request.headers.get("verif-hash") or request.headers.get("X-Signature") or ""
        if not verify_signature(provider, raw, sig):
            return Response({"success": False, "message": "Invalid signature"}, status=status.HTTP_401_UNAUTHORIZED)
        data = request.data if isinstance(request.data, dict) else {}
        event_id = str(data.get("event_id") or data.get("id") or data.get("event") or uuid.uuid4())
        # idempotent store
        event, created = WebhookEvent.objects.get_or_create(
            event_id=event_id,
            defaults={"provider": provider, "payload": data, "signature": sig},
        )
        if not created and event.provider != provider:
            event.provider = provider
            event.save(update_fields=["provider"])
        # enqueue celery task (stub)
        try:
            from .tasks import process_webhook_event
            process_webhook_event.delay(str(event.id))
        except Exception:
            pass
        return Response({"success": True, "data": {"event_id": event.event_id, "processed": event.processed}}, status=status.HTTP_200_OK)
