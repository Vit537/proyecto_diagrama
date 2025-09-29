import { tokenManager } from './api';
import {
  DiagramUpdateMessage,
  WebSocketMessage,
  ActiveUser,
  Notification,
  DiagramElement,
} from '../types';

// WebSocket connection configuration
const WEBSOCKET_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

// Legacy websocket service for backwards compatibility
class LegacyWebSocketService {
  private websocket: WebSocket | null = null;
  private messageHandlers: Map<string, Function[]> = new Map();
  private connected: boolean = false;

  connect(endpoint: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = WEBSOCKET_BASE_URL.replace(/^https?:/, '').replace(/^wss?:/, '');
        const socketUrl = `${wsProtocol}${wsHost}/ws/${endpoint}?token=${token}`;
        
        console.log('Legacy WebSocket connecting to:', socketUrl);
        
        this.websocket = new WebSocket(socketUrl);
        
        this.websocket.onopen = () => {
          console.log('Legacy WebSocket connected');
          this.connected = true;
          resolve();
        };
        
        this.websocket.onclose = () => {
          console.log('Legacy WebSocket disconnected');
          this.connected = false;
        };
        
        this.websocket.onerror = (error) => {
          console.error('Legacy WebSocket error:', error);
          reject(error);
        };
        
        this.websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing legacy WebSocket message:', error);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
      this.connected = false;
    }
  }

  send(message: any) {
    if (this.websocket && this.connected && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    }
  }

  onMessage(type: string, handler: Function) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  private handleMessage(data: any) {
    const handlers = this.messageHandlers.get(data.type);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  isConnected() {
    return this.connected;
  }
}

export const websocketService = new LegacyWebSocketService();

