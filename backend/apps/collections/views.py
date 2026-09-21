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
        serializer.save(org=org)

class CampaignDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return Campaign.objects.none()
        return Campaign.objects.filter(org=org)
