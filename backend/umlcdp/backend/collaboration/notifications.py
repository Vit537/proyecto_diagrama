"""
Notification service for real-time collaboration features.
"""

from django.contrib.auth import get_user_model
from .models import Notification
from .utils import collaboration_manager
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationService:
    """
    Service class for creating and sending notifications.
    """
    
    def create_notification(self, recipient, notification_type, title, message, 
                          sender=None, project=None, diagram=None, data=None):
        """
        Create a new notification and send it via WebSocket.
        """
        try:
            notification = Notification.objects.create(
                recipient=recipient,
                sender=sender,
                notification_type=notification_type,
                title=title,
                message=message,
                project=project,
                diagram=diagram,
                data=data or {}
            )
            
            # Send real-time notification via WebSocket
            self.send_realtime_notification(notification)
            
            return notification
            
        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            return None
    
    def send_realtime_notification(self, notification):
        """
        Send notification via WebSocket to the recipient.
        """
        try:
            notification_data = {
                'id': str(notification.id),
                'type': notification.notification_type,
                'title': notification.title,
                'message': notification.message,
                'data': notification.data,
                'sender': {
                    'id': notification.sender.id if notification.sender else None,
                    'email': notification.sender.email if notification.sender else None,
                    'name': notification.sender.get_full_name() if notification.sender else None,
                } if notification.sender else None,
                'project_id': str(notification.project.id) if notification.project else None,
                'diagram_id': str(notification.diagram.id) if notification.diagram else None,
                'is_read': notification.is_read,
                'created_at': notification.created_at.isoformat()
            }
            
            collaboration_manager.send_notification(
                notification.recipient.id,
                notification_data
            )
            
        except Exception as e:
            logger.error(f"Error sending real-time notification: {e}")
    
    def notify_project_invitation(self, invitee, inviter, project):
        """Notify user about project invitation."""
        return self.create_notification(
            recipient=invitee,
            sender=inviter,
            notification_type='project_invite',
            title=f'Invitation to {project.name}',
            message=f'{inviter.get_full_name()} invited you to collaborate on the project "{project.name}"',
            project=project,
            data={'project_id': str(project.id), 'inviter_id': str(inviter.id)}
        )
    
    def notify_project_update(self, project, updater, collaborators_list):
        """Notify collaborators about project updates."""
        notifications = []
        for collaborator in collaborators_list:
            if collaborator != updater:  # Don't notify the person who made the update
                notification = self.create_notification(
                    recipient=collaborator,
                    sender=updater,
                    notification_type='project_update',
                    title=f'Project "{project.name}" updated',
                    message=f'{updater.get_full_name()} made changes to the project "{project.name}"',
                    project=project,
                    data={'project_id': str(project.id), 'updater_id': str(updater.id)}
                )
                notifications.append(notification)
        return notifications
    
    def notify_diagram_shared(self, diagram, sharer, recipient):
        """Notify user about diagram being shared."""
        return self.create_notification(
            recipient=recipient,
            sender=sharer,
            notification_type='diagram_shared',
            title=f'Diagram "{diagram.name}" shared with you',
            message=f'{sharer.get_full_name()} shared the diagram "{diagram.name}" from project "{diagram.project.name}"',
            project=diagram.project,
            diagram=diagram,
            data={'diagram_id': str(diagram.id), 'project_id': str(diagram.project.id)}
        )
    
    def notify_comment_added(self, comment, commenters_list):
        """Notify relevant users about new comment."""
        notifications = []
        for user in commenters_list:
            if user != comment.author:  # Don't notify the commenter
                notification = self.create_notification(
                    recipient=user,
                    sender=comment.author,
                    notification_type='comment_added',
                    title='New comment on diagram',
                    message=f'{comment.author.get_full_name()} commented on diagram "{comment.diagram.name}"',
                    project=comment.diagram.project,
                    diagram=comment.diagram,
                    data={
                        'comment_id': str(comment.id) if hasattr(comment, 'id') else None,
                        'diagram_id': str(comment.diagram.id),
                        'element_id': str(comment.element.id) if comment.element else None
                    }
                )
                notifications.append(notification)
        return notifications
    
    def notify_user_mention(self, mentioned_user, mentioner, context_object, message):
        """Notify user about being mentioned."""
        if hasattr(context_object, 'project'):
            project = context_object.project
            diagram = context_object if hasattr(context_object, 'name') else None
        elif hasattr(context_object, 'diagram'):
            project = context_object.diagram.project
            diagram = context_object.diagram
        else:
            project = context_object
            diagram = None
        
        return self.create_notification(
            recipient=mentioned_user,
            sender=mentioner,
            notification_type='mention',
            title='You were mentioned',
            message=f'{mentioner.get_full_name()} mentioned you: {message[:100]}...' if len(message) > 100 else message,
            project=project,
            diagram=diagram,
            data={'context_type': type(context_object).__name__.lower()}
        )
    
    def notify_element_conflict(self, user, diagram, element_id, conflicting_user):
        """Notify user about element editing conflict."""
        return self.create_notification(
            recipient=user,
            sender=conflicting_user,
            notification_type='element_conflict',
            title='Element conflict detected',
            message=f'Element conflict with {conflicting_user.get_full_name()} in diagram "{diagram.name}"',
            project=diagram.project,
            diagram=diagram,
            data={'element_id': element_id, 'conflicting_user_id': str(conflicting_user.id)}
        )
    
    def notify_role_changed(self, user, project, new_role, changer):
        """Notify user about role change in project."""
        return self.create_notification(
            recipient=user,
            sender=changer,
            notification_type='project_role_changed',
            title=f'Role changed in "{project.name}"',
            message=f'Your role in project "{project.name}" has been changed to {new_role} by {changer.get_full_name()}',
            project=project,
            data={'new_role': new_role, 'changer_id': str(changer.id)}
        )
    
    def mark_notifications_read(self, user, notification_ids=None):
        """Mark notifications as read for a user."""
        from django.utils import timezone
        query = Notification.objects.filter(recipient=user, is_read=False)
        
        if notification_ids:
            query = query.filter(id__in=notification_ids)
        
        updated_count = query.update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return updated_count
    
    def get_unread_count(self, user):
        """Get count of unread notifications for a user."""
        return Notification.objects.filter(recipient=user, is_read=False).count()
    
    def get_notifications(self, user, limit=50, notification_type=None, is_read=None):
        """Get notifications for a user with optional filtering."""
        query = Notification.objects.filter(recipient=user)
        
        if notification_type:
            query = query.filter(notification_type=notification_type)
        
        if is_read is not None:
            query = query.filter(is_read=is_read)
        
        return query[:limit]


# Global instance
notification_service = NotificationService()
