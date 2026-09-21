from django.urls import path
from .views import LanguageListView, LanguageDetailView, OrganizationLanguageSettingsView

urlpatterns = [
    path("languages", LanguageListView.as_view(), name="language-list"),
    path("languages/<str:code>", LanguageDetailView.as_view(), name="language-detail"),
    path("org/language-settings", OrganizationLanguageSettingsView.as_view(), name="org-language-settings"),
]
