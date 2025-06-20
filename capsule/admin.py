from django.contrib import admin
from .models import Capsule

@admin.register(Capsule)
class CapsuleAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'email', 'unlock_at', 'has_attachment','likes')
    list_filter = ('unlock_at', 'created_at')
    search_fields = ('title', 'email', 'msg', 'id') 
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'id') 
    date_hierarchy = 'created_at'
    list_per_page = 20

    def has_attachment(self, obj):
        return bool(obj.upload)
    has_attachment.boolean = True
    has_attachment.short_description = 'Has File'

    fieldsets = (
        ('Capsule Details', {
            'fields': ('id','title', 'email','likes')
        }),
        ('Content', {
            'fields': ('msg', 'upload'),
            'description': 'Main content of the time capsule'
        }),
        ('Timing', {
            'fields': ('unlock_at', 'created_at'),
            'description': 'When the capsule was created and when it will unlock'
        }),
        
    )

    def get_readonly_fields(self, request, obj=None):
        if obj:  # editing an existing object
            return self.readonly_fields + ('title',)
        return self.readonly_fields

    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        if not obj:  # If creating new object
            # Remove the System Info fieldset which contains id
            return fieldsets[:-1]
        return fieldsets
    