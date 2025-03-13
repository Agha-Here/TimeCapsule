from django.shortcuts import render
from capsule.models import Capsule
from django.contrib import messages
from django.http import JsonResponse

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
    if request.method == 'POST':
        try:
            title = request.POST.get('title')
            msg = request.POST.get('msg')
            unlock_at = request.POST.get('udate')
            email = request.POST.get('email')
            is_public = int(request.POST.get('pripub', 100)) > 50
            password = request.POST.get('password') if not is_public else None
            
            # Handle file upload
            upload = request.FILES.get('upload')
            
            capsule = Capsule(
                title=title,
                msg=msg,
                unlock_at=unlock_at,
                email=email,
                is_public=is_public,
                password=password
            )
            
            if upload:
                capsule.upload = upload
                
            capsule.save()
            
            # Return updated public capsules
            return render(request, 'capsule/creation.html', {
                'success': True,
                'public_capsules': Capsule.objects.filter(is_public=True).order_by('-created_at')
            })
            
        except Exception as e:
            return render(request, 'capsule/creation.html', {
                'error': str(e),
                'public_capsules': Capsule.objects.filter(is_public=True).order_by('-created_at')
            })

    return render(request, 'capsule/creation.html', {
        'public_capsules': Capsule.objects.filter(is_public=True).order_by('-created_at')
    })

