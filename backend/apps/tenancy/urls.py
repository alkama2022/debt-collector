from django.urls import path
from .views import OrganizationListCreateView, OrganizationDetailView, SwitchOrgView

urlpatterns = [
    path("organizations", OrganizationListCreateView.as_view(), name="org-list-create"),
    path("organizations/<uuid:pk>", OrganizationDetailView.as_view(), name="org-detail"),
    path("organizations/<uuid:pk>/switch", SwitchOrgView.as_view(), name="org-switch"),
]
