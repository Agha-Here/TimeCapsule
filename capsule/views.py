from django.shortcuts import render
from capsule.models import Capsule
from django.contrib import messages

def index(request):
    return render(request, 'capsule/index.html')

def create_capsule(request):
    # Get public capsules ordered by creation date (newest first)
    public_capsules = Capsule.objects.filter(is_public=True).order_by('-created_at')
    context = {'public_capsules': public_capsules}

    if request.method == 'POST':
        try:
            # Get form data
            msg = request.POST.get('msg')
            unlock_at = request.POST.get('udate')
            upload = request.FILES.get('upload')
            email = request.POST.get('email')
            is_public = int(request.POST.get('pripub', 0)) > 50

            # Create and save capsule
            capsule = Capsule(
                msg=msg,
                unlock_at=unlock_at,
                upload=upload,
                email=email,
                is_public=is_public
            )
            capsule.save()
            
            # Update context with fresh data
            context['success'] = True
            context['public_capsules'] = Capsule.objects.filter(is_public=True).order_by('-created_at')
            
        except Exception as e:
            context['error'] = str(e)

    return render(request, 'capsule/creation.html', context)