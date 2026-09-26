# §34 — per-communication AI audit trail. Separate from the generic AuditLog
# because this answers "why did the AI say that, in which language?".

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("tenancy", "0001_initial"),
        ("customers", "0001_initial"),
        ("ai", "0002_conversation_language_memory"),
        ("comms", "0001_initial"),
        ("voice", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AICommunicationAudit",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("language_selected", models.CharField(blank=True, default="", max_length=10)),
                ("language_detected", models.CharField(blank=True, default="", max_length=10)),
                ("secondary_language", models.CharField(blank=True, default="", max_length=10)),
                ("detection_confidence", models.DecimalField(blank=True, decimal_places=3, max_digits=4, null=True)),
                ("language_source", models.CharField(blank=True, default="", max_length=24)),
                ("channel", models.CharField(blank=True, default="", max_length=16)),
                ("ai_model", models.CharField(blank=True, default="", max_length=64)),
                ("prompt_version", models.CharField(blank=True, default="", max_length=64)),
                ("template_id", models.CharField(blank=True, default="", max_length=64)),
                ("request_summary", models.TextField(blank=True, default="")),
                ("response_text", models.TextField(blank=True, default="")),
                ("translation_status", models.CharField(blank=True, default="", max_length=24)),
                ("staff_translation", models.TextField(blank=True, default="")),
                ("voice_provider", models.CharField(blank=True, default="", max_length=32)),
                ("voice_id", models.CharField(blank=True, default="", max_length=64)),
                ("stt_confidence", models.DecimalField(blank=True, decimal_places=3, max_digits=4, null=True)),
                ("call_status", models.CharField(blank=True, default="", max_length=16)),
                ("recording_url", models.CharField(blank=True, default="", max_length=256)),
                (
                    "outcome",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("sent", "Sent"),
                            ("received", "Received"),
                            ("escalated", "Escalated"),
                            ("human_handoff", "Handled By Human"),
                            ("failed", "Failed"),
                        ],
                        default="",
                        max_length=24,
                    ),
                ),
                ("escalated", models.BooleanField(default=False)),
                (
                    "escalation_reason",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("low_confidence", "Low Confidence"),
                            ("no_native_voice", "No Native Voice"),
                            ("customer_request", "Customer Request"),
                            ("dispute", "Dispute"),
                            ("stt_unreliable", "Speech Recognition Unreliable"),
                        ],
                        default="",
                        max_length=24,
                    ),
                ),
                ("corrected", models.BooleanField(default=False)),
                ("tokens", models.IntegerField(blank=True, null=True)),
                ("cost_minor", models.IntegerField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "org",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ai_comm_audits",
                        to="tenancy.organization",
                    ),
                ),
                (
                    "customer",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="ai_comm_audits",
                        to="customers.customer",
                    ),
                ),
                (
                    "conversation",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ai_comm_audits",
                        to="ai.aiconversation",
                    ),
                ),
                (
                    "comm_event",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="ai_comm_audits",
                        to="comms.communicationevent",
                    ),
                ),
                (
                    "voice_call",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="ai_comm_audits",
                        to="voice.voicecall",
                    ),
                ),
                (
                    "handled_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="ai_comm_handled",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "ai_communication_audits",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="aicommunicationaudit",
            index=models.Index(fields=["org", "created_at"], name="ai_audit_org_created_idx"),
        ),
        migrations.AddIndex(
            model_name="aicommunicationaudit",
            index=models.Index(fields=["org", "language_selected"], name="ai_audit_org_lang_idx"),
        ),
        migrations.AddIndex(
            model_name="aicommunicationaudit",
            index=models.Index(fields=["customer", "created_at"], name="ai_audit_cust_created_idx"),
        ),
        migrations.AddIndex(
            model_name="aicommunicationaudit",
            index=models.Index(fields=["org", "escalated"], name="ai_audit_org_escal_idx"),
        ),
    ]
