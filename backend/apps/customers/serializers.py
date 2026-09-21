from rest_framework import serializers
from .models import Customer

class CustomerSerializer(serializers.ModelSerializer):
    customer_code = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Customer
        fields = ["id", "org", "customer_code", "name", "phone", "email", "outstanding", "overdue", "prefs", "communication_preference", "opt_out", "created_at", "deleted_at"]
        read_only_fields = ["id", "org", "outstanding", "overdue", "created_at", "deleted_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        org = getattr(request, "org", None) if request else None
        if org is None and request and hasattr(request, "user") and request.user.is_authenticated:
            m = request.user.memberships.select_related("org").first()
            if m:
                org = m.org
        if org is None:
            raise serializers.ValidationError({"org": "Organization context required. Provide X-Org-Id header."})
        validated_data["org"] = org
        if not validated_data.get("customer_code"):
            import uuid as _uuid
            validated_data["customer_code"] = f"CUS-{str(_uuid.uuid4())[:8].upper()}"
        return super().create(validated_data)
