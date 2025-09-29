from django.db import models
from django.conf import settings
import uuid
from datetime import timedelta
from django.utils import timezone


class CollaborationSession(models.Model):
    """
    Active collaboration session for a diagram
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    diagram = models.ForeignKey('diagrams.Diagram', on_delete=models.CASCADE, related_name='collaboration_sessions')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            # Session expires after 8 hours by default
            self.expires_at = timezone.now() + timedelta(hours=8)
        super().save(*args, **kwargs)
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def get_active_users(self):
        """Get all currently active users in this session"""
        cutoff_time = timezone.now() - timedelta(minutes=5)  # Consider user active if seen in last 5 minutes
        return self.participants.filter(
            last_seen__gte=cutoff_time,
            is_active=True
        )
    
    def __str__(self):
        return f"Session for {self.diagram.name}"


class SessionParticipant(models.Model):
    """
    User participating in a collaboration session
    """
    session = models.ForeignKey(CollaborationSession, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='collaboration_participations')
    joined_at = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)
    cursor_position = models.JSONField(default=dict)  # {x, y} coordinates
    selected_elements = models.JSONField(default=list)  # List of element IDs currently selected
    is_active = models.BooleanField(default=True)
    user_color = models.CharField(max_length=7, default='#007bff')  # Hex color for user cursor/selections
    
    class Meta:
        unique_together = ['session', 'user']
        indexes = [
            models.Index(fields=['session', 'is_active', 'last_seen']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} in {self.session.diagram.name}"
    
    def is_online(self):
        """Check if participant is considered online (active in last 5 minutes)"""
        return self.is_active and (timezone.now() - self.last_seen) < timedelta(minutes=5)


class ElementLock(models.Model):
    """
    Lock mechanism to prevent simultaneous editing of diagram elements
    """
    element = models.ForeignKey('diagrams.DiagramElement', on_delete=models.CASCADE, related_name='locks')
    locked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='element_locks')
    session = models.ForeignKey(CollaborationSession, on_delete=models.CASCADE, related_name='element_locks')
    locked_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    lock_type = models.CharField(max_length=20, default='edit')  # 'edit', 'move', 'delete'
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            # Lock expires after 30 minutes by default
            self.expires_at = timezone.now() + timedelta(minutes=30)
        super().save(*args, **kwargs)
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def refresh_lock(self):
        """Extend lock expiration time"""
        self.expires_at = timezone.now() + timedelta(minutes=30)
        self.save(update_fields=['expires_at'])
    
    class Meta:
        unique_together = ['element', 'session']
        indexes = [
            models.Index(fields=['locked_by', 'expires_at']),
            models.Index(fields=['element', 'expires_at']),
        ]
    
    def __str__(self):
        return f"{self.element.name} locked by {self.locked_by.get_full_name()}"


class DiagramChange(models.Model):
    """
    Track changes made to diagrams for real-time synchronization
    """
    CHANGE_TYPES = [
        ('element_created', 'Element Created'),
        ('element_updated', 'Element Updated'),
        ('element_deleted', 'Element Deleted'),
        ('element_moved', 'Element Moved'),
        ('attribute_created', 'Attribute Created'),
        ('attribute_updated', 'Attribute Updated'),
        ('attribute_deleted', 'Attribute Deleted'),
        ('method_created', 'Method Created'),
        ('method_updated', 'Method Updated'),
        ('method_deleted', 'Method Deleted'),
        ('relationship_created', 'Relationship Created'),
        ('relationship_updated', 'Relationship Updated'),
        ('relationship_deleted', 'Relationship Deleted'),
        ('canvas_updated', 'Canvas Updated'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    diagram = models.ForeignKey('diagrams.Diagram', on_delete=models.CASCADE, related_name='changes')
    session = models.ForeignKey(CollaborationSession, on_delete=models.CASCADE, related_name='changes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='diagram_changes')
    change_type = models.CharField(max_length=30, choices=CHANGE_TYPES)
    object_id = models.UUIDField(null=True, blank=True)  # ID of the affected object
    object_type = models.CharField(max_length=50, null=True, blank=True)  # Type of the affected object
    change_data = models.JSONField()  # Detailed change information
    timestamp = models.DateTimeField(auto_now_add=True)
    sequence_number = models.BigIntegerField()  # For ordering changes
    
    class Meta:
        ordering = ['sequence_number']
        indexes = [
            models.Index(fields=['diagram', 'timestamp']),
            models.Index(fields=['session', 'sequence_number']),
            models.Index(fields=['user', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.get_change_type_display()} by {self.user.get_full_name()} at {self.timestamp}"


class UserCursor(models.Model):
    """
    Real-time cursor positions for collaborative editing
    """
    session = models.ForeignKey(CollaborationSession, on_delete=models.CASCADE, related_name='cursors')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cursors')
    position_x = models.FloatField()
    position_y = models.FloatField()
    last_updated = models.DateTimeField(auto_now=True)
    is_visible = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['session', 'user']
    
    def __str__(self):
        return f"{self.user.get_full_name()} cursor at ({self.position_x}, {self.position_y})"


class Comment(models.Model):
    """
    Comments on diagram elements for collaboration
    """
    element = models.ForeignKey(
        'diagrams.DiagramElement', 
        on_delete=models.CASCADE, 
        related_name='comments',
        null=True, 
        blank=True
    )
    diagram = models.ForeignKey('diagrams.Diagram', on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    position_x = models.FloatField(null=True, blank=True)  # Position on canvas if not attached to element
    position_y = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='resolved_comments'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['diagram', 'is_resolved', '-created_at']),
            models.Index(fields=['element', '-created_at']),
        ]
    
    def __str__(self):
        target = self.element.name if self.element else 'Canvas'
        return f"Comment on {target} by {self.author.get_full_name()}"


class ActiveUser(models.Model):
    """
    Track users actively editing a specific diagram via WebSocket
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='active_diagram_sessions')
    diagram_id = models.UUIDField()  # Reference to diagram without foreign key constraint for flexibility
    last_seen = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'diagram_id']
        indexes = [
            models.Index(fields=['diagram_id', 'last_seen']),
            models.Index(fields=['user', 'diagram_id']),
        ]
    
    def __str__(self):
        return f"{self.user.email} active on diagram {self.diagram_id}"


