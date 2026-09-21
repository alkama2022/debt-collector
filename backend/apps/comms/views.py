from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import CommunicationEvent, CommunicationPreference
from .serializers import CommunicationEventSerializer, CommunicationPreferenceSerializer

class CommunicationEventList(generics.ListCreateAPIView):
    serializer_class = CommunicationEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["channel", "status", "customer", "invoice"]
    ordering = ["-created_at"]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return CommunicationEvent.objects.none()
        return CommunicationEvent.objects.for_org(org)

    def perform_create(self, serializer):
        org = getattr(self.request, "org", None)
        idem = self.request.headers.get("X-Idempotency-Key") or self.request.headers.get("Idempotency-Key")
        serializer.save(org=org, idempotency_key=idem or serializer.validated_data.get("idempotency_key"))

class CommunicationEventDetail(generics.RetrieveAPIView):
    serializer_class = CommunicationEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return CommunicationEvent.objects.none()
        return CommunicationEvent.objects.for_org(org)

class CommunicationPreferenceList(generics.ListCreateAPIView):
    serializer_class = CommunicationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return CommunicationPreference.objects.none()
        return CommunicationPreference.objects.filter(org=org)

    def perform_create(self, serializer):
        serializer.save(org=getattr(self.request, "org", None))
