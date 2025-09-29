import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Divider,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close,
  CheckCircle,
  Info,
  Warning,
  Error,
  Person,
  AccountTree,
  Code,
  Delete,
  Refresh,
  WifiOff,
} from '@mui/icons-material';
import { useNotifications } from '../../hooks/useNotifications';
import { Notification } from '../../types';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ open, onClose }) => {
  const {
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
  } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'project_invitation':
      case 'project_update':
        return <AccountTree />;
      case 'diagram_shared':
      case 'diagram_comment':
        return <AccountTree />;
      case 'user_mention':
        return <Person />;
      case 'code_generation':
        return <Code />;
      case 'success':
        return <CheckCircle />;
      case 'warning':
        return <Warning />;
      case 'error':
        return <Error />;
      default:
        return <Info />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'success.main';
      case 'warning':
        return 'warning.main';
      case 'error':
        return 'error.main';
      default:
        return 'primary.main';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `hace ${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `hace ${Math.floor(diffInMinutes / 60)}h`;
    return `hace ${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          maxWidth: 400,
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" component="h2">
              Notificaciones
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={unreadCount}
                size="small"
                color="primary"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
            {/* Connection Status */}
            {!isConnected && (
              <WifiOff sx={{ color: 'error.main', fontSize: 20 }} />
            )}
          </Box>
          <Box>
            <IconButton onClick={refreshNotifications} size="small">
              <Refresh />
            </IconButton>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </Box>

        {/* Connection Error */}
        {error && (
          <Box sx={{ p: 2 }}>
            <Alert 
              severity="warning" 
              action={
                <Button color="inherit" size="small" onClick={reconnect}>
                  Reconectar
                </Button>
              }
            >
              {error}
            </Alert>
          </Box>
        )}

        {/* Actions */}
        {unreadCount > 0 && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Button
              size="small"
              onClick={markAllAsRead}
              sx={{ textTransform: 'none' }}
              fullWidth
            >
              Marcar todas como leídas
            </Button>
          </Box>
        )}

        {/* Notifications List */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 200,
              }}
            >
              <CircularProgress size={32} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 200,
                color: 'text.secondary',
              }}
            >
              <Info sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography variant="body1">
                No tienes notificaciones
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Las nuevas notificaciones aparecerán aquí
              </Typography>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      backgroundColor: notification.is_read 
                        ? 'transparent' 
                        : 'action.hover',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.selected',
                      },
                    }}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      deleteNotification(notification.id);
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: getNotificationColor(notification.type),
                          width: 40,
                          height: 40,
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: notification.is_read ? 400 : 600,
                                flexGrow: 1,
                              }}
                            >
                              {notification.title}
                            </Typography>
                            {!notification.is_read && (
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: 'primary.main',
                                  ml: 1,
                                }}
                              />
                            )}
                          </Box>
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontSize: '0.8rem' }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            sx={{ mt: 0.5, display: 'block' }}
                          >
                            {formatTimeAgo(notification.created_at)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default NotificationCenter;
