# §21 — record which language each communication event was actually sent in,
# plus the verbatim body, so disputes and language reporting are provable.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("comms", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="communicationevent",
            name="language",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Language the message was rendered in (empty = resolved at send time)",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="communicationevent",
            name="language_source",
            field=models.CharField(
                blank=True,
                default="",
                help_text="event_override | customer_preferred | org_default | fallback",
                max_length=24,
            ),
        ),
        migrations.AddField(
            model_name="communicationevent",
            name="body_snapshot",
            field=models.TextField(
                blank=True,
                default="",
                help_text="Exact text sent - preserved so a dispute can be reconstructed",
            ),
        ),
        migrations.AddIndex(
            model_name="communicationevent",
            index=models.Index(fields=["org", "language"], name="comms_events_org_lang_idx"),
        ),
    ]
