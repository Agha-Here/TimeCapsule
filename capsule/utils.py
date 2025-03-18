from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string

def send_capsule_sealed_email(capsule):
    """Send email when capsule is sealed"""
    try:
        subject = f'TimeCapsule: Your Capsule "{capsule.title}#{capsule.id}" Has Been Sealed!'
        
        # Pass just the capsule object to the template
        context = {
            'capsule': capsule
        }
        
        html_message = render_to_string('capsule/emails/capsule_sealed.html', context)
        
        send_mail(
            subject=subject,
            message='',
            html_message=html_message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[capsule.email],
            fail_silently=False
        )
        print(f"Sealed email sent successfully to {capsule.email}")
        
    except Exception as e:
        print(f"Error sending sealed email: {str(e)}")
        raise

def send_capsule_unlock_email(capsule):
    """Send email when capsule is unlocked"""
    try:
        subject = f'TimeCapsule: Your Capsule "{capsule.title}#{capsule.id}" Is Now Unlocked!'
        
        # Pass just the capsule object to the template
        context = {
            'capsule': capsule
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