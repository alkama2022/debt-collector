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
        from django.utils import timezone
        event = WebhookEvent.objects.get(id=event_id)
        payload = event.payload or {}
        # Expected paystack: event="charge.success", data.reference, data.amount (kobo), data.metadata.invoice_id
        raw_event = payload.get("event") or payload.get("type") or ""
        data = payload.get("data") if isinstance(payload.get("data"), dict) else payload
        # Only process successful charges
        if raw_event and raw_event not in ("charge.success", "charge.successful", "successful", "success"):
            # Still allow payloads without event name (manual test) but log
            if "charge" in raw_event and "failed" in raw_event:
                logger.info("Skipping failed charge event %s", raw_event)
                event.processed = True
                event.save(update_fields=["processed"])
                return True
        ref = str(data.get("reference") or data.get("provider_ref") or event.event_id)
        amount_minor = int(data.get("amount") or 0)
        amount = Decimal(amount_minor) / Decimal(100) if amount_minor else Decimal("0.00")
        # Resolve invoice: priority metadata.invoice_id > metadata.invoice_number > org+amount
        invoice = None
        org = None
        metadata = data.get("metadata") or payload.get("metadata") or {}
        # Paystack metadata can be dict with invoice_id
        invoice_id = metadata.get("invoice_id") or data.get("invoice_id") or metadata.get("invoice")
        org_id = metadata.get("org_id") or data.get("org_id") or payload.get("org_id")
        if invoice_id:
            try:
                invoice = Invoice.objects.filter(pk=invoice_id).first()
                if invoice:
                    org = invoice.org
            except Exception:
                pass
        if not invoice and metadata.get("invoice_number"):
            try:
                inv_no = metadata.get("invoice_number")
                if org_id:
                    org = Organization.objects.filter(id=org_id).first()
                    if org:
                        invoice = Invoice.objects.filter(org=org, invoice_number=inv_no).first()
                if not invoice:
                    invoice = Invoice.objects.filter(invoice_number=inv_no).first()
                    if invoice:
                        org = invoice.org
            except Exception:
                pass
        if not invoice and org_id:
            try:
                org = Organization.objects.get(id=org_id)
                # try pending payment with same reference to resolve org/invoice
                pending = Payment.objects.filter(provider_ref=ref).first()
                if pending and pending.invoice:
                    invoice = pending.invoice
                    org = pending.org
                else:
                    invoice = Invoice.objects.filter(org=org, status__in=["sent","partial","overdue"]).first()
            except Exception:
                pass
        # Fallback: pending payment with same ref
        if not invoice:
            pending = Payment.objects.filter(provider_ref=ref).first()
            if pending and pending.invoice:
                invoice = pending.invoice
                org = pending.org
        if not invoice and amount:
            invoice = Invoice.objects.filter(balance=amount).first()
            if invoice:
                org = invoice.org
        if not invoice:
            logger.warning("No invoice matched for webhook %s ref %s amount %s", event_id, ref, amount)
            event.processed = True
            event.save(update_fields=["processed"])
            return True
        if not org:
            org = invoice.org
        # Upsert successful payment
        existing = Payment.objects.filter(provider_ref=ref).first()
        if existing:
            if existing.status != "successful":
                existing.status = "successful"
                existing.verified_at = timezone.now()
                if amount and Decimal(amount) != Decimal("0.00"):
                    existing.amount = Decimal(amount)
                existing.save(update_fields=["status", "verified_at", "amount"])
                logger.info("Verified pending payment %s -> successful", ref)
            else:
                logger.info("Idempotent replay for %s", ref)
        else:
            pay_amount = amount if amount and Decimal(amount) != Decimal("0.00") else invoice.balance
            Payment.objects.create(
                org=org, invoice=invoice, amount=pay_amount,
                currency=invoice.currency, status="successful",
                provider=event.provider if event.provider in ("paystack","flutterwave") else "paystack",
                provider_ref=ref,
                idempotency_key=f"{event.provider}:{ref}",
                verified_at=timezone.now(),
            )
            logger.info("Created successful payment %s for invoice %s via %s amount %s", ref, invoice.invoice_number, event.provider, pay_amount)
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
