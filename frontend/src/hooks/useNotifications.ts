import { useState, useEffect, useCallback, useRef } from 'react';
import { NotificationWebSocketService } from '../services/websocket';
import { useAuth } from '../contexts/AuthContext';
import { Notification } from '../types';
import api from '../services/api';
import { toast } from 'react-toastify';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  // Actions
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  // Connection
  reconnect: () => void;
}

export const useNotifications = (): UseNotificationsReturn => {
  const { user, token } = useAuth();
  const wsServiceRef = useRef<NotificationWebSocketService | null>(null);

  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Initialize WebSocket connection for notifications
  const initializeConnection = useCallback(async () => {
    if (!user?.id || !token) return;

    try {
      setError(null);
      
      // Clean up existing connection
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
      }

      // Create new notification service
      const wsService = new NotificationWebSocketService();
      wsServiceRef.current = wsService;

      // Set up event listeners before connecting
      wsService.addEventListener('notification', (data: any) => {
        console.log('New notification received:', data);
        
        if (data.notification) {
          const newNotification = data.notification;
          
          // Add to notifications list
          setNotifications(prev => [newNotification, ...prev]);
          
          // Show toast notification
          showNotificationToast(newNotification);
        }
      });

      wsService.addEventListener('notification_updated', (data: any) => {
        console.log('Notification updated:', data);
        if (data.notification) {
          setNotifications(prev => prev.map(n => 
            n.id === data.notification.id ? data.notification : n
          ));
        }
      });

      wsService.addEventListener('notification_deleted', (data: any) => {
        console.log('Notification deleted:', data);
        if (data.notification_id) {
          setNotifications(prev => prev.filter(n => n.id !== data.notification_id));
        }
      });

      wsService.addEventListener('error', (error: any) => {
        console.error('Notifications WebSocket error:', error);
        setError(error);
      });

      wsService.addEventListener('connection_lost', () => {
        setIsConnected(false);
        setError('Conexión perdida con el servidor de notificaciones');
      });

      // Connect to notifications WebSocket
      await wsService.connectToNotifications(user.id);
      setIsConnected(true);
      
      console.log(`Connected to notifications WebSocket for user ${user.id}`);

    } catch (error) {
      console.error('Failed to connect to notifications WebSocket:', error);
      setError(error instanceof Error ? error.message : 'Error de conexión');
      setIsConnected(false);
    }
  }, [user?.id, token]);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/notifications/', {
        headers: { Authorization: `Bearer ${token}` },
        params: { ordering: '-created_at', limit: 50 }
      });
      
      setNotifications(response.data.results || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initialize on mount
  useEffect(() => {
    fetchNotifications();
    initializeConnection();

    // Cleanup on unmount
    return () => {
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
        wsServiceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [fetchNotifications, initializeConnection]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await api.patch(`/notifications/${notificationId}/`, 
        { is_read: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));

      // Notify via WebSocket if connected
      if (wsServiceRef.current && isConnected) {
        wsServiceRef.current.markNotificationAsRead(notificationId.toString());
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Error al marcar como leída');
    }
  }, [token, isConnected]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await api.post('/notifications/mark_all_read/', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Error al marcar todas como leídas');
    }
  }, [token]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      await api.delete(`/notifications/${notificationId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      toast.success('Notificación eliminada');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Error al eliminar notificación');
    }
  }, [token]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Reconnect function
  const reconnect = useCallback(() => {
    setError(null);
    initializeConnection();
  }, [initializeConnection]);

  return {
    notifications,
    unreadCount,
    isConnected,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    reconnect,
  };
};

// Helper function to show notification toasts
const showNotificationToast = (notification: Notification) => {
  const toastOptions = {
    position: 'top-right' as const,
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };

  switch (notification.type) {
    case 'project_invitation':
      toast.info(notification.title, toastOptions);
      break;
    case 'project_update':
      toast.info(notification.title, toastOptions);
      break;
    case 'diagram_shared':
      toast.success(notification.title, toastOptions);
      break;
    case 'user_mention':
      toast.info(notification.title, toastOptions);
      break;
    case 'code_generation':
      toast.success(notification.title, toastOptions);
      break;
    case 'error':
      toast.error(notification.title, toastOptions);
      break;
    case 'warning':
      toast.warning(notification.title, toastOptions);
      break;
    case 'success':
      toast.success(notification.title, toastOptions);
      break;
    default:
      toast(notification.title, toastOptions);
  }
};
