import { useState, useEffect, useCallback, useRef } from 'react';
import { DiagramWebSocketService } from '../services/websocket';
import { useAuth } from '../contexts/AuthContext';
import { DiagramElement, ActiveUser, ElementLock } from '../types';
import { toast } from 'react-toastify';

interface UseCollaborationProps {
  diagramId: string | null;
  onElementsChange?: (elements: DiagramElement[]) => void;
  onElementUpdate?: (element: DiagramElement) => void;
  onElementCreate?: (element: DiagramElement) => void;
  onElementDelete?: (elementId: string) => void;
}

interface UseCollaborationReturn {
  activeUsers: ActiveUser[];
  elementLocks: ElementLock[];
  isConnected: boolean;
  connectionError: string | null;
  sendElementUpdate: (element: DiagramElement) => void;
  sendElementCreate: (element: DiagramElement) => void;
  sendElementDelete: (elementId: string) => void;
  sendCursorMove: (position: { x: number; y: number }) => void;
  requestElementLock: (elementId: string) => void;
  releaseElementLock: (elementId: string) => void;
  isElementLocked: (elementId: string) => boolean;
  isElementLockedByMe: (elementId: string) => boolean;
  reconnect: () => void;
}

export const useCollaboration = ({
  diagramId,
  onElementsChange,
  onElementUpdate,
  onElementCreate,
  onElementDelete,
}: UseCollaborationProps): UseCollaborationReturn => {
  const { user, token } = useAuth();
  const wsServiceRef = useRef<DiagramWebSocketService | null>(null);

  // State
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [elementLocks, setElementLocks] = useState<ElementLock[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Cursor throttling
  const lastCursorSent = useRef<number>(0);
  const CURSOR_THROTTLE_MS = 100; // Send cursor updates max every 100ms

  // Initialize WebSocket connection
  const initializeConnection = useCallback(async () => {
    if (!diagramId || !token || !user) return;

    try {
      setConnectionError(null);
      
      // Clean up existing connection
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
      }

      // Create new service
      const wsService = new DiagramWebSocketService();
      wsServiceRef.current = wsService;

      // Set up event listeners before connecting
      wsService.addEventListener('element_update', (data: any) => {
        console.log('Received element update:', data);
        if (data.element && onElementUpdate) {
          onElementUpdate(data.element);
        }
      });

      wsService.addEventListener('element_create', (data: any) => {
        console.log('Received element create:', data);
        if (data.element && onElementCreate) {
          onElementCreate(data.element);
        }
      });

      wsService.addEventListener('element_delete', (data: any) => {
        console.log('Received element delete:', data);
        if (data.element_id && onElementDelete) {
          onElementDelete(data.element_id);
        }
      });

      wsService.addEventListener('cursor_move', (data: any) => {
        if (data.user_id && data.user_id !== user.id) {
          setActiveUsers(prev => prev.map(user => 
            user.id === data.user_id 
              ? { ...user, cursor_position: data.cursor }
              : user
          ));
        }
      });

      wsService.addEventListener('element_lock', (data: any) => {
        console.log('Element locked:', data);
        if (data.element_id && data.user) {
          setElementLocks(prev => {
            // Remove any existing lock for this element, then add new one
            const filtered = prev.filter(lock => lock.element_id !== data.element_id);
            return [...filtered, {
              element_id: data.element_id,
              user: data.user,
              locked_at: data.locked_at || new Date().toISOString(),
            }];
          });
          
          // Show toast if locked by someone else
          if (data.user.id !== user.id) {
            toast.info(`Elemento bloqueado por ${data.user.first_name || data.user.email}`);
          }
        }
      });

      wsService.addEventListener('element_unlock', (data: any) => {
        console.log('Element unlocked:', data);
        if (data.element_id) {
          setElementLocks(prev => prev.filter(lock => lock.element_id !== data.element_id));
        }
      });

      wsService.addEventListener('user_joined', (data: any) => {
        console.log('User joined:', data);
        if (data.user && data.user.id !== user.id) {
          setActiveUsers(prev => {
            const filtered = prev.filter(u => u.id !== data.user.id);
            return [...filtered, data.user];
          });
          toast.success(`${data.user.first_name || data.user.email} se unió al diagrama`);
        }
      });

      wsService.addEventListener('user_left', (data: any) => {
        console.log('User left:', data);
        if (data.user_id && data.user_id !== user.id) {
          setActiveUsers(prev => prev.filter(u => u.id !== data.user_id));
          // Remove locks from user who left
          setElementLocks(prev => prev.filter(lock => lock.user.id !== data.user_id));
        }
      });

      wsService.addEventListener('active_users_update', (data: any) => {
        console.log('Active users update:', data);
        if (Array.isArray(data)) {
          setActiveUsers(data.filter((u: ActiveUser) => u.id !== user.id));
        }
      });

      wsService.addEventListener('error', (error: any) => {
        console.error('WebSocket error:', error);
        setConnectionError(error);
        toast.error(`Error de conexión: ${error}`);
      });

      wsService.addEventListener('connection_lost', () => {
        setIsConnected(false);
        setConnectionError('Conexión perdida');
        toast.error('Conexión perdida. Intentando reconectar...');
      });

      // Connect to diagram
      await wsService.connectToDiagram(diagramId);
      setIsConnected(true);
      
      console.log(`Connected to diagram ${diagramId} WebSocket`);

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setConnectionError(error instanceof Error ? error.message : 'Error de conexión');
      setIsConnected(false);
      toast.error('No se pudo conectar a la colaboración en tiempo real');
    }
  }, [diagramId, token, user, onElementUpdate, onElementCreate, onElementDelete]);

  // Initialize connection when dependencies change
  useEffect(() => {
    initializeConnection();

    // Cleanup on unmount
    return () => {
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
        wsServiceRef.current = null;
      }
      setIsConnected(false);
      setActiveUsers([]);
      setElementLocks([]);
    };
  }, [initializeConnection]);

  // Send element update
  const sendElementUpdate = useCallback((element: DiagramElement) => {
    if (wsServiceRef.current && isConnected) {
      wsServiceRef.current.sendElementUpdate(element);
    }
  }, [isConnected]);

  // Send element create
  const sendElementCreate = useCallback((element: DiagramElement) => {
    if (wsServiceRef.current && isConnected) {
      wsServiceRef.current.sendElementCreate(element);
    }
  }, [isConnected]);

  // Send element delete
  const sendElementDelete = useCallback((elementId: string) => {
    if (wsServiceRef.current && isConnected) {
      wsServiceRef.current.sendElementDelete(elementId);
    }
  }, [isConnected]);

  // Send cursor move (throttled)
  const sendCursorMove = useCallback((position: { x: number; y: number }) => {
    const now = Date.now();
    if (wsServiceRef.current && isConnected && (now - lastCursorSent.current) > CURSOR_THROTTLE_MS) {
      wsServiceRef.current.sendCursorMove(position);
      lastCursorSent.current = now;
    }
  }, [isConnected]);

  // Request element lock
  const requestElementLock = useCallback((elementId: string) => {
    if (wsServiceRef.current && isConnected) {
      wsServiceRef.current.sendElementLock(elementId);
    }
  }, [isConnected]);

  // Release element lock
  const releaseElementLock = useCallback((elementId: string) => {
    if (wsServiceRef.current && isConnected) {
      wsServiceRef.current.sendElementUnlock(elementId);
    }
  }, [isConnected]);

  // Check if element is locked
  const isElementLocked = useCallback((elementId: string) => {
    return elementLocks.some(lock => lock.element_id === elementId);
  }, [elementLocks]);

  // Check if element is locked by current user
  const isElementLockedByMe = useCallback((elementId: string) => {
    if (!user) return false;
    return elementLocks.some(lock => 
      lock.element_id === elementId && lock.user.id === user.id
    );
  }, [elementLocks, user]);

  // Reconnect function
  const reconnect = useCallback(() => {
    setConnectionError(null);
    initializeConnection();
  }, [initializeConnection]);

  return {
    activeUsers,
    elementLocks,
    isConnected,
    connectionError,
    sendElementUpdate,
    sendElementCreate,
    sendElementDelete,
    sendCursorMove,
    requestElementLock,
    releaseElementLock,
    isElementLocked,
    isElementLockedByMe,
    reconnect,
  };
};
