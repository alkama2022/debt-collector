from django.db.models.signals import post_save
from django.dispatch import receiver
from decimal import Decimal
from .models import Payment
from apps.invoices.models import Invoice
from apps.comms.models import CommunicationEvent

@receiver(post_save, sender=Payment)
def update_invoice_on_payment(sender, instance: Payment, created, **kwargs):
    if not created:
        return
    if instance.status != "successful":
        return
    invoice = instance.invoice
    if not invoice:
        return
    # Backend is source of truth: recalc balance
    # Sum all successful payments for invoice
    total_paid = Payment.objects.filter(invoice=invoice, status="successful").aggregate(
        s=__import__("django.db.models", fromlist=["Sum"] ).Sum("amount")
    )["s"] or Decimal("0.00")
    new_balance = max(Decimal("0.00"), invoice.total - total_paid)
    invoice.balance = new_balance
    if new_balance == Decimal("0.00"):
        invoice.status = Invoice.Status.PAID
    elif total_paid > Decimal("0.00"):
        invoice.status = Invoice.Status.PARTIAL
    invoice.save(update_fields=["balance", "status"])
    # Cancel pending reminders — critical §15/§29
    CommunicationEvent.objects.filter(
        invoice=invoice, status__in=["queued", "scheduled", "sending"]
    ).update(status="cancelled")
