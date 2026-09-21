from django.urls import path
from .views import InvoiceListCreate, InvoiceDetail

urlpatterns = [
    path("invoices", InvoiceListCreate.as_view(), name="invoice-list-create"),
    path("invoices/<uuid:pk>", InvoiceDetail.as_view(), name="invoice-detail"),
]
