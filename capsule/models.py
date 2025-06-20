from django.db import models
from cloudinary_storage.storage import RawMediaCloudinaryStorage

def get_upload_path(instance, filename):
    """Generate the upload path for a capsule's media file"""
    # If instance doesn't have an ID yet, return None
    if not instance.id:
        return None
    return f'TimeCapsule/{instance.id}/{filename}'

class Capsule(models.Model):
    title = models.CharField(max_length=100, unique=True, null=True, blank=True)
    msg = models.TextField(max_length=10000)
    unlock_at = models.DateField()
    upload = models.URLField(max_length=500, null=True, blank=True)
    email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)
    upload_status = models.CharField(max_length=20, default='pending')
    likes = models.IntegerField(default=0)  # Add this line

    def __str__(self):
        return f"{self.title} (Unlocks {self.unlock_at})"
    