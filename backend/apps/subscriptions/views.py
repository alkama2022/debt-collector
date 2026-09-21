from rest_framework import generics, permissions
from .models import Subscription
from .serializers import SubscriptionSerializer

class SubscriptionDetail(generics.RetrieveUpdateAPIView):
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        org = getattr(self.request, "org", None)
        if org is None:
            from rest_framework.exceptions import NotFound
            raise NotFound("Organization context required")
        obj, _ = Subscription.objects.get_or_create(org=org, defaults={"plan": Subscription.Plan.FREE})
        return obj
