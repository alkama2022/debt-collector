from django.urls import path
from .views import AIConversationListCreate, AIConversationDetail, PromiseListCreate

urlpatterns = [
    path("ai/conversations", AIConversationListCreate.as_view(), name="ai-conversation-list"),
    path("ai/conversations/<uuid:pk>", AIConversationDetail.as_view(), name="ai-conversation-detail"),
    path("ai/promises", PromiseListCreate.as_view(), name="ai-promise-list"),
]