export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 3000; // 3 seconds
  private isConnected: boolean = false;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  // Connect to WebSocket
  connect(endpoint: string, token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const authToken = token || tokenManager.getAccessToken();
        if (!authToken) {
          reject(new Error('No authentication token available'));
          return;
        }

        // Build WebSocket URL for Django Channels
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = WEBSOCKET_BASE_URL.replace(/^https?:/, '').replace(/^ws?s?:/, '');
        const socketUrl = `${wsProtocol}${wsHost}${endpoint}?token=${authToken}`;
        
        console.log('Connecting to WebSocket:', socketUrl);
        
        // Create new WebSocket connection
        this.socket = new WebSocket(socketUrl);
        
        this.socket.onopen = () => {
          console.log(`Connected to WebSocket: ${endpoint}`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.socket.onclose = (event) => {
          console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
          this.isConnected = false;
          this.handleReconnection(endpoint);
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (!this.isConnected) {
            reject(error);
          }
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      console.log('WebSocket disconnected');
    }
  }

  // Send message through WebSocket
  send(message: WebSocketMessage): void {
    if (this.socket && this.isConnected && this.socket.readyState === WebSocket.OPEN) {
      console.log('Sending WebSocket message:', message);
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected. Message not sent:', message);
    }
  }

  // Add event listener (alias for compatibility)
  on(eventType: string, callback: Function): void {
    this.addEventListener(eventType, callback);
  }

  // Add event listener
  addEventListener(eventType: string, callback: Function): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  // Alias for on method for compatibility
  onMessage(eventType: string, callback: Function): void {
    this.addEventListener(eventType, callback);
  }

  // Remove event listener
  off(eventType: string, callback?: Function): void {
    if (!this.listeners.has(eventType)) return;

    if (callback) {
      const callbacks = this.listeners.get(eventType)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.listeners.delete(eventType);
    }
  }

  // Emit event to listeners
  private emit(eventType: string, data: any): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event callback for ${eventType}:`, error);
        }
      });
    }
  }

  // Handle incoming messages
  private handleMessage(data: WebSocketMessage): void {
    switch (data.type) {
      case 'element_update':
      case 'element_create':
      case 'element_delete':
      case 'cursor_move':
      case 'element_lock':
      case 'element_unlock':
        this.emit('diagram_update', data as DiagramUpdateMessage);
        break;
      
      case 'active_users':
        this.emit('active_users_update', data.users);
        break;
      
      case 'notification':
        this.emit('notification', data.notification);
        break;
      
      case 'project_update':
      case 'diagram_created':
      case 'diagram_deleted':
        this.emit('project_update', data);
        break;
      
      case 'error':
        this.emit('error', data.message);
        console.error('WebSocket error message:', data.message);
        break;
      
      default:
        console.log('Unknown WebSocket message type:', data.type, data);
    }
  }

  // Handle reconnection logic
  private handleReconnection(endpoint: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(endpoint).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached. Please refresh the page.');
      this.emit('connection_lost', null);
    }
  }

  // Setup global event listeners
  private setupEventListeners(): void {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !this.isConnected) {
        // Try to reconnect when page becomes visible
        console.log('Page became visible, attempting to reconnect...');
      }
    });
  }

  // Get connection status
  isWebSocketConnected(): boolean {
    return this.isConnected;
  }
}

// Diagram WebSocket Service
export class DiagramWebSocketService extends WebSocketService {
  private diagramId: string | null = null;

  // Connect to diagram WebSocket
  async connectToDiagram(diagramId: string): Promise<void> {
    this.diagramId = diagramId;
    await this.connect(`/ws/diagram/${diagramId}/`);
  }

  // Send diagram update
  sendElementUpdate(element: DiagramElement): void {
    this.send({
      type: 'element_update',
      element: element,
    });
  }

  // Send element creation
  sendElementCreate(element: DiagramElement): void {
    this.send({
      type: 'element_create',
      element: element,
    });
  }

  // Send element deletion
  sendElementDelete(elementId: string): void {
    this.send({
      type: 'element_delete',
      element_id: elementId,
    });
  }

  // Send cursor movement
  sendCursorMove(position: { x: number; y: number }): void {
    this.send({
      type: 'cursor_move',
      cursor: position,
    });
  }

  // Send element lock request
  sendElementLock(elementId: string): void {
    this.send({
      type: 'element_lock',
      element_id: elementId,
    });
  }

  // Send element unlock request
  sendElementUnlock(elementId: string): void {
    this.send({
      type: 'element_unlock',
      element_id: elementId,
    });
  }
}

// Project WebSocket Service
export class ProjectWebSocketService extends WebSocketService {
  private projectId: string | null = null;

  // Connect to project WebSocket
  async connectToProject(projectId: string): Promise<void> {
    this.projectId = projectId;
    await this.connect(`/ws/project/${projectId}/`);
  }

  // Send project update
  sendProjectUpdate(projectData: any): void {
    this.send({
      type: 'project_update',
      project: projectData,
    });
  }

  // Send diagram created notification
  sendDiagramCreated(diagramData: any): void {
    this.send({
      type: 'diagram_created',
      diagram: diagramData,
    });
  }

  // Send diagram deleted notification
  sendDiagramDeleted(diagramId: string): void {
    this.send({
      type: 'diagram_deleted',
      diagram_id: diagramId,
    });
  }
}

// Notifications WebSocket Service
export class NotificationWebSocketService extends WebSocketService {
  private userId: string | null = null;

  // Connect to notifications WebSocket
  async connectToNotifications(userId: string): Promise<void> {
    this.userId = userId;
    await this.connect(`/ws/notifications/${userId}/`);
  }

  // Mark notification as read
  markNotificationAsRead(notificationId: string): void {
    this.send({
      type: 'mark_read',
      notification_id: notificationId,
    });
  }
}

// WebSocket Manager - Singleton to manage all WebSocket connections
export class WebSocketManager {
  private static instance: WebSocketManager;
  private diagramService: DiagramWebSocketService | null = null;
  private projectService: ProjectWebSocketService | null = null;
  private notificationService: NotificationWebSocketService | null = null;

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  // Get or create diagram service
  getDiagramService(): DiagramWebSocketService {
    if (!this.diagramService) {
      this.diagramService = new DiagramWebSocketService();
    }
    return this.diagramService;
  }

  // Get or create project service
  getProjectService(): ProjectWebSocketService {
    if (!this.projectService) {
      this.projectService = new ProjectWebSocketService();
    }
    return this.projectService;
  }

  // Get or create notification service
  getNotificationService(): NotificationWebSocketService {
    if (!this.notificationService) {
      this.notificationService = new NotificationWebSocketService();
    }
    return this.notificationService;
  }

  // Disconnect all services
  disconnectAll(): void {
    if (this.diagramService) {
      this.diagramService.disconnect();
      this.diagramService = null;
    }
    if (this.projectService) {
      this.projectService.disconnect();
      this.projectService = null;
    }
    if (this.notificationService) {
      this.notificationService.disconnect();
      this.notificationService = null;
    }
  }

  // Check if any service is connected
  isAnyConnected(): boolean {
    return (
      (this.diagramService?.isWebSocketConnected() ?? false) ||
      (this.projectService?.isWebSocketConnected() ?? false) ||
      (this.notificationService?.isWebSocketConnected() ?? false)
    );
  }
}

export default WebSocketManager;
