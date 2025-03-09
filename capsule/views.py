from django.shortcuts import render
from capsule.models import Capsule

def index(request):
    return render(request, 'capsule/index.html')

def create_capsule(request):
    if request.method == 'POST':
        msg = request.POST.get('msg')
        udate = request.POST.get('udate')
        upload = request.FILES.get('upload')
        email = request.POST.get('email')
        is_public = int(request.POST.get('pripub', 0)) > 50  # Convert slider value to boolean
        try:
            capsule = Capsule(msg=msg, date=udate, upload=upload, email=email, is_public=is_public)
            capsule.save()
            return render(request, 'capsule/creation.html', {'success': True})
        except Exception as e:
            return render(request, 'capsule/creation.html', {'error': str(e)})
    return render(request, 'capsule/creation.html')