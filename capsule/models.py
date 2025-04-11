from django.db import models
from cloudinary_storage.storage import RawMediaCloudinaryStorage

class Capsule(models.Model):
    title = models.CharField(max_length=100, unique=True, null=True, blank=True)
    msg = models.TextField(max_length=10000)
    unlock_at = models.DateField()
    upload = models.FileField(upload_to='uploads/',storage=RawMediaCloudinaryStorage(), null=True, blank=True)
    email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} (Unlocks {self.unlock_at})"