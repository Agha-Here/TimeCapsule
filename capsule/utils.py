from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.timezone import now  # helpful for unlock comparison if needed

def send_capsule_created_email(capsule):
    """Send email right after capsule is created"""
    try:
        # Convert both to string format for comparison
        created_date = capsule.created_at.date().strftime('%Y-%m-%d')
        unlock_date = capsule.unlock_at.strftime('%Y-%m-%d') if hasattr(capsule.unlock_at, 'strftime') else capsule.unlock_at

        if created_date == unlock_date:
            subject = f'TimeCapsule: Your Capsule "{capsule.title} (TC-{capsule.id:04d})" Has Been Posted!'
            template_name = 'capsule/emails/capsule_post.html'
        else:
            subject = f'TimeCapsule: Your Capsule "{capsule.title} (TC-{capsule.id:04d})" Has Been Sealed!'
            template_name = 'capsule/emails/capsule_sealed.html'
        
        context = {
            'capsule': {
                'id': capsule.id,
                'title': capsule.title,
                'capsule_id': f"TC-{capsule.id:04d}",  # Add formatted ID
                'created_at': capsule.created_at,
                'unlock_at': capsule.unlock_at,
                'msg': capsule.msg,
                'upload': capsule.upload,
                'email': capsule.email
            }
        }

        html_message = render_to_string(template_name, context)

        send_mail(
            subject=subject,
            message='',
            html_message=html_message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[capsule.email],
            fail_silently=False
        )

    except Exception as e:
        print(f"Error sending email: {str(e)}")
        raise

def send_capsule_unlock_email(capsule):
    """Send email when capsule is unlocked"""
    try:
        subject = f'TimeCapsule: Your Capsule "{capsule.title} (TC-{capsule.id:04d})" Is Now Unlocked!'

        context = {
            'capsule': {
                'id': capsule.id,
                'title': capsule.title,
                'capsule_id': f"TC-{capsule.id:04d}",  # Add formatted ID
                'created_at': capsule.created_at,
                'unlock_at': capsule.unlock_at,
                'msg': capsule.msg,
                'upload': capsule.upload,
                'email': capsule.email
            }
        }

        html_message = render_to_string('capsule/emails/capsule_unlocked.html', context)

        send_mail(
            subject=subject,
            message='',
            html_message=html_message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[capsule.email],
            fail_silently=False
        )
        print(f"Unlock email sent successfully to {capsule.email}")

    except Exception as e:
        print(f"Error sending unlock email: {str(e)}")
        raise

