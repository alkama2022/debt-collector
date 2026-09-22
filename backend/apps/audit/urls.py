from django.urls import path
from .views import AuditLogList, AuditLogCreate

urlpatterns = [
    path("audit/logs", AuditLogList.as_view(), name="audit-log-list"),
    path("audit/logs/create", AuditLogCreate.as_view(), name="audit-log-create"),
]
