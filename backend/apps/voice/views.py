from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import VoiceCall, CallAttempt
from .serializers import VoiceCallSerializer, CallAttemptSerializer

class VoiceCallListCreate(generics.ListCreateAPIView):
    serializer_class = VoiceCallSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "customer", "invoice"]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return VoiceCall.objects.none()
        return VoiceCall.objects.for_org(org).prefetch_related("attempts")

    def perform_create(self, serializer):
        serializer.save(org=getattr(self.request, "org", None))

class VoiceCallDetail(generics.RetrieveUpdateAPIView):
    serializer_class = VoiceCallSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return VoiceCall.objects.none()
        return VoiceCall.objects.for_org(org)
