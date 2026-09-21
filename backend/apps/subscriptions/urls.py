from django.urls import path
from .views import SubscriptionDetail

urlpatterns = [
    path("subscriptions/me", SubscriptionDetail.as_view(), name="subscription-detail"),
]
