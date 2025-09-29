import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
} from '@mui/material';
import {
  CheckCircle,
  WifiOff,
  Refresh,
  People,
  Info,
} from '@mui/icons-material';
import { ActiveUser } from '../../types';

interface ConnectionStatusProps {
  isConnected: boolean;
  connectionError: string | null;
  activeUsers: ActiveUser[];
  onReconnect: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  connectionError,
  activeUsers,
  onReconnect,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const getStatusColor = () => {
    if (!isConnected) return 'error';
    return activeUsers.length > 0 ? 'success' : 'default';
  };

  const getStatusText = () => {
    if (!isConnected) return 'Desconectado';
    if (activeUsers.length === 0) return 'Solo';
    if (activeUsers.length === 1) return '1 colaborador';
    return `${activeUsers.length} colaboradores`;
  };

  const getStatusIcon = () => {
    if (!isConnected) return <WifiOff />;
    return activeUsers.length > 0 ? <People /> : <CheckCircle />;
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Chip
        icon={getStatusIcon()}
        label={getStatusText()}
        color={getStatusColor()}
        variant={isConnected ? 'outlined' : 'filled'}
        onClick={handleClick}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: isConnected ? 'action.hover' : 'error.dark',
          },
        }}
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            p: 2,
            minWidth: 300,
          },
        }}
      >
        <Box>
          <Typography variant="h6" gutterBottom>
            Estado de Colaboración
          </Typography>

          {/* Connection Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            {isConnected ? (
              <>
                <CheckCircle sx={{ color: 'success.main' }} />
                <Typography variant="body2">
                  Conectado al servidor
                </Typography>
              </>
            ) : (
              <>
                <WifiOff sx={{ color: 'error.main' }} />
                <Typography variant="body2" color="error">
                  Desconectado
                </Typography>
                {connectionError && (
                  <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                    {connectionError}
                  </Typography>
                )}
              </>
            )}
          </Box>

          {/* Reconnect Button */}
          {!isConnected && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<Refresh />}
                onClick={() => {
                  onReconnect();
                  handleClose();
                }}
                fullWidth
              >
                Reconectar
              </Button>
            </Box>
          )}

          {/* Active Users */}
          <Typography variant="subtitle2" gutterBottom>
            Usuarios Activos ({activeUsers.length})
          </Typography>

          {activeUsers.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              No hay otros usuarios conectados
            </Typography>
          ) : (
            <List dense sx={{ py: 0 }}>
              {activeUsers.slice(0, 5).map((user) => (
                <ListItem key={user.id} sx={{ px: 0, py: 0.5 }}>
                  <ListItemText
                    primary={user.first_name || user.email.split('@')[0]}
                    secondary={`Visto hace ${formatLastSeen(user.last_seen)}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
              {activeUsers.length > 5 && (
                <Typography variant="caption" color="text.secondary">
                  y {activeUsers.length - 5} más...
                </Typography>
              )}
            </List>
          )}

          {/* Help Text */}
          <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Info fontSize="small" />
              Los cambios se sincronizan automáticamente entre todos los usuarios conectados
            </Typography>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};

const formatLastSeen = (lastSeen: string) => {
  const date = new Date(lastSeen);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'ahora';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
  return `${Math.floor(diffInMinutes / 1440)}d`;
};

export default ConnectionStatus;
