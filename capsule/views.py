from django.shortcuts import render
from capsule.models import Capsule
from django.http import JsonResponse
from django.db.models import Q
from django.utils import timezone
from .utils import send_capsule_sealed_email

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

def create_capsule(request):
    search_query = request.GET.get('search', '')
    today = timezone.localtime().date()
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
        
        # Default to locked
        is_locked = True
        
        # Debug print to check dates
        print(f"Capsule {capsule.id}:")
        print(f"Today: {today}")
        print(f"Unlock date: {unlock_date}")
        print(f"Created date: {created_date}")
        
        # Check unlock conditions:
        # 1. Today should be EQUAL TO unlock_date (for today's capsules)
        # 2. OR Today should be AFTER unlock_date (for past capsules)
        # 3. OR Unlock date equals creation date (for immediate unlock)
        if today >= unlock_date or unlock_date == created_date:
            is_locked = False
            print(f"Capsule {capsule.id} is unlocked")
        else:
            print(f"Capsule {capsule.id} is locked")

        # Create filtered capsule object...
        filtered_capsule = {
            'id': capsule.id,
            'title': capsule.title or 'Anonymous',
            'msg': capsule.msg if not is_locked else "🔒 That's cheating bruh",
            'unlock_at': capsule.unlock_at,
            'created_at': capsule.created_at,
            'has_attachment': bool(capsule.upload),
            'upload_url': capsule.upload.url if (capsule.upload and not is_locked) else '',
            'is_locked': is_locked,
            'search_preview': capsule.msg[:100] if not is_locked else None,
            'data_message': capsule.msg if not is_locked else ''
        }
        filtered_capsules.append(filtered_capsule)

    if request.method == 'POST':
        try:
            title = request.POST.get('title')
            msg = request.POST.get('msg')
            unlock_at = request.POST.get('udate')
            email = request.POST.get('email')
            upload = request.FILES.get('upload')
            
            # Convert unlock_at to date object for comparison
            unlock_date = timezone.datetime.strptime(unlock_at, '%Y-%m-%d').date()
            
            capsule = Capsule(
                title=title,
                msg=msg,
                unlock_at=unlock_date,
                email=email
            )
            
            if upload:
                capsule.upload = upload
                
            capsule.save()

            try:
                send_capsule_sealed_email(capsule)
            except Exception as e:
                print(f"Email error: {str(e)}")
            
            # Re-filter capsules after new addition
            return render(request, 'capsule/creation.html', {
                'success': True,
                'public_capsules': filtered_capsules,
                'search_query': search_query
            })
            
        except Exception as e:
            return render(request, 'capsule/creation.html', {
                'error': str(e),
                'public_capsules': filtered_capsules,
                'search_query': search_query
            })

    return render(request, 'capsule/creation.html', {
        'public_capsules': filtered_capsules,
        'search_query': search_query
    })

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