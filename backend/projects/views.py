from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count
from django.utils import timezone
from .models import Project, ProjectCollaborator, ProjectSettings
# from .serializers import (
#     ProjectSerializer, ProjectCreateSerializer, ProjectInviteSerializer,
#     ProjectCollaboratorSerializer, ProjectUpdateRoleSerializer, 
#     ProjectSettingsSerializer, ProjectStatsSerializer
# )
from .serializers import (
     ProjectSerializer, ProjectCreateSerializer, 
     ProjectCollaboratorSerializer, 
     ProjectSettingsSerializer, 
 )


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for project operations
    """
    permission_classes = [permissions.IsAuthenticated]
    
    # Use the simple serializer for now, will switch based on action in methods
    serializer_class = ProjectCreateSerializer
    
    def get_queryset(self):
        """Get projects user has access to"""
        user = self.request.user
        
        # Base queryset: projects owned by user or where user is collaborator
        queryset = Project.objects.filter(
            Q(owner=user) |
            Q(collaborators__user=user, collaborators__is_active=True) |
            Q(visibility='public')
        ).distinct().select_related('owner').prefetch_related(
            'collaborators__user', 'settings'
        )
        
        # Filter by visibility
        visibility = self.request.query_params.get('visibility')
        if visibility:
            queryset = queryset.filter(visibility=visibility)
        
        # Filter by archived status
        archived = self.request.query_params.get('archived')
        if archived is not None:
            is_archived = archived.lower() == 'true'
            queryset = queryset.filter(is_archived=is_archived)
        
        # Search by name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        # Filter by owner (only for public projects or admin)
        owner_email = self.request.query_params.get('owner')
        if owner_email:
            queryset = queryset.filter(owner__email=owner_email)
        
        return queryset.order_by('-updated_at')
    
    def perform_create(self, serializer):
        """Set owner when creating project"""
        print("Creating project with user:", self.request.user)
        serializer.save(owner=self.request.user)
    
    def check_project_permissions(self, project, required_permission='view'):
        """Check if user has required permission for project"""
        user = self.request.user
        
        if not project.has_permission(user, required_permission):
            self.permission_denied(
                self.request, 
                message=f"You don't have {required_permission} permission for this project"
            )
    
    def list(self, request, *args, **kwargs):
        """List projects with detailed serializer"""
        queryset = self.get_queryset()
        serializer = ProjectSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        """Get single project with permission check"""
        project = self.get_object()
        self.check_project_permissions(project, 'view')
        serializer = ProjectSerializer(project, context={'request': request})
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        """Update project with permission check"""
        project = self.get_object()
        self.check_project_permissions(project, 'admin')
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Delete project (only owner)"""
        project = self.get_object()
        if project.owner != request.user:
            return Response(
                {'error': 'Only project owner can delete the project'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def invite(self, request, pk=None):
            """
            Invite user to project
            
            POST /api/projects/{id}/invite/
            Body: {
                "email": "user@example.com",
                "role": "editor",
                "message": "Join my UML project!"
            }
            """
            from .serializers import ProjectInviteSerializer
            
            project = self.get_object()
            self.check_project_permissions(project, 'admin')
            
            serializer = ProjectInviteSerializer(
                data=request.data, 
                context={'project': project, 'request': request}
            )
            
            if serializer.is_valid():
                user = serializer.validated_data['user']
                role = serializer.validated_data['role']
                
                # Create or update collaboration
                collaborator, created = ProjectCollaborator.objects.get_or_create(
                    project=project,
                    user=user,
                    defaults={
                        'role': role,
                        'invited_by': request.user,
                        'is_active': True,
                        'accepted_at': timezone.now()
                    }
                )
                
                if not created:
                    # Update existing collaborator
                    collaborator.role = role
                    collaborator.is_active = True
                    collaborator.accepted_at = timezone.now()
                    collaborator.save()
                
                return Response({
                    'message': 'User invited successfully',
                    'collaborator': ProjectCollaboratorSerializer(collaborator).data
                })
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def remove_collaborator(self, request, pk=None):
            """
            Remove collaborator from project
            
            POST /api/projects/{id}/remove_collaborator/
            Body: {"user_id": "uuid-here"}
            """
            project = self.get_object()
            self.check_project_permissions(project, 'admin')
            
            user_id = request.data.get('user_id')
            if not user_id:
                return Response(
                    {'error': 'user_id is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                collaborator = ProjectCollaborator.objects.get(
                    project=project, user_id=user_id
                )
                collaborator.is_active = False
                collaborator.save()
                
                return Response({'message': 'Collaborator removed successfully'})
                
            except ProjectCollaborator.DoesNotExist:
                return Response(
                    {'error': 'Collaborator not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
    
    @action(detail=True, methods=['post'])
    def update_role(self, request, pk=None):
        """
        Update collaborator role
            
        POST /api/projects/{id}/update_role/
        Body: {
            "user_id": "uuid-here",
            "role": "admin"
        }
        """
        from .serializers import ProjectUpdateRoleSerializer
        
        project = self.get_object()
        self.check_project_permissions(project, 'admin')
            
        user_id = request.data.get('user_id')
        serializer = ProjectUpdateRoleSerializer(data=request.data)
            
        if not user_id:
            return Response(
                {'error': 'user_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if serializer.is_valid():
            try:
                collaborator = ProjectCollaborator.objects.get(
                    project=project, user_id=user_id, is_active=True
                )
                collaborator.role = serializer.validated_data['role']
                collaborator.save()
                    
                return Response({
                    'message': 'Role updated successfully',
                    'collaborator': ProjectCollaboratorSerializer(collaborator).data
                })
                    
            except ProjectCollaborator.DoesNotExist:
                return Response(
                    {'error': 'Active collaborator not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def collaborators(self, request, pk=None):
        """
        Get project collaborators
            
        GET /api/projects/{id}/collaborators/
        """
        project = self.get_object()
        self.check_project_permissions(project, 'view')
            
        collaborators = project.collaborators.filter(is_active=True).select_related('user')
        serializer = ProjectCollaboratorSerializer(collaborators, many=True)
            
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """
        Get project statistics
            
        GET /api/projects/{id}/stats/
        """
        project = self.get_object()
        self.check_project_permissions(project, 'view')
            
        # Calculate statistics
        try:
            diagrams = project.diagrams.all()
            total_diagrams = diagrams.count()
            class_diagrams = diagrams.filter(diagram_type='class').count() if hasattr(diagrams.first(), 'diagram_type') else 0
            database_diagrams = diagrams.filter(diagram_type='database').count() if hasattr(diagrams.first(), 'diagram_type') else 0
            # Safely get elements and relationships count
            total_elements = 0
            total_relationships = 0
            for d in diagrams:
                if hasattr(d, 'get_elements_count'):
                    total_elements += d.get_elements_count()
                if hasattr(d, 'get_relationships_count'):
                    total_relationships += d.get_relationships_count()
        except AttributeError:
            total_diagrams = 0
            class_diagrams = 0
            database_diagrams = 0
            total_elements = 0
            total_relationships = 0
            
        stats_data = {
            'total_diagrams': total_diagrams,
            'class_diagrams': class_diagrams,
            'database_diagrams': database_diagrams,
            'total_elements': total_elements,
            'total_relationships': total_relationships,
            'active_collaborators': project.collaborators.filter(is_active=True).count(),
            'recent_activity': []
        }
        return Response(stats_data)
    
    @action(detail=True, methods=['get', 'put', 'patch'])
    def project_settings(self, request, pk=None):
    # def project_settings(self, request, pk=None): datos cambiados
        """
        Get or update project settings
        
        GET /api/projects/{id}/settings/
        PUT/PATCH /api/projects/{id}/settings/
        """
        project = self.get_object()
        
        if request.method == 'GET':
            self.check_project_permissions(project, 'view')
            settings_obj = getattr(project, 'settings', None)
            if settings_obj:
                serializer = ProjectSettingsSerializer(settings_obj)
                return Response(serializer.data)
            return Response({})
        
        else:  # PUT or PATCH
            self.check_project_permissions(project, 'admin')
            settings_obj, created = ProjectSettings.objects.get_or_create(project=project)
            
            serializer = ProjectSettingsSerializer(
                settings_obj, 
                data=request.data, 
                partial=request.method == 'PATCH'
            )
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """
        Archive/unarchive project
        
        POST /api/projects/{id}/archive/
        Body: {"archive": true}
        """
        project = self.get_object()
        if project.owner != request.user:
            return Response(
                {'error': 'Only project owner can archive the project'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        archive = request.data.get('archive', True)
        project.is_archived = archive
        project.save()
        
        action_name = 'archived' if archive else 'unarchived'
        return Response({'message': f'Project {action_name} successfully'})
    
    @action(detail=False, methods=['get'])
    def my_projects(self, request):
        """
        Get current user's owned projects
        
        GET /api/projects/my_projects/
        """
        
        print("Fetching projects for user:", request.user)  
        projects = Project.objects.filter(
            owner=request.user
        ).select_related('owner').prefetch_related('collaborators__user')
        
        serializer = ProjectSerializer(projects, many=True, context={'request': request})
        return Response(serializer.data)
