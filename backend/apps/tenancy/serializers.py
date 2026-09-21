from rest_framework import serializers
from .models import Organization

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["id", "slug", "name", "country", "currency", "timezone", "is_demo", "created_at"]
        read_only_fields = ["id", "created_at", "is_demo"]
