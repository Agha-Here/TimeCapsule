from django.urls import path
from . import views

app_name = 'capsule'
urlpatterns = [
    path('', views.index, name='index'),
    path('create/', views.create_capsule, name='create_capsule'),
     path('check-title/', views.check_title, name='check_title'),
]