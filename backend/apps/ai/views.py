from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import AIConversation, PromiseToPay
from .serializers import AIConversationSerializer, PromiseToPaySerializer

class AIConversationListCreate(generics.ListCreateAPIView):
    serializer_class = AIConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["state", "channel", "customer", "invoice"]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return AIConversation.objects.none()
        return AIConversation.objects.for_org(org).prefetch_related("messages")

    def perform_create(self, serializer):
        serializer.save(org=getattr(self.request, "org", None))

class AIConversationDetail(generics.RetrieveUpdateAPIView):
    serializer_class = AIConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return AIConversation.objects.none()
        return AIConversation.objects.for_org(org)

class PromiseListCreate(generics.ListCreateAPIView):
    serializer_class = PromiseToPaySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return PromiseToPay.objects.none()
        return PromiseToPay.objects.filter(org=org)

    def perform_create(self, serializer):
        serializer.save(org=getattr(self.request, "org", None))
