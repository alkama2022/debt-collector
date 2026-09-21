from django.urls import path
from .views import PaymentListCreate, PaymentDetail, ReceiptPdfView, PaystackInitializeView, PaystackVerifyView

urlpatterns = [
    path("payments", PaymentListCreate.as_view(), name="payment-list-create"),
    path("payments/<uuid:pk>", PaymentDetail.as_view(), name="payment-detail"),
    path("payments/<uuid:pk>/receipt/pdf", ReceiptPdfView.as_view(), name="receipt-pdf"),
    path("payments/initialize", PaystackInitializeView.as_view(), name="payment-initialize"),
    path("payments/verify", PaystackVerifyView.as_view(), name="payment-verify"),
]
