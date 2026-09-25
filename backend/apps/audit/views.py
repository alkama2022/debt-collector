from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import AuditLog
from .serializers import AuditLogSerializer
from apps.tenancy.org import get_org


class AuditLogList(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["action", "target_type", "actor"]

    def get_queryset(self):
        # SECURITY: always scope audit logs to the current org
        org = get_org(self.request)
        if org is None:
            return AuditLog.objects.none()
        # AuditLog has no org FK directly — scope via actor memberships to this org
        # filter by target_type + actors who belong to this org, OR all if staff
        if self.request.user.is_staff:
            return AuditLog.objects.all().select_related("actor").order_by("-created_at")
        org_user_ids = org.memberships.values_list("user_id", flat=True)
        return (
            AuditLog.objects.filter(actor_id__in=org_user_ids)
            .select_related("actor")
            .order_by("-created_at")
        )


class AuditLogCreate(APIView):
    """Internal endpoint — create an audit log entry. Used by frontend and other services."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        action = request.data.get("action", "")
        target_type = request.data.get("target_type", "")
        target_id = request.data.get("target_id", "")
        if not action:
            return Response({"detail": "action required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            log = AuditLog(
                actor=request.user,
                action=action,
                target_type=target_type,
                target_id=str(target_id),
                before=request.data.get("before") or {},
                after=request.data.get("after") or {},
                ip=_get_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:512],
            )
            log.save()
            return Response(AuditLogSerializer(log).data, status=status.HTTP_201_CREATED)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


def _get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")
