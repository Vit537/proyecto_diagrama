from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from diagrams.models import Diagram
from projects.models import Project
from .utils import collaboration_manager
from .models import ActiveUser, DiagramLock
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class CollaborationViewSet(viewsets.ViewSet):
    """
    ViewSet for managing real-time collaboration features.
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['get'], url_path='active-users')
    def active_users(self, request, pk=None):
        """
        Get list of users currently active on a diagram.
        """
        try:
            diagram = get_object_or_404(Diagram, id=pk)
            
            # Check if user has permission to access this diagram
            if not diagram.project.has_user_permission(request.user):
                return Response(
                    {'error': 'You do not have permission to access this diagram'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            active_users = collaboration_manager.get_active_users(diagram.id)
            
            return Response({
                'active_users': active_users,
                'count': len(active_users)
            })
            
        except Exception as e:
            logger.error(f"Error getting active users for diagram {pk}: {e}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'], url_path='locks')
    def element_locks(self, request, pk=None):
        """
        Get all current element locks for a diagram.
        """
        try:
            diagram = get_object_or_404(Diagram, id=pk)
            
            # Check if user has permission to access this diagram
            if not diagram.project.has_user_permission(request.user):
                return Response(
                    {'error': 'You do not have permission to access this diagram'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            locks = collaboration_manager.get_element_locks(diagram.id)
            
            return Response({
                'locks': locks,
                'count': len(locks)
            })
            
        except Exception as e:
            logger.error(f"Error getting locks for diagram {pk}: {e}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='force-unlock')
    def force_unlock(self, request, pk=None):
        """
        Force unlock an element (admin/owner only).
        """
        try:
            diagram = get_object_or_404(Diagram, id=pk)
            
            # Check if user has permission to access this diagram and is owner/admin
            if not (diagram.project.has_user_permission(request.user) and 
                   diagram.project.owner == request.user):
                return Response(
                    {'error': 'You do not have permission to force unlock elements'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            element_id = request.data.get('element_id')
            if not element_id:
                return Response(
                    {'error': 'element_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            success = collaboration_manager.force_unlock_element(
                diagram.id, 
                element_id
            )
            
            if success:
                return Response({
                    'message': 'Element unlocked successfully',
                    'element_id': element_id
                })
            else:
                return Response(
                    {'error': 'Element was not locked'},
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Exception as e:
            logger.error(f"Error force unlocking element in diagram {pk}: {e}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='cleanup')
    def cleanup(self, request, pk=None):
        """
        Clean up expired locks and inactive users for a diagram (admin/owner only).
        """
        try:
            diagram = get_object_or_404(Diagram, id=pk)
            
            # Check if user has permission to access this diagram and is owner/admin
            if not (diagram.project.has_user_permission(request.user) and 
                   diagram.project.owner == request.user):
                return Response(
                    {'error': 'You do not have permission to perform cleanup'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            expired_locks = collaboration_manager.cleanup_expired_locks(diagram.id)
            inactive_users = collaboration_manager.cleanup_inactive_users(diagram.id)
            
            return Response({
                'message': 'Cleanup completed successfully',
                'expired_locks_removed': expired_locks,
                'inactive_users_removed': inactive_users
            })
            
        except Exception as e:
            logger.error(f"Error during cleanup for diagram {pk}: {e}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='session-info')
    def session_info(self, request):
        """
        Get current user's active collaboration sessions.
        """
        try:
            user_sessions = ActiveUser.objects.filter(
                user=request.user
            ).values('diagram_id', 'last_seen', 'created_at')
            
            user_locks = DiagramLock.objects.filter(
                user=request.user
            ).values('diagram_id', 'element_id', 'locked_at')
            
            return Response({
                'active_sessions': list(user_sessions),
                'active_locks': list(user_locks),
                'session_count': len(user_sessions),
                'lock_count': len(user_locks)
            })
            
        except Exception as e:
            logger.error(f"Error getting session info for user {request.user.id}: {e}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
