"""
Minimal URL configuration for UML Diagrams project.
This is a simplified version to avoid app-specific import errors during deployment.
"""
from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # Basic health check endpoint for deployment verification
    path('', lambda request: HttpResponse('OK'), name='health_check'),
]

# Static files configuration
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Import HttpResponse for the health check
from django.http import HttpResponse