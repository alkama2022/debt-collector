from django.urls import path
from .views import SignupView, MeView

urlpatterns = [
    path("signup", SignupView.as_view(), name="auth-signup"),
    path("me", MeView.as_view(), name="auth-me"),
]
