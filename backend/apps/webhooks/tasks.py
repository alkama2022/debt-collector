from celery import shared_task
from decimal import Decimal
import logging
logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def process_webhook_event(self, event_id):
    try:
        from .models import WebhookEvent
        from apps.payments.models import Payment
        from apps.invoices.models import Invoice
        from apps.tenancy.models import Organization
        event = WebhookEvent.objects.get(id=event_id)
        payload = event.payload or {}
        # Expected paystack: data.reference, data.amount (in kobo), data.customer.email
        data = payload.get("data") if isinstance(payload.get("data"), dict) else payload
        ref = str(data.get("reference") or data.get("provider_ref") or event.event_id)
        amount_minor = int(data.get("amount") or 0)
        amount = Decimal(amount_minor) / Decimal(100) if amount_minor else Decimal("0.00")
        # Try to find invoice by reference or org context (simplified: first outstanding invoice)
        invoice = None
        org = None
        # Attempt to resolve org from metadata
        org_id = data.get("org_id") or payload.get("org_id")
        if org_id:
            try:
                org = Organization.objects.get(id=org_id)
                invoice = Invoice.objects.filter(org=org, status__in=["sent","partial","overdue"]).first()
            except Exception:
                pass
        if not invoice:
            # fallback: first invoice with same amount outstanding (heuristic for demo)
            invoice = Invoice.objects.filter(balance=amount).first()
        if invoice:
            org = invoice.org
            # idempotency: provider_ref unique
            if not Payment.objects.filter(provider_ref=ref).exists():
                Payment.objects.create(
                    org=org, invoice=invoice, amount=amount or invoice.balance,
                    currency=invoice.currency, status="successful",
                    provider=event.provider, provider_ref=ref,
                    idempotency_key=f"{event.provider}:{ref}"
                )
                logger.info("Created payment %s for invoice %s via %s", ref, invoice.invoice_number, event.provider)
            else:
                logger.info("Idempotent replay for %s", ref)
        else:
            logger.warning("No invoice matched for webhook %s ref %s", event_id, ref)
        event.processed = True
        event.save(update_fields=["processed"])
        return True
    except Exception as exc:
        logger.exception("Failed to process webhook %s: %s", event_id, exc)
        try:
            from .models import WebhookEvent
            ev = WebhookEvent.objects.filter(id=event_id).first()
            if ev:
                ev.error_code = str(exc)[:256]
                ev.save(update_fields=["error_code"])
        except Exception:
            pass
        raise self.retry(exc=exc, countdown=60)
