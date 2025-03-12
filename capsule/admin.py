from django.contrib import admin
from .models import Capsule
from django.utils.html import format_html

@admin.register(Capsule)
class CapsuleAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'created_at', 'unlock_at', 'is_public', 'has_attachment', 'msg_status')
    list_filter = ('is_public', 'unlock_at', 'created_at')
    search_fields = ('email', 'msg')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
    list_per_page = 20

    def has_attachment(self, obj):
        return bool(obj.upload)
    has_attachment.boolean = True
    has_attachment.short_description = 'Has File'

    def msg_status(self, obj):
        if not obj.msg.strip():
            return format_html('<span style="color: red;">Empty Message</span>')
        return format_html('<span style="color: green;">Has Message</span>')
    msg_status.short_description = 'Message Status'

    fieldsets = (
        ('Content', {
            'fields': ('msg', 'upload')
        }),
        ('Details', {
            'fields': ('email', 'unlock_at', 'is_public', 'created_at')
        }),
    )