# Language memory for AI conversations (§20), per-message language trace
# (§6/§7/§27) and staff translation storage (§33).

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ai", "0001_initial"),
        ("languages", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="aiconversation",
            name="preferred_language",
            field=models.ForeignKey(
                blank=True,
                help_text="Snapshot of customer preferred_language at conversation start",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="ai_conversation_preferred",
                to="languages.language",
            ),
        ),
        migrations.AddField(
            model_name="aiconversation",
            name="conversation_language",
            field=models.ForeignKey(
                blank=True,
                help_text="Language currently being used in this conversation",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="ai_conversation_current",
                to="languages.language",
            ),
        ),
        migrations.AddField(
            model_name="aiconversation",
            name="language_source",
            field=models.CharField(
                blank=True,
                choices=[
                    ("customer_preferred", "Customer Preferred"),
                    ("detected", "Detected"),
                    ("conversation_memory", "Conversation Memory"),
                    ("business_fallback", "Business Fallback"),
                    ("system_fallback", "System Fallback"),
                ],
                default="",
                help_text="How conversation_language was chosen (audit + §20 continuity)",
                max_length=24,
            ),
        ),
        migrations.AddField(
            model_name="aiconversation",
            name="language_switch_count",
            field=models.PositiveIntegerField(
                default=0,
                help_text="Number of detected language switches in this conversation (§8)",
            ),
        ),
        migrations.AddField(
            model_name="aiconversation",
            name="code_switch_count",
            field=models.PositiveIntegerField(
                default=0, help_text="Number of mixed-language messages seen (§27)"
            ),
        ),
        migrations.AddField(
            model_name="aiconversation",
            name="language_updated_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="aimessage",
            name="language",
            field=models.ForeignKey(
                blank=True,
                help_text="Language this message was written in",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="ai_messages",
                to="languages.language",
            ),
        ),
        migrations.AddField(
            model_name="aimessage",
            name="detected_language",
            field=models.ForeignKey(
                blank=True,
                help_text="Language detected from the inbound text (§6)",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="ai_messages_detected",
                to="languages.language",
            ),
        ),
        migrations.AddField(
            model_name="aimessage",
            name="language_confidence",
            field=models.DecimalField(
                blank=True,
                decimal_places=3,
                help_text="Detection confidence 0-1 (§7)",
                max_digits=4,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="aimessage",
            name="secondary_language",
            field=models.ForeignKey(
                blank=True,
                help_text="Second language present in a mixed-language message (§27)",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="ai_messages_secondary",
                to="languages.language",
            ),
        ),
        migrations.AddField(
            model_name="aimessage",
            name="is_code_switched",
            field=models.BooleanField(
                default=False, help_text="Message mixed two languages (§27)"
            ),
        ),
        migrations.AddField(
            model_name="aimessage",
            name="was_language_switch",
            field=models.BooleanField(
                default=False,
                help_text="Language differed from the conversation's established language (§8)",
            ),
        ),
        migrations.AddField(
            model_name="aimessage",
            name="staff_translation",
            field=models.TextField(
                blank=True,
                default="",
                help_text="AI translation of `content` into the business owner's language (§33)",
            ),
        ),
        migrations.AddField(
            model_name="aimessage",
            name="staff_translation_language",
            field=models.CharField(
                blank=True, default="", help_text="Language of staff_translation", max_length=10
            ),
        ),
        migrations.AddField(
            model_name="aimessage",
            name="staff_translation_confidence",
            field=models.DecimalField(
                blank=True, decimal_places=3, max_digits=4, null=True
            ),
        ),
        migrations.AddField(
            model_name="aimessage",
            name="escalated",
            field=models.BooleanField(
                default=False,
                help_text="Low-confidence language handling triggered (§23)",
            ),
        ),
        migrations.AddIndex(
            model_name="aimessage",
            index=models.Index(
                fields=["conversation", "created_at"], name="ai_messages_conv_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="aiconversation",
            index=models.Index(
                fields=["org", "conversation_language"],
                name="ai_conversations_org_lang_idx",
            ),
        ),
    ]
