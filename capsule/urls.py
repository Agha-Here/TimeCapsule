from django.urls import path
from . import views

app_name = 'capsule'
urlpatterns = [
    path('', views.index, name='index'),
    path('create/', views.create_capsule, name='create_capsule'),
     path('check-title/', views.check_title, name='check_title'),
    path('capsule/<int:capsule_id>/', views.view_capsule, name='view_capsule'),
    path('cron/send-unlock-emails/', views.cron_send_unlock_emails, name='cron_send_unlock_emails'),
    path('like/<int:capsule_id>/', views.toggle_like, name='toggle_like'),
    path('capsule/<int:capsule_id>/qr/', views.generate_qr_code, name='generate_qr_code'), 
]
