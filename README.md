# CollectNaija � Production-Grade SaaS Frontend

> **Know who owes you. Know how much. Know when they promised to pay. Follow up automatically.**

Mobile-first, trustworthy, enterprise-capable SaaS for Nigerian businesses � global-ready.

## Stack
- Vite + React 18 + TypeScript
- TailwindCSS (design system: Inter, brand #0f4c81, semantic green/amber/red)
- React Router 6, Recharts, lucide-react, dayjs
- API-ready: `VITE_API_BASE_URL`, JWT, structured error contract `{success:false, message, errors}`

## Run

### Frontend
```bash
npm install
npm run dev    # http://localhost:5173
npm run build
npm run preview
```

Env: `VITE_API_BASE_URL=http://localhost:8000/api/v1` (see `.env.example`)

### Backend (required — the app is useless without it)
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # then edit DATABASE_URL / secrets

python manage.py migrate
python manage.py seed_billing   # REQUIRED — creates plans, features, coupons
python manage.py runserver 8000
```

`seed_billing` is **not optional**. Without it the `billing_plan` table is
empty, `/billing/plans` returns `{"count": 0}`, and every
`/billing/subscribe` call fails. It is idempotent (`get_or_create`), so it is
safe to re-run on every deploy — `render.yaml` and the `Dockerfile` already do.

Optional demo data (org, users, customers, invoices):
```bash
python backend/seed.py
```

### Docker
```bash
docker compose up
```
The `api` service runs `migrate && seed_billing` via the `Dockerfile` CMD.
Do not add a `command:` override to that service — it silently skips both.

## Structure
```
src/
  components/ui  Button, Input, Select, Badge, Card, Modal, Skeleton, EmptyState, Toast
  layouts        AppShell (desktop sidebar + bottom nav, 44px targets, offline-aware)
  pages          Landing, Login/Signup, Onboarding (8-step), Dashboard, Customers, CustomerDetail, Invoices, InvoiceDetail, Payments, Reminders, Reports, Settings
  services       api.ts (apiFetch, JWT), mock.ts (demo data labelled)
  types, utils/format, i18n (keys), config, hooks/useAuth
```

## Key UX Implementations (per spec)
- **Landing**: hero, problem/solution, preview (demo labelled), features, industries, pricing (configurable), FAQ, final CTA � no fake social proof
- **Auth**: JWT, protected routes, session handling; signup minimal fields
- **Onboarding**: 8 steps (name ? type ? country ? currency ? size ? tracking ? customer ? invoice) ? "You are ready to start collecting."
- **Dashboard**: greet, KPIs (Total Outstanding ?2.45M etc from API), Needs Attention (overdue cards with View/Remind), Cash-flow AreaChart (7/30/90/365, mobile-readable)
- **Customers/Invoices/Payments/Reminders/Reports/Settings**: search/filter/sort, cards on mobile ? table on desktop, modals with labels, validation, preserve input, disable during submit, field errors from API contract, empty/error/skeleton states, status badges (color+text+icon)
- **Invoices**: items, discount/tax, subtotal/total/balance � backend-calculated (frontend preview only, no float authority)
- **Payments**: methods configurable, status pending/successful/failed/refunded, receipt (business/customer/invoice/ref/date/method/balance) � never success from click alone
- **Reminders**: scheduled/sent/failed/cancelled, channels WhatsApp/SMS/Email, template variables `{{customer_name}}` etc + live preview
- **Mobile**: bottom nav Home/Customers/Invoices/Payments/More, touch 44px, no overflow, large targets, horizontal scroll only where needed
- **Trust**: no secrets in frontend, last login/sessions, audit log, subscription transparent, demo workspace isolated (`Demo Workspace` badge), analytics stubs (no PII)
- **Performance**: lazy-ready, pagination, manualChunks (vendor/chart/ui), compressed, skeleton loaders, pagination-ready
- **Offline**: `navigator.onLine` banner + "You are offline..." messaging; payments simulate offline
- **A11y**: semantic HTML, focus rings, keyboard nav, screen-reader labels, color+text badges, reduced-motion
- **i18n**: `src/i18n` keys (English default, NGN, Africa/Lagos), currency/locale ready
