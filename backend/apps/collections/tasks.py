from celery import shared_task
from django.utils import timezone
from datetime import datetime, time
import logging
logger = logging.getLogger(__name__)

@shared_task
def enqueue_due_reminders():
    """Beat every 5m — creates CommunicationEvent QUEUED per policy (§29)."""
    from apps.invoices.models import Invoice
    from apps.tenancy.models import Organization
    from apps.collections.models import CollectionPolicy
    from apps.comms.models import CommunicationEvent
    now = timezone.now()
    count = 0
    for org in Organization.objects.filter(deleted_at__isnull=True):
        policy, _ = CollectionPolicy.objects.get_or_create(org=org, defaults={"reminder_intervals": [-7,-2,0,2,7,14]})
        # Example: find invoices crossing a step (simplified: overdue Sent)
        invoices = Invoice.objects.for_org(org).filter(status__in=["sent","partial","overdue"], due_date__isnull=False, deleted_at__isnull=True)
        for inv in invoices:
            # Policy gate: quiet hours
            if _is_quiet_hours(now, org.timezone):
                continue
            # max contacts per day check (simplified)
            today_sends = CommunicationEvent.objects.filter(org=org, customer=inv.customer, created_at__date=now.date()).count()
            if today_sends >= getattr(policy, "max_contacts_per_day", 1):
                continue
            # idempotency guard already in view layer; here create with scheduled_for=now
            exists = CommunicationEvent.objects.filter(org=org, invoice=inv, scheduled_for__date=now.date(), channel="whatsapp").exists()
            if exists:
                continue
            # create QUEUED event (gateway will send)
            CommunicationEvent.objects.create(
                org=org, invoice=inv, customer=inv.customer,
                channel="whatsapp", status="queued", template_id="friendly_reminder",
                scheduled_for=now, idempotency_key=f"{org.id}-{inv.id}-{now.date()}-whatsapp"
            )
            count += 1
    logger.info("enqueue_due_reminders created %s events", count)
    return count

def _is_quiet_hours(dt: datetime, tz_name: str) -> bool:
    try:
        import zoneinfo
        tz = zoneinfo.ZoneInfo(tz_name)
        local = dt.astimezone(tz)
    except Exception:
        local = dt
    # 20:00-08:00 WAT default
    start = time(20,0); end = time(8,0)
    t = local.time()
    if start < end:
        return start <= t < end
    return t >= start or t < end
