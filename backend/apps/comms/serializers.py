from rest_framework import serializers
from .models import CommunicationEvent, CommunicationPreference

class CommunicationEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunicationEvent
        fields = ["id", "org", "invoice", "customer", "channel", "template_id", "status", "provider_msg_id", "idempotency_key", "scheduled_for", "sent_at", "cost_minor", "error_code", "created_at"]
        read_only_fields = ["id", "org", "provider_msg_id", "sent_at", "created_at"]

class CommunicationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunicationPreference
        fields = ["id", "org", "customer", "channel", "enabled", "opted_out_at", "created_at"]
        read_only_fields = ["id", "created_at"]
