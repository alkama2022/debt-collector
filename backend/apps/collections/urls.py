from django.urls import path
from .views import CollectionPolicyView, CampaignListCreate, CampaignDetail

urlpatterns = [
    path("collections/policy", CollectionPolicyView.as_view(), name="collection-policy"),
    path("collections/campaigns", CampaignListCreate.as_view(), name="campaign-list-create"),
    path("collections/campaigns/<uuid:pk>", CampaignDetail.as_view(), name="campaign-detail"),
]
