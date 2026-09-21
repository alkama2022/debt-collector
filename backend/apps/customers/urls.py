from django.urls import path
from .views import CustomerListCreate, CustomerDetail

urlpatterns = [
    path("customers", CustomerListCreate.as_view(), name="customer-list-create"),
    path("customers/<uuid:pk>", CustomerDetail.as_view(), name="customer-detail"),
]
