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
import qrcode
import base64
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import os


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
            'is_locked': is_locked,
            'likes': capsule.likes
        }
    }
    return render(request, 'capsule/view_capsule.html', context)

def cron_send_unlock_emails(request):
    try:
        call_command('send_unlock_emails')
        return HttpResponse("Unlock emails sent successfully", status=200)
    except Exception as e:
        return HttpResponse(f"Error: {str(e)}", status=500)
    
def generate_qr_code(request, capsule_id):
    capsule = get_object_or_404(Capsule, id=capsule_id)
    base_url = f"{request.scheme}://{request.get_host()}"
    capsule_url = f"{base_url}/capsule/{capsule_id}/"
    
    # Get title, use "Anonymous" if None
    title = capsule.title or "Anonymous"
    qr_code = generate_qr(capsule_url, title)
    return JsonResponse({'qr_code': qr_code})

def generate_qr(url, title):
    # Create QR code instance with higher error correction
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # Higher error correction for logo
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    # Create QR code image with white background
    qr_image = qr.make_image(fill_color="#00d2ff", back_color="white")
    qr_image = qr_image.get_image()
    
    # Create a new image with padding for text
    width = qr_image.width
    height = qr_image.height + 80
    new_image = Image.new('RGB', (width, height), 'white')
    
    # Paste QR code in the middle
    new_image.paste(qr_image, (0, 40))
    
    # Open and resize logo
    logo_path = os.path.join('capsule', 'static', 'Media', 'logo1.png')
    if os.path.exists(logo_path):
        logo = Image.open(logo_path)
        
        # Calculate logo size (about 20% of QR code)
        logo_size = int(width * 0.2)
        
        # Create a white background square for logo (slightly larger than logo)
        padding = int(logo_size * 0.05)  # 20% padding around logo
        bg_size = logo_size + (padding * 2)
        logo_bg = Image.new('RGB', (bg_size, bg_size), 'white')
        
        # Resize logo
        logo = logo.resize((logo_size, logo_size))
        
        # Calculate positions
        logo_pos_x = (width - bg_size) // 2
        logo_pos_y = ((height - 80 - bg_size) // 2) + 40
        
        # First paste the white background
        new_image.paste(logo_bg, (logo_pos_x, logo_pos_y))
        
        # Then paste the logo in the center of white background
        if logo.mode == 'RGBA':
            new_image.paste(logo, 
                          (logo_pos_x + padding, logo_pos_y + padding), 
                          logo)
        else:
            new_image.paste(logo, 
                          (logo_pos_x + padding, logo_pos_y + padding))
    
    # Add text
    draw = ImageDraw.Draw(new_image)
    
    try:
        font_path = "C:\\Windows\\Fonts\\Arial.ttf"
        title_font = ImageFont.truetype(font_path, 20)
        bottom_font = ImageFont.truetype(font_path, 16)
    except:
        title_font = ImageFont.load_default()
        bottom_font = ImageFont.load_default()

    # Add title text at top
    title_text = "The Time Capsule Network"
    title_bbox = draw.textbbox((0, 0), title_text, font=title_font)
    title_width = title_bbox[2] - title_bbox[0]
    title_x = (width - title_width) // 2
    draw.text((title_x, 10), title_text, fill="#00d2ff", font=title_font)
    
    # Add bottom text with capsule title
    bottom_text = f"Scan to view my Capsule: {title}"
    bottom_bbox = draw.textbbox((0, 0), bottom_text, font=bottom_font)
    bottom_width = bottom_bbox[2] - bottom_bbox[0]
    bottom_x = (width - bottom_width) // 2
    draw.text((bottom_x, height - 30), bottom_text, fill="#00d2ff", font=bottom_font)
    
    # Save to buffer
    buffer = BytesIO()
    new_image.save(buffer, format='PNG')
    image_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return f'data:image/png;base64,{image_base64}'
