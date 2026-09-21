from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Customer
from .serializers import CustomerSerializer

class CustomerListCreate(generics.ListCreateAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["customer_code", "opt_out"]
    search_fields = ["name", "customer_code", "email", "phone"]
    ordering_fields = ["created_at", "name", "outstanding"]
    ordering = ["-created_at"]

    def _get_org(self):
        org = getattr(self.request, "org", None)
        if org is None and hasattr(self.request, "user") and self.request.user.is_authenticated:
            m = self.request.user.memberships.select_related("org").first()
            if m:
                org = m.org
        return org

    def get_queryset(self):
        org = self._get_org()
        if org is None:
            return Customer.objects.none()
        qs = Customer.objects.for_org(org).filter(deleted_at__isnull=True)
        return qs

    def perform_create(self, serializer):
        serializer.save()

class CustomerDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _get_org(self):
        org = getattr(self.request, "org", None)
        if org is None and hasattr(self.request, "user") and self.request.user.is_authenticated:
            m = self.request.user.memberships.select_related("org").first()
            if m:
                org = m.org
        return org

    def get_queryset(self):
        org = self._get_org()
        if org is None:
            return Customer.objects.none()
        return Customer.objects.for_org(org).filter(deleted_at__isnull=True)

    def perform_destroy(self, instance):
        from django.utils import timezone
        instance.deleted_at = timezone.now()
        instance.save(update_fields=["deleted_at"])
