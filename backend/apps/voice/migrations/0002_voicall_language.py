# §9/§10/§22 — per-call language tracking and speech-recognition confidence.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("voice", "0001_initial"),
        ("languages", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="voicecall",
            name="language",
            field=models.ForeignKey(
                blank=True,
                help_text="Language the agent spoke on this call",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="voice_calls",
                to="languages.language",
            ),
        ),
        migrations.AddField(
            model_name="voicecall",
            name="language_source",
            field=models.CharField(
                blank=True,
                default="",
                help_text="customer_voice_pref | customer_pref | conversation | org_default | fallback",
                max_length=24,
            ),
        ),
        migrations.AddField(
            model_name="voicecall",
            name="voice_id",
            field=models.CharField(
                blank=True, default="", help_text="TTS voice actually used", max_length=64
            ),
        ),
        migrations.AddField(
            model_name="voicecall",
            name="voice_provider",
            field=models.CharField(blank=True, default="", max_length=32),
        ),
        migrations.AddField(
            model_name="voicecall",
            name="voice_usable",
            field=models.BooleanField(
                default=True,
                help_text="False when no native voice existed and we should not have called (S22)",
            ),
        ),
        migrations.AddField(
            model_name="voicecall",
            name="detected_language",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Language detected from the customer's speech (S10)",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="voicecall",
            name="stt_confidence",
            field=models.DecimalField(
                blank=True,
                decimal_places=3,
                help_text="Speech-to-text confidence for the last turn (S10)",
                max_digits=4,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="voicecall",
            name="language_switch_count",
            field=models.PositiveIntegerField(
                default=0, help_text="Spoken language switches (S9 step 6)"
            ),
        ),
        migrations.AddField(
            model_name="voicecall",
            name="escalated",
            field=models.BooleanField(default=False, help_text="Agent handed off to a human (S23)"),
        ),
        migrations.AddField(
            model_name="voicecall",
            name="escalation_reason",
            field=models.CharField(blank=True, default="", max_length=32),
        ),
        migrations.AddField(
            model_name="callattempt",
            name="stt_text",
            field=models.TextField(
                blank=True, default="", help_text="Per-turn transcript, for diagnosing bad STT"
            ),
        ),
        migrations.AddField(
            model_name="callattempt",
            name="stt_confidence",
            field=models.DecimalField(
                blank=True, decimal_places=3, max_digits=4, null=True
            ),
        ),
        migrations.AddField(
            model_name="callattempt",
            name="detected_language",
            field=models.CharField(blank=True, default="", max_length=10),
        ),
        migrations.AddIndex(
            model_name="voicecall",
            index=models.Index(fields=["org", "language"], name="voice_calls_org_lang_idx"),
        ),
    ]
