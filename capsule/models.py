from django.db import models

class Capsule(models.Model):
    title = models.CharField(max_length=100, unique=True, null=True, blank=True)
    msg = models.TextField(max_length=1000)
    unlock_at = models.DateField()
    upload = models.FileField(upload_to='uploads/', null=True, blank=True)
    email = models.EmailField()
    is_public = models.BooleanField(default=False)
    password = models.CharField(max_length=128, null=True, blank=True)  # For private capsules
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        visibility = "Public" if self.is_public else "Private"
        return f"{self.title} - {visibility} (Unlocks {self.unlock_at})"