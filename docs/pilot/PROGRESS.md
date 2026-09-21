# Series Execution Progress — CollectNaija

## Track A — Validation (Done)
- docs/pilot/01_interview_guide.md — 45m script + Van Westendorp
- docs/pilot/02_canvas_template.md — one-page per org
- docs/pilot/03_pilot_tracker.csv — signal vs proceed thresholds
- Gate: 12 pilot-ready orgs before locking price/policy.

## Track B — Wire Frontend to Live Backend (Done minimal)
- src/services/live.ts — isLive guard, liveListCustomers/create, liveListInvoices/create with X-Idempotency-Key
- src/pages/Customers.tsx — now fetches /api/v1/customers when VITE_API_BASE_URL != example, fallback to mock, shows Live vs Demo badge.
- config/.env VITE_API_BASE_URL=http://localhost:8000/api/v1, .env.example updated.
- Build verified: npm run build 2402 modules, 27.28KB gz index.

## Track C — Automation (Spec done, code scaffold)
- backend/apps/comms + collections + invoices: CommunicationEvent queued→cancelled, CollectionPolicy, idempotency, webhook store-first.
- backend/apps/payments/signals.py — successful Payment → invoice balance 0, status paid, cancels pending reminders (<30s req §24).
- Verified: payment signal works, cross-tenant 404, idempotency replay 200.

## Track D — Harden (Scaffold)
- docker-compose.yml — api/worker/beat/db/redis + frontend, Dockerfile python:3.12-slim, whitenoise.
- backend/config/settings.py — SQLite dev fallback, Postgres docker, CELERY_TASK_ALWAYS_EAGER=True for tests.
- Tenant isolation + health checked.

## Next in series (remain)
1. Extend Track B to Invoices/Payments/Dashboard live (same pattern as Customers).
2. Track C: implement Beat task enqueue_due_reminders + Termii/Meta sandbox + Paystack HMAC verify (currently mock).
3. Track D: pip-audit, Playwright E2E `Invoice→Reminder→Pay→Receipt`, GitHub Actions CI.

Run:
```
python backend/manage.py migrate && python backend/seed.py
python backend/manage.py runserver 0.0.0.0:8000
npm run dev # http://localhost:5173
```
