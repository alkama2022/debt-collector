import os
from pathlib import Path
from decouple import config, Csv
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("DJANGO_SECRET_KEY", default="dev-secret-key-change-in-production-collectnaija-2026")
DEBUG = config("DEBUG", default=True, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="*", cast=Csv())

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # third party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    "django_celery_beat",
    "django_extensions",
    # local
    "apps.languages",
    "apps.tenancy",
    "apps.accounts",
    "apps.customers",
    "apps.invoices",
    "apps.payments",
    "apps.comms",
    "apps.collections",
    "apps.ai",
    "apps.voice",
    "apps.webhooks",
    "apps.audit",
    "apps.subscriptions",
    "apps.reports",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "apps.tenancy.middleware.CurrentOrgMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

WSGI_APPLICATION = "config.wsgi.application"
# Production DB (Aiven) — set via DATABASE_URL env var; example:
# postgres://avnadmin:<password>@pg-13185f2f-alkalineumarliman-4964.b.aivencloud.com:24903/defaultdb?sslmode=require
# Database — SQLite default for dev, Postgres via DATABASE_URL for prod
_DATABASE_URL = (config("DATABASE_URL", default="") or "").strip().strip("'\"")
# allow commented value in .env (starts with #) and placeholder with <redacted>
if _DATABASE_URL and not _DATABASE_URL.startswith("#") and "<redacted>" not in _DATABASE_URL:
    import urllib.parse as urlparse
    # support both postgres:// and postgresql://
    _url_str = _DATABASE_URL.replace("postgresql://", "postgres://")
    url = urlparse.urlparse(_url_str)
    qs = urlparse.parse_qs(url.query)
    # Aiven requires SSL — honor sslmode from query string
    _sslmode = qs.get("sslmode", [None])[0]
    _options = {}
    if _sslmode:
        _options["sslmode"] = _sslmode
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": url.path[1:] or "defaultdb",
            "USER": url.username,
            "PASSWORD": url.password,
            "HOST": url.hostname,
            "PORT": url.port or 5432,
            **({"OPTIONS": _options} if _options else {}),
        }
    }
    # Optional: warn if sslmode missing for Aiven host
    if url.hostname and "aivencloud.com" in url.hostname and "sslmode" not in _options:
        import warnings
        warnings.warn("DATABASE_URL for Aiven should include ?sslmode=require")
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-ng"
TIME_ZONE = config("TIME_ZONE", default="Africa/Lagos")
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# DRF
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_FILTER_BACKENDS": ("django_filters.rest_framework.DjangoFilterBackend", "rest_framework.filters.SearchFilter", "rest_framework.filters.OrderingFilter"),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_THROTTLE_CLASSES": ["rest_framework.throttling.UserRateThrottle", "rest_framework.throttling.AnonRateThrottle"],
    "DEFAULT_THROTTLE_RATES": {"user": "200/min", "anon": "30/min", "auth": "10/min"},
    "EXCEPTION_HANDLER": "apps.tenancy.exceptions.custom_exception_handler",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

CORS_ALLOWED_ORIGINS = config("CORS_ALLOWED_ORIGINS", default="http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000", cast=Csv())
CORS_ALLOW_CREDENTIALS = True
CORS_URLS_REGEX = r"^/(api|health).*$"
# In DEBUG, allow any localhost/127.0.0.1 origin to avoid dev confusion (browser may use 127.0.0.1 vs localhost)
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = False  # keep explicit list, but also allow regex via middleware
    CORS_ALLOWED_ORIGIN_REGEXES = [r"^http://(localhost|127\.0\.0\.1)(:\d+)?$"]

# Frontend doesn't send trailing slashes — disable Django's redirect
APPEND_SLASH = False

