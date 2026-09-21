from django.urls import path
from .views import CommunicationEventList, CommunicationEventDetail, CommunicationPreferenceList, ReminderRuleListCreate, ReminderRuleDetail, ReminderRuleRunView

urlpatterns = [
    path("comms/events", CommunicationEventList.as_view(), name="comm-event-list"),
    path("comms/events/<uuid:pk>", CommunicationEventDetail.as_view(), name="comm-event-detail"),
    path("comms/preferences", CommunicationPreferenceList.as_view(), name="comm-pref-list"),
    path("comms/rules", ReminderRuleListCreate.as_view(), name="reminder-rule-list"),
    path("comms/rules/<uuid:pk>", ReminderRuleDetail.as_view(), name="reminder-rule-detail"),
    path("comms/rules/<uuid:pk>/run", ReminderRuleRunView.as_view(), name="reminder-rule-run"),
    path("comms/rules/run-all", ReminderRuleRunView.as_view(), name="reminder-rule-run-all"),
]
