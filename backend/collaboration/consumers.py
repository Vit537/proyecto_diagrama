"""
WebSocket consumers for real-time collaboration features.
"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from diagrams.models import Diagram
from projects.models import Project
from .models import ActiveUser, DiagramLock

User = get_user_model()
logger = logging.getLogger(__name__)


class DiagramConsumer(AsyncWebsocketConsumer):
    """
    Consumer for real-time diagram editing collaboration.
    Handles element creation, updates, deletions, and user presence.
    """
    
    async def connect(self):
        """Handle WebSocket connection."""
        self.diagram_id = self.scope['url_route']['kwargs']['diagram_id']
        self.room_group_name = f'diagram_{self.diagram_id}'
        self.user = self.scope["user"]
        
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Check if user has permission to access this diagram
        has_permission = await self.check_diagram_permission()
        if not has_permission:
            await self.close()
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Add user to active users and broadcast user joined
        await self.add_active_user()
        await self.broadcast_active_users()
        
        logger.info(f"User {self.user.email} connected to diagram {self.diagram_id}")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        if hasattr(self, 'room_group_name'):
            # Remove user from active users
            await self.remove_active_user()
            
            # Release any locks held by this user
            await self.release_user_locks()
            
            # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            
            # Broadcast updated active users
            await self.broadcast_active_users()
            
            logger.info(f"User {self.user.email} disconnected from diagram {self.diagram_id}")
    
    async def receive(self, text_data):
        """Handle received WebSocket message."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'element_update':
                await self.handle_element_update(data)
            elif message_type == 'element_create':
                await self.handle_element_create(data)
            elif message_type == 'element_delete':
                await self.handle_element_delete(data)
            elif message_type == 'cursor_move':
                await self.handle_cursor_move(data)
            elif message_type == 'element_lock':
                await self.handle_element_lock(data)
            elif message_type == 'element_unlock':
                await self.handle_element_unlock(data)
            else:
                await self.send_error(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON format")
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await self.send_error("Internal error")
    
    async def handle_element_update(self, data):
        """Handle element update message."""
        element_data = data.get('element')
        if not element_data:
            await self.send_error("Missing element data")
            return
        
        # Check if element is locked by another user
        is_locked = await self.check_element_lock(element_data.get('id'))
        if is_locked:
            await self.send_error("Element is locked by another user")
            return
        
        # Broadcast update to other users
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'element_updated',
                'element': element_data,
                'user': self.user.email,
                'timestamp': timezone.now().isoformat()
            }
        )
    
    async def handle_element_create(self, data):
        """Handle element creation message."""
        element_data = data.get('element')
        if not element_data:
            await self.send_error("Missing element data")
            return
        
        # Broadcast creation to other users
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'element_created',
                'element': element_data,
                'user': self.user.email,
                'timestamp': timezone.now().isoformat()
            }
        )
    
    async def handle_element_delete(self, data):
        """Handle element deletion message."""
        element_id = data.get('element_id')
        if not element_id:
            await self.send_error("Missing element ID")
            return
        
        # Check if element is locked by another user
        is_locked = await self.check_element_lock(element_id)
        if is_locked:
            await self.send_error("Element is locked by another user")
            return
        
        # Broadcast deletion to other users
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'element_deleted',
                'element_id': element_id,
                'user': self.user.email,
                'timestamp': timezone.now().isoformat()
            }
        )
    
    async def handle_cursor_move(self, data):
        """Handle cursor movement message."""
        cursor_data = data.get('cursor')
        if not cursor_data:
            return
        
        # Broadcast cursor position to other users (exclude sender)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'cursor_moved',
                'cursor': cursor_data,
                'user': self.user.email,
                'sender_channel': self.channel_name
            }
        )
    
    async def handle_element_lock(self, data):
        """Handle element lock request."""
        element_id = data.get('element_id')
        if not element_id:
            await self.send_error("Missing element ID")
            return
        
        # Try to acquire lock
        lock_acquired = await self.acquire_element_lock(element_id)
        if lock_acquired:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'element_locked',
                    'element_id': element_id,
                    'user': self.user.email,
                    'timestamp': timezone.now().isoformat()
                }
            )
        else:
            await self.send_error("Element is already locked")
    
    async def handle_element_unlock(self, data):
        """Handle element unlock request."""
        element_id = data.get('element_id')
        if not element_id:
            await self.send_error("Missing element ID")
            return
        
        # Release lock
        await self.release_element_lock(element_id)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'element_unlocked',
                'element_id': element_id,
                'user': self.user.email,
                'timestamp': timezone.now().isoformat()
            }
        )
    
    # Group message handlers
    async def element_updated(self, event):
        """Send element update to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'element_update',
            'element': event['element'],
            'user': event['user'],
            'timestamp': event['timestamp']
        }))
    
    async def element_created(self, event):
        """Send element creation to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'element_create',
            'element': event['element'],
            'user': event['user'],
            'timestamp': event['timestamp']
        }))
    
    async def element_deleted(self, event):
        """Send element deletion to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'element_delete',
            'element_id': event['element_id'],
            'user': event['user'],
            'timestamp': event['timestamp']
        }))
    
    async def cursor_moved(self, event):
        """Send cursor movement to WebSocket (exclude sender)."""
        if event.get('sender_channel') != self.channel_name:
            await self.send(text_data=json.dumps({
                'type': 'cursor_move',
                'cursor': event['cursor'],
                'user': event['user']
            }))
    
    async def element_locked(self, event):
        """Send element lock notification to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'element_lock',
            'element_id': event['element_id'],
            'user': event['user'],
            'timestamp': event['timestamp']
        }))
    
    async def element_unlocked(self, event):
        """Send element unlock notification to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'element_unlock',
            'element_id': event['element_id'],
            'user': event['user'],
            'timestamp': event['timestamp']
        }))
    
    async def active_users_update(self, event):
        """Send active users update to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'active_users',
            'users': event['users']
        }))
    
    # Helper methods
    async def send_error(self, message):
        """Send error message to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message
        }))
    
    @database_sync_to_async
    def check_diagram_permission(self):
        """Check if user has permission to access diagram."""
        try:
            diagram = Diagram.objects.get(id=self.diagram_id)
            return diagram.project.has_user_permission(self.user)
        except Diagram.DoesNotExist:
            return False
    
    @database_sync_to_async
    def add_active_user(self):
        """Add user to active users list."""
        ActiveUser.objects.get_or_create(
            user=self.user,
            diagram_id=self.diagram_id,
            defaults={'last_seen': timezone.now()}
        )
    
    @database_sync_to_async
    def remove_active_user(self):
        """Remove user from active users list."""
        ActiveUser.objects.filter(
            user=self.user,
            diagram_id=self.diagram_id
        ).delete()
    
    async def broadcast_active_users(self):
        """Broadcast active users list to all connected clients."""
        users = await self.get_active_users()
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'active_users_update',
                'users': users
            }
        )
    
    @database_sync_to_async
    def get_active_users(self):
        """Get list of active users for the diagram."""
        active_users = ActiveUser.objects.filter(
            diagram_id=self.diagram_id
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
    
    @database_sync_to_async
    def check_element_lock(self, element_id):
        """Check if element is locked by another user."""
        try:
            lock = DiagramLock.objects.get(element_id=element_id)
            return lock.user != self.user
        except DiagramLock.DoesNotExist:
            return False
    
    @database_sync_to_async
    def acquire_element_lock(self, element_id):
        """Try to acquire lock on element."""
        try:
            existing_lock = DiagramLock.objects.get(element_id=element_id)
            if existing_lock.user == self.user:
                # User already has the lock
                existing_lock.locked_at = timezone.now()
                existing_lock.save()
                return True
            return False  # Lock exists and belongs to another user
        except DiagramLock.DoesNotExist:
            # No existing lock, create new one
            DiagramLock.objects.create(
                element_id=element_id,
                user=self.user,
                diagram_id=self.diagram_id,
                locked_at=timezone.now()
            )
            return True
    
    @database_sync_to_async
    def release_element_lock(self, element_id):
        """Release lock on element."""
        DiagramLock.objects.filter(
            element_id=element_id,
            user=self.user
        ).delete()
    
    @database_sync_to_async
    def release_user_locks(self):
        """Release all locks held by the user in this diagram."""
        DiagramLock.objects.filter(
            user=self.user,
            diagram_id=self.diagram_id
        ).delete()


class ProjectConsumer(AsyncWebsocketConsumer):
    """
    Consumer for project-level notifications and updates.
    """
    
    async def connect(self):
        """Handle WebSocket connection."""
        self.project_id = self.scope['url_route']['kwargs']['project_id']
        self.room_group_name = f'project_{self.project_id}'
        self.user = self.scope["user"]
        
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Check if user has permission to access this project
        has_permission = await self.check_project_permission()
        if not has_permission:
            await self.close()
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"User {self.user.email} connected to project {self.project_id}")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            logger.info(f"User {self.user.email} disconnected from project {self.project_id}")
    
    async def receive(self, text_data):
        """Handle received WebSocket message."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'project_update':
                await self.handle_project_update(data)
            elif message_type == 'diagram_created':
                await self.handle_diagram_created(data)
            elif message_type == 'diagram_deleted':
                await self.handle_diagram_deleted(data)
            else:
                await self.send_error(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON format")
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await self.send_error("Internal error")
    
    async def handle_project_update(self, data):
        """Handle project update message."""
        project_data = data.get('project')
        if not project_data:
            await self.send_error("Missing project data")
            return
        
        # Broadcast update to other users
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'project_updated',
                'project': project_data,
                'user': self.user.email,
                'timestamp': timezone.now().isoformat()
            }
        )
    
    async def handle_diagram_created(self, data):
        """Handle diagram creation message."""
        diagram_data = data.get('diagram')
        if not diagram_data:
            await self.send_error("Missing diagram data")
            return
        
        # Broadcast creation to other users
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'diagram_created_notification',
                'diagram': diagram_data,
                'user': self.user.email,
                'timestamp': timezone.now().isoformat()
            }
        )
    
    async def handle_diagram_deleted(self, data):
        """Handle diagram deletion message."""
        diagram_id = data.get('diagram_id')
        if not diagram_id:
            await self.send_error("Missing diagram ID")
            return
        
        # Broadcast deletion to other users
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'diagram_deleted_notification',
                'diagram_id': diagram_id,
                'user': self.user.email,
                'timestamp': timezone.now().isoformat()
            }
        )
    
    # Group message handlers
    async def project_updated(self, event):
        """Send project update to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'project_update',
            'project': event['project'],
            'user': event['user'],
            'timestamp': event['timestamp']
        }))
    
    async def diagram_created_notification(self, event):
        """Send diagram creation notification to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'diagram_created',
            'diagram': event['diagram'],
            'user': event['user'],
            'timestamp': event['timestamp']
        }))
    
    async def diagram_deleted_notification(self, event):
        """Send diagram deletion notification to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'diagram_deleted',
            'diagram_id': event['diagram_id'],
            'user': event['user'],
            'timestamp': event['timestamp']
        }))
    
    async def send_error(self, message):
        """Send error message to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message
        }))
    
    @database_sync_to_async
    def check_project_permission(self):
        """Check if user has permission to access project."""
        try:
            project = Project.objects.get(id=self.project_id)
            return project.has_user_permission(self.user)
        except Project.DoesNotExist:
            return False


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    Consumer for user-specific notifications.
    """
    
    async def connect(self):
        """Handle WebSocket connection."""
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.user = self.scope["user"]
        
        if not self.user.is_authenticated or str(self.user.id) != self.user_id:
            await self.close()
            return
        
        self.room_group_name = f'notifications_{self.user_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"User {self.user.email} connected to notifications")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            logger.info(f"User {self.user.email} disconnected from notifications")
    
    async def receive(self, text_data):
        """Handle received WebSocket message."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'mark_read':
                await self.handle_mark_read(data)
            else:
                await self.send_error(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON format")
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await self.send_error("Internal error")
    
    async def handle_mark_read(self, data):
        """Handle mark notification as read."""
        notification_id = data.get('notification_id')
        if notification_id:
            # Mark notification as read in database
            await self.mark_notification_read(notification_id)
    
    # Group message handlers
    async def send_notification(self, event):
        """Send notification to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification'],
            'timestamp': event['timestamp']
        }))
    
    async def send_error(self, message):
        """Send error message to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message
        }))
    
    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Mark notification as read."""
        # This would be implemented with a Notification model
        # For now, just log the action
        logger.info(f"Marking notification {notification_id} as read for user {self.user.id}")
