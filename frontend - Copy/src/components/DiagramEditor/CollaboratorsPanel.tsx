import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Divider,
  Alert,
  Button,
} from '@mui/material';
import {
  Close,
  Circle,
  Lock,
  Person,
  WifiOff,
  Refresh,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { ActiveUser, ElementLock } from '../../types';

interface CollaboratorsPanelProps {
  activeUsers: ActiveUser[];
  elementLocks: ElementLock[];
  isConnected?: boolean;
  connectionError?: string | null;
  onClose: () => void;
  onReconnect?: () => void;
}

const CollaboratorsPanel: React.FC<CollaboratorsPanelProps> = ({
  activeUsers,
  elementLocks,
  isConnected = true,
  connectionError = null,
  onClose,
  onReconnect,
}) => {
  // Generate consistent colors for users
  const getUserColor = (userId: string) => {
    const colors = [
      '#1976d2', '#d32f2f', '#388e3c', '#f57c00',
      '#7b1fa2', '#0288d1', '#5d4037', '#616161'
    ];
    const index = userId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Activo ahora';
    if (diffInMinutes < 60) return `hace ${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `hace ${Math.floor(diffInMinutes / 60)}h`;
    return `hace ${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getUserLocks = (userId: string) => {
    return elementLocks.filter(lock => lock.user.id === userId);
  };

  return (
    <Paper
      elevation={2}
      sx={{
        width: 300,
        height: '100%',
        borderRadius: 0,
        borderLeft: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">
            Colaboradores
          </Typography>
          {/* Connection Status Indicator */}
          {isConnected ? (
            <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
          ) : (
            <WifiOff sx={{ color: 'error.main', fontSize: 20 }} />
          )}
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>

      {/* Connection Status */}
      {!isConnected && (
        <Box sx={{ p: 2 }}>
          <Alert 
            severity="warning" 
            action={
              onReconnect && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={onReconnect}
                  startIcon={<Refresh />}
                >
                  Reconectar
                </Button>
              )
            }
          >
            <Typography variant="body2">
              {connectionError || 'Desconectado del servidor de colaboración'}
            </Typography>
          </Alert>
        </Box>
      )}

      {/* Active Users Section */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Usuarios Activos ({activeUsers.length})
          </Typography>
          
          {activeUsers.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 4,
                color: 'text.secondary',
              }}
            >
              <Person sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography variant="body2">
                No hay otros usuarios conectados
              </Typography>
            </Box>
          ) : (
            <List dense>
              {activeUsers.map((user) => {
                const userColor = getUserColor(user.id);
                const userLocks = getUserLocks(user.id);
                
                return (
                  <ListItem key={user.id} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: userColor,
                          width: 36,
                          height: 36,
                        }}
                      >
                        {user.first_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {user.first_name || user.email.split('@')[0]}
                          </Typography>
                          <Circle
                            sx={{
                              fontSize: 8,
                              color: 'success.main',
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {formatLastSeen(user.last_seen)}
                          </Typography>
                          
                          {/* Show locks */}
                          {userLocks.length > 0 && (
                            <Box sx={{ mt: 0.5 }}>
                              <Chip
                                icon={<Lock />}
                                label={`${userLocks.length} elemento${userLocks.length !== 1 ? 's' : ''} bloqueado${userLocks.length !== 1 ? 's' : ''}`}
                                size="small"
                                variant="outlined"
                                color="warning"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            </Box>
                          )}
                          
                          {/* Show cursor position if available */}
                          {user.cursor_position && (
                            <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                              Cursor: ({Math.round(user.cursor_position.x)}, {Math.round(user.cursor_position.y)})
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>

        <Divider />

        {/* Element Locks Section */}
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Elementos Bloqueados ({elementLocks.length})
          </Typography>
          
          {elementLocks.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 4,
                color: 'text.secondary',
              }}
            >
              <Lock sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography variant="body2" textAlign="center">
                No hay elementos bloqueados
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5 }}>
                Los elementos se bloquean automáticamente cuando alguien los está editando
              </Typography>
            </Box>
          ) : (
            <List dense>
              {elementLocks.map((lock) => {
                const userColor = getUserColor(lock.user.id);
                
                return (
                  <ListItem key={lock.element_id} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: 'warning.light',
                          color: 'warning.contrastText',
                          width: 32,
                          height: 32,
                        }}
                      >
                        <Lock fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Elemento #{lock.element_id.slice(-6)}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Bloqueado por{' '}
                            <span style={{ color: userColor, fontWeight: 600 }}>
                              {lock.user.first_name || lock.user.email.split('@')[0]}
                            </span>
                          </Typography>
                          <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                            {formatLastSeen(lock.locked_at)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
      </Box>

      {/* Footer Info */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
          💡 La colaboración en tiempo real permite que múltiples usuarios trabajen simultáneamente
        </Typography>
      </Box>
    </Paper>
  );
};

export default CollaboratorsPanel;
