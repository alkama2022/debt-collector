# Generated for multilingual extension
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('customers', '0001_initial'),
        ('languages', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='customer',
            name='language_detection_enabled',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='customer',
            name='language_updated_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='customer',
            name='preferred_language',
            field=models.ForeignKey(blank=True, db_column='preferred_language', null=True, on_delete=django.db.models.deletion.RESTRICT, related_name='customers_preferred', to='languages.language'),
        ),
        migrations.AddField(
            model_name='customer',
            name='voice_language',
            field=models.ForeignKey(blank=True, db_column='voice_language', null=True, on_delete=django.db.models.deletion.RESTRICT, related_name='customers_voice', to='languages.language'),
        ),
        migrations.AddIndex(
            model_name='customer',
            index=models.Index(fields=['org', 'preferred_language'], name='customers_org_pref_idx'),
        ),
        migrations.AddIndex(
            model_name='customer',
            index=models.Index(fields=['preferred_language'], name='customers_pref_idx'),
        ),
    ]
