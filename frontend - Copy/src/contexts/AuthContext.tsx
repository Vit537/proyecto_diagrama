import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthTokens, LoginCredentials, RegisterData } from '../types';
import { authAPI, tokenManager } from '../services/api';
import WebSocketManager from '../services/websocket';
import { set } from 'react-hook-form';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(tokenManager.getAccessToken());


  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    setLoading(true);
    try {
      const token = tokenManager.getAccessToken();
      if (token && tokenManager.isAuthenticated()) {
        // Token exists and is valid, fetch user data
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
        
        // Connect to notifications WebSocket
        // const wsManager = WebSocketManager.getInstance();
        // const notificationService = wsManager.getNotificationService();
        // try {
        //   await notificationService.connectToNotifications(userData.id);
        // } catch (error) {
        //   console.warn('Failed to connect to notifications WebSocket:', error);
        // }

        // arreglar esto
      } else {
        // No valid token, clear any stored tokens
        tokenManager.clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      tokenManager.clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const { user: userData, tokens } = await authAPI.login(credentials);
      console.log('Login successful, user data:', userData);
      setUser(userData);
      setToken(tokens.access);
      setIsAuthenticated(true);
      
      // Connect to notifications WebSocket
      const wsManager = WebSocketManager.getInstance();
      const notificationService = wsManager.getNotificationService();
      try {
        await notificationService.connectToNotifications(userData.id);
      } catch (error) {
        console.warn('Failed to connect to notifications WebSocket:', error);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setLoading(true);
    try {
      const { user: userData, tokens } = await authAPI.register(data);
      setUser(userData);
      setToken(tokens.access);
      setIsAuthenticated(true);
      
      // Connect to notifications WebSocket
      const wsManager = WebSocketManager.getInstance();
      const notificationService = wsManager.getNotificationService();
      try {
        await notificationService.connectToNotifications(userData.id);
      } catch (error) {
        console.warn('Failed to connect to notifications WebSocket:', error);
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Disconnect all WebSocket connections
      const wsManager = WebSocketManager.getInstance();
      wsManager.disconnectAll();
      
      // Call logout API
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    if (!isAuthenticated) return;
    
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user data:', error);
      // If refresh fails, it might mean the token is invalid
      await logout();
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    token,
    login,
    register,
    logout,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
      return <div>Loading...</div>; // You can replace with a proper loading component
    }

    if (!isAuthenticated) {
      // Redirect to login or show unauthorized component
      window.location.href = '/login';
      return null;
    }

    return <Component {...props} />;
  };
};

export default AuthContext;
