import React, { createContext, useContext, useEffect } from 'react';
// import { useNotifications } from '../hooks/useNotifications';
import { type Notification } from '../types';

interface NotificationContextType {
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

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  // const notificationHook = useNotifications();

  // Update document title with unread count
  // useEffect(() => {
  //   const baseTitle = 'UML Collaborative Designer';
  //   if (notificationHook.unreadCount > 0) {
  //     document.title = `(${notificationHook.unreadCount}) ${baseTitle}`;
  //   } else {
  //     document.title = baseTitle;
  //   }
  // }, [notificationHook.unreadCount]);

  // Request notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // return (
  //   <NotificationContext.Provider value={notificationHook}>
  //     {children}
  //   </NotificationContext.Provider>
  // );
  return <NotificationContext.Provider value={null}>{children}</NotificationContext.Provider>;
};
