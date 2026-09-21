from rest_framework import serializers
from .models import Subscription

class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ["id", "org", "plan", "status", "current_period_end", "created_at", "updated_at"]
        read_only_fields = ["id", "org", "created_at", "updated_at"]
