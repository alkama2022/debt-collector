from django.urls import path
from .views import VoiceCallListCreate, VoiceCallDetail

urlpatterns = [
    path("voice/calls", VoiceCallListCreate.as_view(), name="voice-call-list"),
    path("voice/calls/<uuid:pk>", VoiceCallDetail.as_view(), name="voice-call-detail"),
]