# Celery
CELERY_BROKER_URL = config("CELERY_BROKER_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = config("CELERY_RESULT_BACKEND", default="redis://localhost:6379/1")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"
CELERY_TASK_ALWAYS_EAGER = config("CELERY_TASK_ALWAYS_EAGER", default=False, cast=bool)

# CollectNaija
COLLECTNAIJA_CURRENCY_DEFAULT = "NGN"
COLLECTNAIJA_QUIET_HOURS_START = "20:00"
COLLECTNAIJA_QUIET_HOURS_END = "08:00"
# AI
AI_PROVIDER = config("AI_PROVIDER", default="mock")  # mock, openai, anthropic
OPENAI_API_KEY = config("OPENAI_API_KEY", default="")
ANTHROPIC_API_KEY = config("ANTHROPIC_API_KEY", default="")
# Payments
PAYSTACK_SECRET_KEY = config("PAYSTACK_SECRET_KEY", default="")
PAYSTACK_WEBHOOK_SECRET = config("PAYSTACK_WEBHOOK_SECRET", default="")
FLUTTERWAVE_SECRET_KEY = config("FLUTTERWAVE_SECRET_KEY", default="")
FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:5173")
# Comms — Provider selection
WHATSAPP_PROVIDER = config("WHATSAPP_PROVIDER", default="mock")  # mock, africastalking, twilio
VOICE_PROVIDER = config("VOICE_PROVIDER", default=WHATSAPP_PROVIDER)
EMAIL_PROVIDER = config("EMAIL_PROVIDER", default="auto")  # auto, mock

# Africa's Talking — Primary SMS/WhatsApp/Voice provider for Nigeria
AFRICASTALKING_USERNAME = config("AFRICASTALKING_USERNAME", default="sandbox")
AFRICASTALKING_API_KEY = config("AFRICASTALKING_API_KEY", default="")
AFRICASTALKING_SENDER_ID = config("AFRICASTALKING_SENDER_ID", default="CollectNaija")
AFRICASTALKING_WHATSAPP_SENDER = config("AFRICASTALKING_WHATSAPP_SENDER", default="")
AFRICASTALKING_CALLER_ID = config("AFRICASTALKING_CALLER_ID", default="")

# Email (SMTP)
EMAIL_BACKEND = config(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend" if DEBUG else "django.core.mail.backends.smtp.EmailBackend",
)
EMAIL_HOST = config("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="CollectNaija <noreply@collectnaija.com>")

# Celery Beat — Periodic task schedules
from celery.schedules import crontab  # noqa: E402
CELERY_BEAT_SCHEDULE = {
    # Dispatch queued communication events — every 2 minutes
    "dispatch-queued-events": {
        "task": "apps.comms.tasks.dispatch_queued_events",
        "schedule": 120.0,  # seconds
    },
    # Retry transiently-failed events — every hour
    "retry-failed-events": {
        "task": "apps.comms.tasks.retry_failed_events",
        "schedule": crontab(minute=0),  # top of every hour
    },
    # Enqueue due reminders from ReminderRules — every 5 minutes
    "enqueue-due-reminders": {
        "task": "apps.collections.tasks.enqueue_due_reminders",
        "schedule": 300.0,
    },
    # S34 retention: strip expired voice recordings and verbatim transcripts
    # from AI communication audits. Nightly, shortly after midnight so it never
    # competes with the 2-minute dispatch loop.
    "purge-expired-ai-audit-content": {
        "task": "apps.audit.tasks.purge_expired_ai_audit_content",
        "schedule": crontab(hour=1, minute=17),
    },
}

# ── Test overrides ────────────────────────────────────────────────────────────
# When running `manage.py test`, use a fast in-memory SQLite DB so tests
# don't need a live PostgreSQL connection and run quickly.
import sys
if "test" in sys.argv or "pytest" in sys.argv:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "test_db.sqlite3",
        }
    }
    # Run Celery tasks synchronously in tests (no broker needed)
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_TASK_EAGER_PROPAGATES = True
    # Use fast password hasher in tests
    PASSWORD_HASHERS = [
        "django.contrib.auth.hashers.MD5PasswordHasher",
    ]
    # Use in-memory email backend for tests
    EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
