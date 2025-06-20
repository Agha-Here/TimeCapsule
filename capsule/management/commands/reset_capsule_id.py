# for resetting the IDs of capsules.
from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Reset SQLite auto-increment counter for capsules'

    def handle(self, *args, **options):
        try:
            with connection.cursor() as cursor:
                # Delete the sequence
                cursor.execute("DELETE FROM sqlite_sequence WHERE name='capsule_capsule'")
                
                # Reset the sequence
                cursor.execute("INSERT INTO sqlite_sequence (name, seq) VALUES ('capsule_capsule', 0)")
                
                # Get current max ID
                cursor.execute("SELECT MAX(id) FROM capsule_capsule")
                max_id = cursor.fetchone()[0] or 0

                self.stdout.write(
                    self.style.SUCCESS(f'Successfully reset ID sequence to 0. Current max ID is {max_id}')
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error resetting sequence: {str(e)}')
            )


# for resetting the IDs of capsules.
# python manage.py reset_capsule_id