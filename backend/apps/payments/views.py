from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from django.db import IntegrityError
from rest_framework.response import Response
from rest_framework import status
from .models import Payment
from .serializers import PaymentSerializer

class PaymentListCreate(generics.ListCreateAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "provider", "currency", "invoice"]
    search_fields = ["provider_ref"]
    ordering = ["-created_at"]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return Payment.objects.none()
        return Payment.objects.for_org(org).select_related("invoice")

    def create(self, request, *args, **kwargs):
        idem_key = request.headers.get("X-Idempotency-Key") or request.headers.get("Idempotency-Key") or request.data.get("idempotency_key")
        if idem_key:
            org = getattr(request, "org", None)
            if org is not None:
                existing = Payment.objects.filter(idempotency_key=idem_key, org=org).first()
                if existing:
                    serializer = self.get_serializer(existing)
                    return Response(serializer.data, status=status.HTTP_200_OK)
        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError as e:
            return Response({"success": False, "message": "Idempotency conflict", "errors": str(e)}, status=status.HTTP_409_CONFLICT)

class PaymentDetail(generics.RetrieveUpdateAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return Payment.objects.none()
        return Payment.objects.for_org(org)
