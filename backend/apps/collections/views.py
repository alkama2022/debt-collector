from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import CollectionPolicy, Campaign
from .serializers import CollectionPolicySerializer, CampaignSerializer

class CollectionPolicyView(generics.RetrieveUpdateAPIView):
    serializer_class = CollectionPolicySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        org = getattr(self.request, "org", None)
        if org is None:
            from rest_framework.exceptions import NotFound
            raise NotFound("Organization context required")
        obj, _ = CollectionPolicy.objects.get_or_create(org=org, defaults={"reminder_intervals": [0, 3, 7]})
        return obj

class CampaignListCreate(generics.ListCreateAPIView):
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return Campaign.objects.none()
        return Campaign.objects.filter(org=org)

    def perform_create(self, serializer):
        org = getattr(self.request, "org", None)
        if org is None and hasattr(self.request, "user") and self.request.user.is_authenticated:
            m = self.request.user.memberships.select_related("org").first()
            org = m.org if m else None
        if org:
            from apps.subscriptions.entitlements import check_feature_access
            from rest_framework.exceptions import PermissionDenied
            allowed, reason = check_feature_access(org, "COLLECTION_CAMPAIGNS")
            if not allowed:
                raise PermissionDenied({"detail": reason, "code": "FEATURE_NOT_ENTITLED"})
        serializer.save(org=org)

class CampaignDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return Campaign.objects.none()
        return Campaign.objects.filter(org=org)
