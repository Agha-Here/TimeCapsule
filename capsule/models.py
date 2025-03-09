from django.db import models

class Capsule(models.Model):  # Capitalized for convention
    msg = models.TextField(max_length=1000)
    date = models.DateField()
    upload = models.FileField(upload_to='uploads/', null=True, blank=True)  # Allow optional uploads
    email = models.EmailField()
    is_public = models.BooleanField(default=False)  # Renamed for clarity

    def __str__(self):
        visibility = "Public" if self.is_public else "Private"
        return f"Time Capsule: {self.id}- {visibility} (Unlocks {self.date})"
    
    # def __str__(self):
    #     return f"Capsule #{self.id} - {self.email} ({self.date})"
    