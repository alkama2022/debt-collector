# Generated for CollectNaija Multilingual
import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('tenancy', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Language',
            fields=[
                ('code', models.CharField(help_text='BCP-47 style e.g. en, ha, yo, ig, pcm, ff, kr, tiv', max_length=10, primary_key=True, serialize=False)),
                ('name', models.CharField(help_text='English name, e.g. Hausa', max_length=64)),
                ('native_name', models.CharField(help_text='Native name, e.g. Hausa, Yorùbá', max_length=64)),
                ('locale', models.CharField(help_text='Locale e.g. ha-NG, en-NG, yo-NG', max_length=16)),
                ('text_supported', models.BooleanField(default=True)),
                ('speech_to_text_supported', models.BooleanField(default=False)),
                ('text_to_speech_supported', models.BooleanField(default=False)),
                ('active', models.BooleanField(db_index=True, default=True)),
                ('quality_status', models.CharField(choices=[('draft', 'Draft'), ('review', 'Review'), ('production', 'Production')], default='production', max_length=16)),
                ('version', models.CharField(default='1.0.0', max_length=16)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'languages',
                'ordering': ['code'],
                'verbose_name': 'Language',
                'verbose_name_plural': 'Languages',
            },
        ),
        migrations.CreateModel(
            name='OrganizationLanguageSettings',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('ai_communication_mode', models.CharField(choices=[('customer_preferred', 'Customer Preferred'), ('business_fallback', 'Business Fallback'), ('auto_detect', 'Auto Detect')], default='customer_preferred', max_length=24)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('dashboard_language', models.ForeignKey(default='en', on_delete=django.db.models.deletion.RESTRICT, related_name='dashboard_orgs', to='languages.language')),
                ('default_customer_language', models.ForeignKey(default='en', on_delete=django.db.models.deletion.RESTRICT, related_name='default_customer_orgs', to='languages.language')),
                ('fallback_language', models.ForeignKey(default='en', on_delete=django.db.models.deletion.RESTRICT, related_name='fallback_orgs', to='languages.language')),
                ('org', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='language_settings', to='tenancy.organization')),
                ('supported_languages', models.ManyToManyField(blank=True, related_name='supported_by_orgs', to='languages.language')),
            ],
            options={
                'db_table': 'organization_language_settings',
                'verbose_name': 'Organization Language Settings',
                'verbose_name_plural': 'Organization Language Settings',
            },
        ),
        migrations.CreateModel(
            name='CustomerLanguageHistory',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('reason', models.CharField(choices=[('customer_request', 'Customer Request'), ('business_change', 'Business Change'), ('auto_detect', 'Auto Detect'), ('detected_switch', 'Detected Switch')], default='customer_request', max_length=24)),
                ('detected_confidence', models.DecimalField(blank=True, decimal_places=3, max_digits=4, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('changed_by', models.ForeignKey(blank=True, help_text='Null when system/auto_detect', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='customer_language_changes', to=settings.AUTH_USER_MODEL)),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='language_histories', to='customers.customer')),
                ('from_lang', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.RESTRICT, related_name='history_from', to='languages.language')),
                ('org', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='customer_language_histories', to='tenancy.organization')),
                ('to_lang', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.RESTRICT, related_name='history_to', to='languages.language')),
            ],
            options={
                'db_table': 'customer_language_history',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='customerlanguagehistory',
            index=models.Index(fields=['org', 'customer', 'created_at'], name='cust_lang_hist_org_cust_idx'),
        ),
        migrations.AddIndex(
            model_name='customerlanguagehistory',
            index=models.Index(fields=['org', 'created_at'], name='cust_lang_hist_org_idx'),
        ),
        migrations.AddIndex(
            model_name='customerlanguagehistory',
            index=models.Index(fields=['customer', 'created_at'], name='cust_lang_hist_cust_idx'),
        ),
        # Seed base languages
        migrations.RunPython(
            code=lambda apps, schema_editor: _seed_languages(apps, schema_editor),
            reverse_code=migrations.RunPython.noop,
        ),
    ]


def _seed_languages(apps, schema_editor):
    Language = apps.get_model('languages', 'Language')
    seeds = [
        ('en', 'English', 'English', 'en-NG', True, True, True, True, 'production', '1.0.0'),
        ('ha', 'Hausa', 'Hausa', 'ha-NG', True, False, False, True, 'production', '1.0.0'),
        ('yo', 'Yoruba', 'Yorùbá', 'yo-NG', True, False, False, True, 'production', '1.0.0'),
        ('ig', 'Igbo', 'Igbo', 'ig-NG', True, False, False, True, 'production', '1.0.0'),
        ('pcm', 'Nigerian Pidgin', 'Naija Pidgin', 'pcm-NG', True, False, False, True, 'production', '1.0.0'),
        # Future languages as inactive rows
        ('ff', 'Fulfulde', 'Fulfulde', 'ff-NG', False, False, False, False, 'draft', '0.1.0'),
        ('kr', 'Kanuri', 'Kanuri', 'kr-NG', False, False, False, False, 'draft', '0.1.0'),
        ('tiv', 'Tiv', 'Tiv', 'tiv-NG', False, False, False, False, 'draft', '0.1.0'),
    ]
    for code, name, native, locale, text, stt, tts, active, quality, version in seeds:
        Language.objects.update_or_create(
            code=code,
            defaults=dict(name=name, native_name=native, locale=locale, text_supported=text, speech_to_text_supported=stt, text_to_speech_supported=tts, active=active, quality_status=quality, version=version)
        )
