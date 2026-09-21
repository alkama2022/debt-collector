from django.urls import path
from .views import PaymentWebhookView

urlpatterns = [
    path("webhooks/payments/<str:provider>", PaymentWebhookView.as_view(), name="webhook-payments"),
]
