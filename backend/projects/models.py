from django.db import models
from django.conf import settings
from django.core.validators import MinLengthValidator
import uuid


class Project(models.Model):
    """
    Project model for UML diagram projects
    """
    VISIBILITY_CHOICES = [
        ('private', 'Private'),
        ('public', 'Public'),
        ('team', 'Team Only'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, validators=[MinLengthValidator(3)])
    description = models.TextField(blank=True, null=True)
     # settings.AUTH_USER_MODEL, 
    owner = models.ForeignKey(settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE, 
        related_name='owned_projects'
    )
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='private')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_archived = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['owner', '-updated_at']),
            models.Index(fields=['visibility', '-updated_at']),
        ]
    
    def __str__(self):
        return f"{self.name} (by {self.owner.get_full_name()})"
    
    def get_collaborators(self):
        """Get all collaborators for this project"""
        return ProjectCollaborator.objects.filter(project=self)
    
    def has_permission(self, user, permission='view'):
        """Check if user has permission for this project"""
        if self.owner == user:
            return True
        
        if self.visibility == 'public' and permission == 'view':
            return True
            
        collaborator = ProjectCollaborator.objects.filter(
            project=self, user=user
        ).first()
        
        if not collaborator:
            return False
            
        permission_map = {
            'view': ['viewer', 'editor', 'admin'],
            'edit': ['editor', 'admin'],
            'admin': ['admin']
        }
        
        return collaborator.role in permission_map.get(permission, [])


class ProjectCollaborator(models.Model):
    """
    Many-to-many relationship between projects and users with roles
    """
    ROLE_CHOICES = [
        ('viewer', 'Viewer'),
        ('editor', 'Editor'),
        ('admin', 'Admin'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='collaborators')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='project_collaborations')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='viewer')
    invited_at = models.DateTimeField(auto_now_add=True)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='sent_invitations'
    )
    accepted_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['project', 'user']
        indexes = [
            models.Index(fields=['project', 'is_active']),
            models.Index(fields=['user', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.project.name} ({self.role})"


class ProjectSettings(models.Model):
    """
    Project-specific settings and configurations
    """
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='settings')
    default_diagram_type = models.CharField(max_length=50, default='class')
    auto_save_interval = models.IntegerField(default=30)  # seconds
    collaboration_settings = models.JSONField(default=dict)
    export_settings = models.JSONField(default=dict)
    notification_settings = models.JSONField(default=dict)
    
    def __str__(self):
        return f"Settings for {self.project.name}"
