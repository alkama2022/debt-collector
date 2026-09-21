from django.urls import path
from .views import AuditLogList

urlpatterns = [
    path("audit/logs", AuditLogList.as_view(), name="audit-log-list"),
]
