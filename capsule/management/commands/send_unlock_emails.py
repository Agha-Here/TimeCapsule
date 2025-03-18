from django.core.management.base import BaseCommand
from django.utils import timezone
from capsule.models import Capsule
from capsule.utils import send_capsule_unlock_email

class Command(BaseCommand):
    help = 'Send unlock notification emails for capsules that are due today'

    def handle(self, *args, **kwargs):
        today = timezone.now().date()
        unlocked_capsules = Capsule.objects.filter(unlock_at=today)
        
        for capsule in unlocked_capsules:
            try:
                send_capsule_unlock_email(capsule)
                self.stdout.write(
                    self.style.SUCCESS(f'Sent unlock email for capsule {capsule.title} #{capsule.id}')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Failed to send unlock email for capsule {capsule.title} #{capsule.id}: {str(e)}')
                )