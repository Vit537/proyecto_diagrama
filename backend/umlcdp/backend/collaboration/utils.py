"""
Utility functions for real-time collaboration features.
"""

from datetime import timedelta
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import ActiveUser, DiagramLock


class CollaborationManager:
    """
    Manager class for handling real-time collaboration features.
    """
    
    def __init__(self):
        self.channel_layer = get_channel_layer()
    
    def get_active_users(self, diagram_id):
        """
        Get list of users currently active on a diagram.
        """
        cutoff_time = timezone.now() - timedelta(minutes=5)  # Consider users active if seen in last 5 minutes
        active_users = ActiveUser.objects.filter(
            diagram_id=diagram_id,
            last_seen__gte=cutoff_time
        ).select_related('user')
        
        return [
            {
                'id': au.user.id,
                'email': au.user.email,
                'first_name': au.user.first_name,
                'last_name': au.user.last_name,
                'last_seen': au.last_seen.isoformat()
            }
            for au in active_users
        ]
    
    def cleanup_expired_locks(self, diagram_id=None):
        """
        Clean up expired locks for a diagram or all diagrams.
        """
        cutoff_time = timezone.now() - timedelta(minutes=30)  # Locks expire after 30 minutes
        query = DiagramLock.objects.filter(locked_at__lt=cutoff_time)
        
        if diagram_id:
            query = query.filter(diagram_id=diagram_id)
        
        expired_locks = list(query.values('element_id', 'diagram_id', 'user__email'))
        deleted_count = query.delete()[0]
        
        # Notify clients about unlocked elements
        for lock in expired_locks:
            self.broadcast_element_unlock(
                lock['diagram_id'], 
                lock['element_id'], 
                lock['user__email']
            )
        
        return deleted_count
    
    def cleanup_inactive_users(self, diagram_id=None):
        """
        Clean up users that haven't been seen in the last 5 minutes.
        """
        cutoff_time = timezone.now() - timedelta(minutes=5)
        query = ActiveUser.objects.filter(last_seen__lt=cutoff_time)
        
        if diagram_id:
            query = query.filter(diagram_id=diagram_id)
        
        deleted_count = query.delete()[0]
        return deleted_count
    
    def force_unlock_element(self, diagram_id, element_id, user=None):
        """
        Force unlock an element, optionally only if locked by a specific user.
        """
        query = DiagramLock.objects.filter(
            diagram_id=diagram_id,
            element_id=element_id
        )
        
        if user:
            query = query.filter(user=user)
        
        lock = query.first()
        if lock:
            lock.delete()
            self.broadcast_element_unlock(diagram_id, element_id, lock.user.email)
            return True
        
        return False
    
    def get_element_locks(self, diagram_id):
        """
        Get all current locks for a diagram.
        """
        locks = DiagramLock.objects.filter(
            diagram_id=diagram_id
        ).select_related('user')
        
        return [
            {
                'element_id': lock.element_id,
                'user': {
                    'id': lock.user.id,
                    'email': lock.user.email,
                    'first_name': lock.user.first_name,
                    'last_name': lock.user.last_name,
                },
                'locked_at': lock.locked_at.isoformat()
            }
            for lock in locks
        ]
    
    def broadcast_to_diagram(self, diagram_id, message_type, data):
        """
        Broadcast a message to all users connected to a diagram.
        """
        room_group_name = f'diagram_{diagram_id}'
        
        async_to_sync(self.channel_layer.group_send)(
            room_group_name,
            {
                'type': message_type,
                **data
            }
        )
    
    def broadcast_element_update(self, diagram_id, element_data, user_email):
        """
        Broadcast element update to diagram room.
        """
        self.broadcast_to_diagram(
            diagram_id,
            'element_updated',
            {
                'element': element_data,
                'user': user_email,
                'timestamp': timezone.now().isoformat()
            }
        )
    
    def broadcast_element_create(self, diagram_id, element_data, user_email):
        """
        Broadcast element creation to diagram room.
        """
        self.broadcast_to_diagram(
            diagram_id,
            'element_created',
            {
                'element': element_data,
                'user': user_email,
                'timestamp': timezone.now().isoformat()
            }
        )
    
    def broadcast_element_delete(self, diagram_id, element_id, user_email):
        """
        Broadcast element deletion to diagram room.
        """
        self.broadcast_to_diagram(
            diagram_id,
            'element_deleted',
            {
                'element_id': element_id,
                'user': user_email,
                'timestamp': timezone.now().isoformat()
            }
        )
    
    def broadcast_element_lock(self, diagram_id, element_id, user_email):
        """
        Broadcast element lock to diagram room.
        """
        self.broadcast_to_diagram(
            diagram_id,
            'element_locked',
            {
                'element_id': element_id,
                'user': user_email,
                'timestamp': timezone.now().isoformat()
            }
        )
    
    def broadcast_element_unlock(self, diagram_id, element_id, user_email):
        """
        Broadcast element unlock to diagram room.
        """
        self.broadcast_to_diagram(
            diagram_id,
            'element_unlocked',
            {
                'element_id': element_id,
                'user': user_email,
                'timestamp': timezone.now().isoformat()
            }
        )
    
    def broadcast_project_update(self, project_id, project_data, user_email):
        """
        Broadcast project update to project room.
        """
        room_group_name = f'project_{project_id}'
        
        async_to_sync(self.channel_layer.group_send)(
            room_group_name,
            {
                'type': 'project_updated',
                'project': project_data,
                'user': user_email,
                'timestamp': timezone.now().isoformat()
            }
        )
    
    def send_notification(self, user_id, notification_data):
        """
        Send notification to a specific user.
        """
        room_group_name = f'notifications_{user_id}'
        
        async_to_sync(self.channel_layer.group_send)(
            room_group_name,
            {
                'type': 'send_notification',
                'notification': notification_data,
                'timestamp': timezone.now().isoformat()
            }
        )


# Global instance
collaboration_manager = CollaborationManager()
