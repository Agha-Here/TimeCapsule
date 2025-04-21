from django.shortcuts import render
from django.shortcuts import render, get_object_or_404
from capsule.models import Capsule
from django.http import JsonResponse
from django.db.models import Q
from django.utils import timezone
from .utils import send_capsule_created_email
from django.core.exceptions import ValidationError
from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
import cloudinary
import cloudinary.uploader
from django.core.cache import cache
from django.http import HttpResponse
from django.core.management import call_command

def index(request):
    return render(request, 'capsule/index.html')

def check_title(request):
    """Check if capsule title is available"""
    if request.method == 'GET':
        title = request.GET.get('title', '').strip()
        if not title:
            return JsonResponse({
                'is_taken': False,
                'message': 'Please enter a title'
            })
            
        is_taken = Capsule.objects.filter(title=title).exists()
        return JsonResponse({
            'is_taken': is_taken,
            'message': 'Title already taken' if is_taken else 'Title available'
        })
    
    return JsonResponse({'error': 'Invalid request method'}, status=400)

def toggle_like(request, capsule_id):
    if request.method == 'POST':
        capsule = get_object_or_404(Capsule, id=capsule_id)
        
        # Initialize liked_capsules in session if it doesn't exist
        if 'liked_capsules' not in request.session:
            request.session['liked_capsules'] = []
        
        liked_capsules = request.session['liked_capsules']
        
        # Toggle like status
        if capsule_id in liked_capsules:
            liked_capsules.remove(capsule_id)
            capsule.likes = max(0, capsule.likes - 1)  # Prevent negative likes
            is_liked = False
        else:
            liked_capsules.append(capsule_id)
            capsule.likes += 1
            is_liked = True
        
        # Save changes
        request.session['liked_capsules'] = liked_capsules
        request.session.modified = True
        capsule.save()
        
        return JsonResponse({
            'success': True,
            'likes': capsule.likes,
            'is_liked': is_liked
        })
    
    return JsonResponse({'success': False}, status=400)

MAX_UPLOAD_SIZE = 104857600  # 100MB in bytes (100 * 1024 * 1024)

def create_capsule(request):
    search_query = request.GET.get('search', '')
    today = timezone.now().date()
    capsules = Capsule.objects.all().order_by('-created_at')
    
    if search_query:
        capsules = capsules.filter(
            Q(title__icontains=search_query) |
            Q(id__icontains=search_query) |
            Q(msg__icontains=search_query)
        )

    filtered_capsules = []
    for capsule in capsules:
        # Convert dates for comparison (ensure both are date objects)
        unlock_date = capsule.unlock_at
        created_date = capsule.created_at.date()
        capsule_id_formatted = f"TC-{capsule.id:04d}"

        # Default to locked
        is_locked = True

        if today >= unlock_date or unlock_date == created_date:
            is_locked = False

        # Create filtered capsule object...
        filtered_capsule = {
            'id': capsule.id,
            'title': capsule.title or 'Anonymous',
            'capsule_id': capsule_id_formatted,  
            'msg': capsule.msg if not is_locked else "🔒 That's cheating bruh",
            'unlock_at': capsule.unlock_at,
            'created_at': capsule.created_at,
            'has_attachment': bool(capsule.upload),
            'upload_url': capsule.upload if (capsule.upload and not is_locked) else '',
            'is_locked': is_locked,
            'search_preview': capsule.msg[:100] if not is_locked else None,
            'data_message': capsule.msg if not is_locked else '',
            'likes': capsule.likes  # Add this line

        }
        filtered_capsules.append(filtered_capsule)

    if request.method == 'POST':
        try:
            title = request.POST.get('title')
            msg = request.POST.get('msg')
            unlock_at = request.POST.get('udate')
            email = request.POST.get('email')
            upload = request.FILES.get('upload')

            # Create capsule first to get ID
            capsule = Capsule(
                title=title,
                msg=msg,
                unlock_at=unlock_at,
                email=email
            )
            capsule.save()  # Save to get ID

            if upload:
                try:
                    if upload.size > MAX_UPLOAD_SIZE:
                        capsule.delete()
                        raise ValidationError(f'File size cannot exceed 100MB')

                    # Configure Cloudinary
                    cloudinary.config(
                        cloud_name=settings.CLOUDINARY_STORAGE['CLOUD_NAME'],
                        api_key=settings.CLOUDINARY_STORAGE['API_KEY'],
                        api_secret=settings.CLOUDINARY_STORAGE['API_SECRET']
                    )

                    # Upload to Cloudinary with proper folder structure
                    upload_result = cloudinary.uploader.upload(
                        upload,
                        folder=f"TimeCapsule/{capsule.id}",
                        resource_type="auto",
                        chunk_size=6000000,
                        timeout=180,
                        use_filename=True,
                        unique_filename=False
                    )

                    # Store the direct Cloudinary URL
                    capsule.upload = upload_result['secure_url']
                    capsule.save()

                except Exception as e:
                    capsule.delete()  # Clean up on failure
                    raise ValidationError(f'Upload failed: {str(e)}')

            # Send email notification
            try:
                send_capsule_created_email(capsule)
            except Exception as e:
                print(f"Email error: {str(e)}")

            return JsonResponse({
                'success': True,
                'message': 'Capsule sealed successfully!',
                'capsule_id': capsule.id
            })

        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)


    return render(request, 'capsule/creation.html', {
        'public_capsules': filtered_capsules,
        'search_query': search_query
    })
    
def retry_failed_uploads():
    failed_capsules = Capsule.objects.filter(upload_status='failed')
    for capsule in failed_capsules:
        try:
            if capsule.upload:
                result = uploader.upload(
                    capsule.upload,
                    resource_type="auto",
                    folder=f"TimeCapsule/{capsule.id}"
                )
                capsule.upload_status = 'completed'
                capsule.upload_error = None
                capsule.save()
        except Exception as e:
            print(f"Retry failed for capsule {capsule.id}: {str(e)}")

def search_capsules(request):
    """AJAX endpoint for searching capsules"""
    search_query = request.GET.get('q', '').strip()
    
    capsules = Capsule.objects.all()
    
    if search_query:
        capsules = capsules.filter(
            Q(title__icontains=search_query) |
            Q(id__icontains=search_query) |
            Q(msg__icontains=search_query)
        )
    
    capsules = capsules.order_by('-created_at')
    
    return render(request, 'capsule/capsule_list.html', {
        'public_capsules': capsules
    })

def view_capsule(request, capsule_id):
    capsule = get_object_or_404(Capsule, id=capsule_id)
    today = timezone.now().date()
    capsule_id_formatted = f"TC-{capsule.id:04d}"
    
    is_locked = True
    if today >= capsule.unlock_at or capsule.unlock_at == capsule.created_at.date():
        is_locked = False
    
    context = {
        'capsule': {
            'id': capsule.id,
            'title': capsule.title or 'Anonymous',
            'capsule_id': capsule_id_formatted, 
            'msg': capsule.msg if not is_locked else "🔒 That's cheating bruh",
            'unlock_at': capsule.unlock_at,
            'created_at': capsule.created_at,
            'has_attachment': bool(capsule.upload),
            'upload_url': capsule.upload if (capsule.upload and not is_locked) else '',
            'is_locked': is_locked
        }
    }
    return render(request, 'capsule/view_capsule.html', context)

def cron_send_unlock_emails(request):
    try:
        call_command('send_unlock_emails')
        return HttpResponse("Unlock emails sent successfully", status=200)
    except Exception as e:
        return HttpResponse(f"Error: {str(e)}", status=500)