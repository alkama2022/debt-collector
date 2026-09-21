from rest_framework import serializers
from .models import Payment, Receipt

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "org", "invoice", "amount", "currency", "status", "provider", "provider_ref", "idempotency_key", "verified_at", "created_at"]
        read_only_fields = ["id", "org", "verified_at", "created_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        org = getattr(request, "org", None) if request else None
        if org is None:
            raise serializers.ValidationError({"org": "Organization context required."})
        validated_data["org"] = org
        if not validated_data.get("idempotency_key") and request:
            hdr = request.headers.get("X-Idempotency-Key") or request.headers.get("Idempotency-Key")
            if hdr:
                validated_data["idempotency_key"] = hdr
        return super().create(validated_data)

class ReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receipt
        fields = ["id", "org", "payment", "receipt_number", "issued_at", "amount", "currency"]
        read_only_fields = ["id", "issued_at"]
