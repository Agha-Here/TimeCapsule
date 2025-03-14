# for changing the ID of a specific capsule.
from django.core.management.base import BaseCommand
from django.db import connection
from capsule.models import Capsule

class Command(BaseCommand):
    help = 'Changes the ID of a specific capsule'

    def add_arguments(self, parser):
        parser.add_argument('old_id', type=int, help='Current ID of the capsule')
        parser.add_argument('new_id', type=int, help='New ID to assign')

    def handle(self, *args, **options):
        old_id = options['old_id']
        new_id = options['new_id']

        # Check if capsule exists
        try:
            capsule = Capsule.objects.get(id=old_id)
        except Capsule.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Capsule with ID {old_id} does not exist'))
            return

        # Check if new ID is available
        if Capsule.objects.filter(id=new_id).exists():
            self.stdout.write(self.style.ERROR(f'ID {new_id} is already in use'))
            return

        with connection.cursor() as cursor:
            # Update the ID
            cursor.execute("""
                UPDATE capsule_capsule 
                SET id = %s 
                WHERE id = %s
            """, [new_id, old_id])

        self.stdout.write(self.style.SUCCESS(
            f'Successfully changed capsule "{capsule.title}" ID from {old_id} to {new_id}'
        ))

# # to change the ID of a capsule. For example, to change the ID of a capsule with ID 5 to 100, you would run the following command:  
# # python manage.py change_capsule_id 5 100
