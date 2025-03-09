from django.contrib import admin
from .models import Capsule

@admin.register(Capsule)
class CapsuleAdmin(admin.ModelAdmin):
    list_display = ('email', 'date', 'is_public', )
    list_filter = ('is_public', 'date')
    search_fields = ('email', 'msg')
    ordering = ('-date',)
    
    # def upload_preview(self, obj):
    #     if obj.upload:
    #         return f"Uploaded File: {obj.upload.name.split('/')[-1]}"
    #     return "No file uploaded"
    # upload_preview.short_description = "File"