from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from django.db import IntegrityError
from rest_framework.response import Response
from rest_framework import status as http_status
from .models import Invoice
from .serializers import InvoiceSerializer

class InvoiceListCreate(generics.ListCreateAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "customer", "currency", "invoice_number"]
    search_fields = ["invoice_number"]
    ordering_fields = ["created_at", "due_date", "total"]
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
            return Invoice.objects.none()
        qs = Invoice.objects.for_org(org).filter(deleted_at__isnull=True)
        # query param filtering already via filterset, but support status param explicitly
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs.select_related("customer").prefetch_related("items")

    def create(self, request, *args, **kwargs):
        # Idempotency handling via header
        idem_key = request.headers.get("X-Idempotency-Key") or request.headers.get("Idempotency-Key") or request.headers.get("X-IDEMPOTENCY-KEY")
        if idem_key:
            org = self._get_org()
            if org is not None:
                existing = Invoice.objects.filter(idempotency_key=idem_key, org=org).first()
                if existing:
                    serializer = self.get_serializer(existing)
                    return Response(serializer.data, status=http_status.HTTP_200_OK)
        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError as e:
            return Response({"success": False, "message": "Duplicate invoice or idempotency conflict", "errors": str(e)}, status=http_status.HTTP_409_CONFLICT)

class InvoiceDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InvoiceSerializer
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
            return Invoice.objects.none()
        return Invoice.objects.for_org(org).filter(deleted_at__isnull=True).prefetch_related("items")

    def perform_destroy(self, instance):
        from django.utils import timezone
        instance.deleted_at = timezone.now()
        instance.save(update_fields=["deleted_at"])
