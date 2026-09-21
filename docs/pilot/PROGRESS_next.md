# Next Tracks Completed

## Invoices/Dashboard live
- src/pages/Invoices.tsx — fetches live customers/invoices, create via POST /invoices with X-Idempotency-Key, Decimal calc backend.
- src/pages/Dashboard.tsx — live KPIs from /customers, /invoices, /payments when isLive=true.
- Build: npm run build 2402 modules OK.

## Automation Beat
- backend/apps/collections/tasks.py — enqueue_due_reminders every 5m, policy gate quiet_hours 20:00-08:00, max_contacts_per_day, idempotency_key org-invoice-date.
- backend/apps/webhooks/tasks.py — real HMAC paystack sha512 verify, parses reference/amount, creates Payment with provider_ref unique, signal cancels reminders.

## Verify
python backend/manage.py shell -c "from apps.collections.tasks import enqueue_due_reminders; enqueue_due_reminders()"
POST /api/v1/webhooks/payments/paystack with x-paystack-signature — returns 200, enqueues celery (eager in dev).

## Remaining
- Payments page live (same pattern)
- Seed beat schedule: python backend/manage.py shell -c "from django_celery_beat.models import PeriodicTask, CrontabSchedule; s,_=CrontabSchedule.objects.get_or_create(minute='*/5', hour='*'); PeriodicTask.objects.get_or_create(name='enqueue_due_reminders', defaults={'crontab':s,'task':'apps.collections.tasks.enqueue_due_reminders'})"
- Add Termii/Meta real provider keys to .env when ready.

