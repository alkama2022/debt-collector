from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Language, OrganizationLanguageSettings
from .serializers import LanguageSerializer, OrganizationLanguageSettingsSerializer


class LanguageListView(generics.ListAPIView):
    """GET /api/v1/languages — list all active languages, or all if ?all=true for admin."""
    serializer_class = LanguageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Language.objects.all()
        all_param = self.request.query_params.get("all")
        active_only = self.request.query_params.get("active")
        if all_param and all_param.lower() in ("1", "true", "yes"):
            return qs.order_by("code")
        # default: active only unless ?active=false
        if active_only is not None and active_only.lower() in ("0", "false", "no"):
            return qs.order_by("code")
        return qs.filter(active=True).order_by("code")


class LanguageDetailView(generics.RetrieveAPIView):
    serializer_class = LanguageSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Language.objects.all()
    lookup_field = "code"


class OrganizationLanguageSettingsView(APIView):
    """GET /api/v1/org/language-settings, PATCH /api/v1/org/language-settings"""
    permission_classes = [permissions.IsAuthenticated]

    def _get_org(self, request):
        org = getattr(request, "org", None)
        if org is None and hasattr(request, "user") and request.user.is_authenticated:
            m = request.user.memberships.select_related("org").first()
            if m:
                org = m.org
        return org

    def _get_or_create(self, org):
        obj, created = OrganizationLanguageSettings.objects.get_or_create(
            org=org,
            defaults={
                "dashboard_language_id": "en",
                "default_customer_language_id": "en",
                "fallback_language_id": "en",
            },
        )
        if created:
            # default supported = active languages
            active_codes = list(Language.objects.filter(active=True).values_list("code", flat=True))
            if active_codes:
                obj.supported_languages.set(Language.objects.filter(code__in=active_codes))
        return obj

    def get(self, request):
        org = self._get_org(request)
        if org is None:
            return Response({"detail": "Organization not found. Provide X-Org-Id header."}, status=status.HTTP_400_BAD_REQUEST)
        settings_obj = self._get_or_create(org)
        serializer = OrganizationLanguageSettingsSerializer(settings_obj)
        return Response(serializer.data)

    def patch(self, request):
        org = self._get_org(request)
        if org is None:
            return Response({"detail": "Organization not found. Provide X-Org-Id header."}, status=status.HTTP_400_BAD_REQUEST)
        settings_obj = self._get_or_create(org)
        serializer = OrganizationLanguageSettingsSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def put(self, request):
        return self.patch(request)