class DiagramLock(models.Model):
    """
    Simple locking mechanism for diagram elements during real-time editing
    """
    element_id = models.CharField(max_length=255)  # Flexible element ID (could be UUID or any identifier)
    diagram_id = models.UUIDField()  # Reference to diagram
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='diagram_locks')
    locked_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['element_id', 'diagram_id']
        indexes = [
            models.Index(fields=['diagram_id', 'user']),
            models.Index(fields=['element_id', 'diagram_id']),
            models.Index(fields=['user', 'locked_at']),
        ]
    
    def __str__(self):
        return f"Element {self.element_id} locked by {self.user.email}"


class Notification(models.Model):
    """
    User notifications for collaboration events.
    """
    NOTIFICATION_TYPES = [
        ('project_invite', 'Project Invitation'),
        ('project_update', 'Project Updated'),
        ('diagram_shared', 'Diagram Shared'),
        ('comment_added', 'Comment Added'),
        ('mention', 'User Mentioned'),
        ('collaboration_request', 'Collaboration Request'),
        ('element_conflict', 'Element Conflict'),
        ('project_role_changed', 'Project Role Changed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_notifications', null=True, blank=True)
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    data = models.JSONField(default=dict)  # Additional context data
    
    # References
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, null=True, blank=True)
    diagram = models.ForeignKey('diagrams.Diagram', on_delete=models.CASCADE, null=True, blank=True)
    
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read', '-created_at']),
            models.Index(fields=['recipient', 'notification_type', '-created_at']),
            models.Index(fields=['project', '-created_at']),
            models.Index(fields=['diagram', '-created_at']),
        ]
    
    def mark_as_read(self):
        """Mark notification as read."""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
    
    def __str__(self):
        return f"{self.get_notification_type_display()} for {self.recipient.email}"
