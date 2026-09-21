from django.urls import path
from .views import CommunicationEventList, CommunicationEventDetail, CommunicationPreferenceList

urlpatterns = [
    path("comms/events", CommunicationEventList.as_view(), name="comm-event-list"),
    path("comms/events/<uuid:pk>", CommunicationEventDetail.as_view(), name="comm-event-detail"),
    path("comms/preferences", CommunicationPreferenceList.as_view(), name="comm-pref-list"),
]
