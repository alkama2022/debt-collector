import uuid
from django.db import models
from apps.tenancy.models import TenantModel, TenantManager

class CommsManager(TenantManager):
    pass

class CommunicationPreference(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org = models.ForeignKey("tenancy.Organization", on_delete=models.CASCADE, related_name="comm_preferences")
    customer = models.ForeignKey("customers.Customer", on_delete=models.CASCADE, related_name="comm_preferences")
    channel = models.CharField(max_length=16, choices=[("whatsapp","WhatsApp"),("sms","SMS"),("email","Email"),("voice","Voice")])
    enabled = models.BooleanField(default=True)
    opted_out_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "communication_preferences"
        unique_together = ("org", "customer", "channel")

    def __str__(self):
        return f"{self.customer} - {self.channel}"

class CommunicationEvent(TenantModel):
    class Channel(models.TextChoices):
        WHATSAPP = "whatsapp", "WhatsApp"
        SMS = "sms", "SMS"
        EMAIL = "email", "Email"
        VOICE = "voice", "Voice"

    class Status(models.TextChoices):
        QUEUED = "queued", "Queued"
        SENDING = "sending", "Sending"
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey("invoices.Invoice", on_delete=models.SET_NULL, null=True, blank=True, related_name="comm_events")
    customer = models.ForeignKey("customers.Customer", on_delete=models.SET_NULL, null=True, blank=True, related_name="comm_events")
    channel = models.CharField(max_length=16, choices=Channel.choices)
    template_id = models.CharField(max_length=128, blank=True, default="")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.QUEUED)
    provider_msg_id = models.CharField(max_length=128, blank=True, default="")
    idempotency_key = models.CharField(max_length=128, unique=True, null=True, blank=True)
    scheduled_for = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    cost_minor = models.IntegerField(null=True, blank=True, help_text="Cost in kobo")
    error_code = models.CharField(max_length=64, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    objects = CommsManager()

    class Meta:
        db_table = "communication_events"
        indexes = [
            models.Index(fields=["org", "channel"]),
            models.Index(fields=["org", "status"]),
        ]

    def __str__(self):
        return f"{self.channel} -> {self.customer} ({self.status})"
