# Generated by Django 5.1.6 on 2025-03-18 01:32

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('capsule', '0003_remove_capsulelike_capsule_comment_like_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='like',
            name='capsule',
        ),
        migrations.DeleteModel(
            name='Comment',
        ),
        migrations.DeleteModel(
            name='Like',
        ),
    ]
