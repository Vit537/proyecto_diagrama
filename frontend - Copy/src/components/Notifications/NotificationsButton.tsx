import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Tooltip,
} from '@mui/material';
import { Notifications } from '@mui/icons-material';
import { useNotificationContext } from '../../contexts/NotificationContext';
import NotificationCenter from './NotificationCenter';

const NotificationsButton: React.FC = () => {
  const { unreadCount } = useNotificationContext();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Tooltip title="Notificaciones">
        <IconButton
          size="large"
          color="inherit"
          onClick={handleOpen}
        >
          <Badge 
            badgeContent={unreadCount} 
            color="error"
            overlap="circular"
            max={99}
          >
            <Notifications />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <NotificationCenter
        open={open}
        onClose={handleClose}
      />
    </>
  );
};

export default NotificationsButton;
