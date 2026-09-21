import threading
_thread_locals = threading.local()

def get_current_org():
    return getattr(_thread_locals, "org", None)

def set_current_org(org):
    _thread_locals.org = org

def _resolve_org_for_user(user, headers):
    if not user or not user.is_authenticated:
        return None
    org_id = None
    if headers is not None:
        org_id = headers.get("X-Org-Id") or headers.get("X-Organization-Id")
        if not org_id:
            # case-insensitive fallback
            for k, v in headers.items():
                if k.lower() == "x-org-id":
                    org_id = v
                    break
    if org_id:
        from .models import Organization
        try:
            return Organization.objects.get(id=org_id, memberships__user=user)
        except Exception:
            return None
    m = user.memberships.select_related("org").first()
    if m:
        return m.org
    return None

class CurrentOrgMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Initial attempt (may be AnonymousUser for JWT at this stage)
        org = None
        if hasattr(request, "user") and request.user and request.user.is_authenticated:
            org = _resolve_org_for_user(request.user, request.headers)
        request.org = org
        set_current_org(org)
        response = self.get_response(request)
        # Post-view: if DRF authenticated user was set later, reconcile request.org for downstream (no effect on this response but sets thread local for future)
        try:
            from rest_framework.request import Request as DRFRequest
            # no-op
        except Exception:
            pass
        set_current_org(None)
        return response
