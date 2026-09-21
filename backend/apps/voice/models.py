import uuid
from django.db import models
from apps.tenancy.models import TenantModel, TenantManager

class VoiceManager(TenantManager):
    pass

class VoiceCall(TenantModel):
    class Status(models.TextChoices):
        QUEUED = "queued", "Queued"
        RINGING = "ringing", "Ringing"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
        NO_ANSWER = "no_answer", "No Answer"
        BUSY = "busy", "Busy"
        CANCELLED = "cancelled", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey("customers.Customer", on_delete=models.SET_NULL, null=True, blank=True, related_name="voice_calls")
    invoice = models.ForeignKey("invoices.Invoice", on_delete=models.SET_NULL, null=True, blank=True, related_name="voice_calls")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.QUEUED)
    provider_call_id = models.CharField(max_length=128, blank=True, default="")
    from_number = models.CharField(max_length=32, blank=True, default="")
    to_number = models.CharField(max_length=32, blank=True, default="")
    duration_seconds = models.IntegerField(null=True, blank=True)
    recording_url = models.URLField(blank=True, default="")
    cost_minor = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = VoiceManager()

    class Meta:
        db_table = "voice_calls"
        indexes = [models.Index(fields=["org", "status"])]

    def __str__(self):
        return f"Call {self.id} {self.status}"

class CallAttempt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org = models.ForeignKey("tenancy.Organization", on_delete=models.RESTRICT, related_name="call_attempts")
    call = models.ForeignKey(VoiceCall, on_delete=models.CASCADE, related_name="attempts")
    attempt_number = models.IntegerField(default=1)
    status = models.CharField(max_length=16, choices=VoiceCall.Status.choices, default=VoiceCall.Status.QUEUED)
    provider_response = models.JSONField(default=dict, blank=True)
    error_code = models.CharField(max_length=64, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "call_attempts"
        ordering = ["attempt_number"]

    def __str__(self):
        return f"Attempt {self.attempt_number} for {self.call_id}"
