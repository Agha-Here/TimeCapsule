# Generated by Django 5.1.6 on 2025-04-12 06:51

import capsule.models
import cloudinary_storage.storage
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('capsule', '0006_alter_capsule_upload'),
    ]

    operations = [
        migrations.AddField(
            model_name='capsule',
            name='upload_status',
            field=models.CharField(default='pending', max_length=20),
        ),
        migrations.AlterField(
            model_name='capsule',
            name='upload',
            field=models.FileField(blank=True, null=True, storage=cloudinary_storage.storage.RawMediaCloudinaryStorage(), upload_to=capsule.models.get_upload_path),
        ),
    ]
