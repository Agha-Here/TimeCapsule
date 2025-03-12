from django.db import models

class Capsule(models.Model):
    msg = models.TextField(max_length=1000)
    unlock_at = models.DateField()  # renamed from 'date'
    upload = models.FileField(upload_to='uploads/', null=True, blank=True)
    email = models.EmailField()
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        visibility = "Public" if self.is_public else "Private"
        return f"Time Capsule: {self.id}- {visibility} (Unlocks {self.unlock_at})"