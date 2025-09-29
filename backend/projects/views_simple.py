from rest_framework import viewsets, permissions
from rest_framework.response import Response
from .models import Project
from .serializers import ProjectCreateSerializer


class SimpleProjectViewSet(viewsets.ModelViewSet):
    """
    Simple ViewSet for project operations - for debugging
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProjectCreateSerializer
    
    def get_queryset(self):
        """Get projects user has access to"""
        return Project.objects.filter(owner=self.request.user)
    
    def perform_create(self, serializer):
        """Set owner when creating project"""
        print("Creating project with user:", self.request.user)
        serializer.save(owner=self.request.user)
