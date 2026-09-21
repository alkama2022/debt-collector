import uuid
from django.db import models
from apps.tenancy.models import TenantModel, TenantManager

class AIManager(TenantManager):
    pass

class AIConversation(TenantModel):
    class State(models.TextChoices):
        INVOICE_CREATED = "INVOICE_CREATED", "Invoice Created"
        REMINDER_SENT = "REMINDER_SENT", "Reminder Sent"
        CUSTOMER_REPLIED = "CUSTOMER_REPLIED", "Customer Replied"
        NEGOTIATING = "NEGOTIATING", "Negotiating"
        PROMISE_MADE = "PROMISE_MADE", "Promise Made"
        PROMISE_DUE = "PROMISE_DUE", "Promise Due"
        PAYMENT_RECEIVED = "PAYMENT_RECEIVED", "Payment Received"
        PAYMENT_FAILED = "PAYMENT_FAILED", "Payment Failed"
        ESCALATED = "ESCALATED", "Escalated"
        HUMAN_HANDOFF = "HUMAN_HANDOFF", "Human Handoff"
        RESOLVED = "RESOLVED", "Resolved"
        CANCELLED = "CANCELLED", "Cancelled"
        FOLLOW_UP = "FOLLOW_UP", "Follow Up"
        OVERDUE_NOTICE = "OVERDUE_NOTICE", "Overdue Notice"
        COLLECTION_CLOSED = "COLLECTION_CLOSED", "Collection Closed"

    class Channel(models.TextChoices):
        WHATSAPP = "whatsapp", "WhatsApp"
        SMS = "sms", "SMS"
        EMAIL = "email", "Email"
        VOICE = "voice", "Voice"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey("customers.Customer", on_delete=models.SET_NULL, null=True, blank=True, related_name="ai_conversations")
    invoice = models.ForeignKey("invoices.Invoice", on_delete=models.SET_NULL, null=True, blank=True, related_name="ai_conversations")
    state = models.CharField(max_length=32, choices=State.choices, default=State.INVOICE_CREATED)
    channel = models.CharField(max_length=16, choices=Channel.choices, default=Channel.WHATSAPP)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = AIManager()

    class Meta:
        db_table = "ai_conversations"
        indexes = [models.Index(fields=["org", "state"])]

    def __str__(self):
        return f"{self.id} - {self.state}"

class AIMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(AIConversation, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=16, choices=[("user","User"),("assistant","Assistant"),("system","System"),("tool","Tool")], default="user")
    content = models.TextField()
    tokens = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ai_messages"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.role}: {self.content[:40]}"

class AIAgentAction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(AIConversation, on_delete=models.CASCADE, related_name="actions")
    tool = models.CharField(max_length=128, help_text="Tool/function name")
    input = models.JSONField(default=dict, blank=True)
    output = models.JSONField(default=dict, blank=True)
    tokens = models.IntegerField(null=True, blank=True)
    cost_minor = models.IntegerField(null=True, blank=True)
    prompt_version = models.CharField(max_length=64, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ai_agent_actions"

    def __str__(self):
        return f"{self.tool} @ {self.created_at}"

class PromiseToPay(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        KEPT = "kept", "Kept"
        BROKEN = "broken", "Broken"
        CANCELLED = "cancelled", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org = models.ForeignKey("tenancy.Organization", on_delete=models.RESTRICT, related_name="promises")
    conversation = models.ForeignKey(AIConversation, on_delete=models.CASCADE, related_name="promises", null=True, blank=True)
    customer = models.ForeignKey("customers.Customer", on_delete=models.CASCADE, related_name="promises", null=True, blank=True)
    invoice = models.ForeignKey("invoices.Invoice", on_delete=models.CASCADE, related_name="promises", null=True, blank=True)
    promise_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "promise_to_pay"

    def __str__(self):
        return f"Promise {self.amount} on {self.promise_date} ({self.status})"
