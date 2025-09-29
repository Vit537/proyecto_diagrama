"""
URL configuration for collaboration app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('collaboration', views.CollaborationViewSet, basename='collaboration')

app_name = 'collaboration'

urlpatterns = [
    path('', include(router.urls)),
]
