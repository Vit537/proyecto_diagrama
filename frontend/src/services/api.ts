import axios, { AxiosResponse, AxiosError } from 'axios';
import {
  User,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  Project,
  ProjectCreate,
  Diagram,
  Collaborator,
  ApiResponse,
  ApiError,
  ActiveUser,
  ElementLock,
  Notification,
  CodeGenerationJob,
  SpringBootConfig,
  DatabaseScriptConfig,
  DiagramRelationship,
  ElementAttribute,
  ElementMethod,
} from '../types';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
export const tokenManager = {
  getAccessToken: (): string | null => {
    return localStorage.getItem('access_token');
  },
  
  getRefreshToken: (): string | null => {
    return localStorage.getItem('refresh_token');
  },
  
  setTokens: (tokens: AuthTokens): void => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  },
  
  clearTokens: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
  
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401 && tokenManager.getRefreshToken()) {
      try {
        const refreshToken = tokenManager.getRefreshToken();
        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });
        
        const newTokens = response.data;
        tokenManager.setTokens(newTokens);
        
        // Retry original request with new token
        if (error.config) {
          error.config.headers.Authorization = `Bearer ${newTokens.access}`;
          return api.request(error.config);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        tokenManager.clearTokens();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
const handleApiError = (error: AxiosError): ApiError => {
  if (error.response?.data) {
    return error.response.data as ApiError;
  }
  return {
    message: error.message || 'An unexpected error occurred',
  };
};

// Authentication API
export const authAPI = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> => {
    try {
      // const response: AxiosResponse<{ user: User; access: string; refresh: string }> = 
      const response: AxiosResponse<{ user: User; tokens: { access: string; refresh: string } }> = 
        await api.post('/auth/login/', credentials);

        console.log("login response", response.data); 
        console.log("token access", response.data.tokens.access);  
        console.log("token refresh", response.data.tokens.refresh);  
        // console.log("token refresh", response.data);  
        // console.log("token access", response.data.access);  
      
      const tokens = {
        access: response.data.tokens.access, 
        refresh: response.data.tokens.refresh,
      };
      
      tokenManager.setTokens(tokens);
      
      return {
        user: response.data.user,
        tokens,
      };
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },
  
  // Register new user
  register: async (data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> => {
    try {
      const response: AxiosResponse<{ user: User; access: string; refresh: string }> = 
        await api.post('/auth/register/', data);
      
      const tokens = {
        access: response.data.access,
        refresh: response.data.refresh,
      };
      
      tokenManager.setTokens(tokens);
      
      return {
        user: response.data.user,
        tokens,
      };
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },
  
  // Get current user profile
  getCurrentUser: async (): Promise<User> => {
    try {
      // const response: AxiosResponse<User> = await api.get('/auth/user/');
      const response: AxiosResponse<User> = await api.get('/auth/profile/');
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },
  
  // Logout user
  logout: async (): Promise<void> => {
    try {
      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        await api.post('/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout error:', error);
    } finally {
      tokenManager.clearTokens();
    }
  },
  
  // Refresh token
  refreshToken: async (): Promise<AuthTokens> => {
    try {
      const refreshToken = tokenManager.getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token available');
      
      const response: AxiosResponse<AuthTokens> = await api.post('/auth/token/refresh/', {
        refresh: refreshToken,
      });
      
      tokenManager.setTokens(response.data);
      return response.data;
    } catch (error) {
      tokenManager.clearTokens();
      throw handleApiError(error as AxiosError);
    }
  },
};

// Projects API
export const projectsAPI = {
  // Get all projects
  getProjects: async (page = 1): Promise<ApiResponse<Project>> => {
    try {
      const response: AxiosResponse<ApiResponse<Project>> = await api.get(`/projects/?page=${page}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },
  
  // Get single project
  getProject: async (id: string): Promise<Project> => {
    try {
      const response: AxiosResponse<Project> = await api.get(`/projects/${id}/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },
  
  // Create new project
  createProject: async (data: ProjectCreate): Promise<Project> => {
    try {
      const response: AxiosResponse<Project> = await api.post('/projects/', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },
  
  // Update project
  updateProject: async (id: string, data: Partial<ProjectCreate>): Promise<Project> => {
    try {
      const response: AxiosResponse<Project> = await api.patch(`/projects/${id}/`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },
  
  // Delete project
  deleteProject: async (id: string): Promise<void> => {
    try {
      await api.delete(`/projects/${id}/`);
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },
  
  // Get project collaborators
  getProjectCollaborators: async (id: string): Promise<Collaborator[]> => {
    try {
      const response: AxiosResponse<{ results: Collaborator[] }> = 
        await api.get(`/projects/${id}/collaborators/`);
      return response.data.results || [];
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },
  
  // Add collaborator
  addCollaborator: async (projectId: string, email: string, role: string): Promise<Collaborator> => {
    try {
      const response: AxiosResponse<Collaborator> = await api.post(
        `/projects/${projectId}/add-collaborator/`,
        { email, role }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },
  
  // Remove collaborator
  removeCollaborator: async (projectId: string, collaboratorId: string): Promise<void> => {
    try {
      await api.post(`/projects/${projectId}/remove-collaborator/`, {
        collaborator_id: collaboratorId,
      });
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },
};

// Diagrams API
export const diagramsAPI = {
  // List diagrams
  list: async () => {
    const response = await api.get('/diagrams/');
    return response.data;
  },
  // Create diagram
  create: async (data: Partial<Diagram>) => {
    const response = await api.post('/diagrams/', data);
    return response.data;
  },
  // Get specific diagram
  get: async (id: string) => {
    const response = await api.get(`/diagrams/${id}/`);
    return response.data;
  },
  // Update diagram
  update: async (id: string, data: Partial<Diagram>) => {
    const response = await api.put(`/diagrams/${id}/`, data);
    return response.data;
  },
  // Delete diagram
  delete: async (id: string) => {
    return api.delete(`/diagrams/${id}/`);
  },
  // Duplicate diagram
  duplicate: async (id: string) => {
    const response = await api.post(`/diagrams/${id}/duplicate/`);
    return response.data;
  },
};

// Diagram Elements API
export const diagramElementsAPI = {
  // List elements
  list: async (diagramId?: string) => {
    const url = diagramId ? `/diagram-elements/?diagram=${diagramId}` : '/api/diagram-elements/';
    const response = await api.get(url);
    return response.data;
  },
  // Create element
  create: async (data: any) => {
    console.log("create element data", data);
    const response = await api.post('/diagram-elements/', data);
    return response.data;
  },
  // Update position
  updatePosition: async (id: string, position: { x: number; y: number }) => {
    const response = await api.patch(`/diagram-elements/${id}/update_position/`, position);
    return response.data;
  },  
};

// Attributes and Methods API
export const elementAttributesAPI = {
  list: async () => {
    const response = await api.get('/api/element-attributes/');
    return response.data;
  },
};
export const elementMethodsAPI = {
  list: async () => {
    const response = await api.get('/api/element-methods/');
    return response.data;
  },
};

// Relationships API
export const diagramRelationshipsAPI = {
  list: async () => {
    const response = await api.get('/api/diagram-relationships/');
    return response.data;
  },
  listByDiagram: async (diagramId: string) => {
    const response = await api.get(`/api/diagram-relationships/by_diagram/?diagram_id=${diagramId}`);
    return response.data;
  },
};

// Collaboration API
export const collaborationAPI = {
  // Get active users for diagram
  getActiveUsers: async (diagramId: string): Promise<{ active_users: ActiveUser[]; count: number }> => {
    try {
      const response: AxiosResponse<{ active_users: ActiveUser[]; count: number }> = 
        await api.get(`/collaboration/${diagramId}/active-users/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },
  
  // Get element locks for diagram
  getElementLocks: async (diagramId: string): Promise<{ locks: ElementLock[]; count: number }> => {
    try {
      const response: AxiosResponse<{ locks: ElementLock[]; count: number }> = 
        await api.get(`/collaboration/${diagramId}/locks/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },
  
  // Force unlock element
  forceUnlockElement: async (diagramId: string, elementId: string): Promise<void> => {
    try {
      await api.post(`/collaboration/${diagramId}/force-unlock/`, { element_id: elementId });
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },
  
  // Cleanup expired locks and inactive users
  cleanup: async (diagramId: string): Promise<{ expired_locks_removed: number; inactive_users_removed: number }> => {
    try {
      const response: AxiosResponse<{ expired_locks_removed: number; inactive_users_removed: number }> = 
        await api.post(`/collaboration/${diagramId}/cleanup/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },
  
  // Get user session info
  getSessionInfo: async (): Promise<{
    active_sessions: any[];
    active_locks: any[];
    session_count: number;
    lock_count: number;
  }> => {
    try {
      const response = await api.get('/collaboration/session-info/');
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },
};

// Code Generation API
export const codeGenerationAPI = {
  // Generate Spring Boot project
  generateSpringBoot: async (config: SpringBootConfig): Promise<{
    message: string;
    job: CodeGenerationJob;
    files_count: number;
    total_size: number;
  }> => {
    try {
      const response = await api.post('/code-generation/generate/spring-boot/', config);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },

  // Generate database scripts
  generateDatabaseScripts: async (config: DatabaseScriptConfig): Promise<{
    message: string;
    job_id: string;
    scripts: Record<string, string>;
    database_types: string[];
    total_size: number;
  }> => {
    try {
      const response = await api.post('/code-generation/generate/database-scripts/', config);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },

  // Get user's code generation jobs
  getGenerationJobs: async (page = 1): Promise<ApiResponse<CodeGenerationJob>> => {
    try {
      const response: AxiosResponse<ApiResponse<CodeGenerationJob>> = 
        await api.get(`/code-generation/jobs/?page=${page}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },

  // Get specific generation job
  getGenerationJob: async (jobId: string): Promise<CodeGenerationJob> => {
    try {
      const response: AxiosResponse<CodeGenerationJob> = 
        await api.get(`/code-generation/jobs/${jobId}/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },

  // Download generated files
  downloadGeneratedFiles: async (jobId: string): Promise<Blob> => {
    try {
      const response = await api.get(`/code-generation/jobs/${jobId}/download/`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },

  // Get generation history
  getGenerationHistory: async (diagramId?: string): Promise<any[]> => {
    try {
      const params = diagramId ? { diagram_id: diagramId } : {};
      const response = await api.get('/code-generation/history/', { params });
      return response.data.results || [];
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },
};

// Relationships API
export const relationshipsAPI = {
  // Get relationships for a diagram
  getRelationships: async (diagramId: string): Promise<DiagramRelationship[]> => {
    try {
      const response: AxiosResponse<DiagramRelationship[]> = await api.get(`/diagrams/${diagramId}/relationships/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },

  // Create a relationship
  createRelationship: async (data: Partial<DiagramRelationship>): Promise<DiagramRelationship> => {
    try {
      const response: AxiosResponse<DiagramRelationship> = await api.post('/diagram-relationships/', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },

  // Delete a relationship
  deleteRelationship: async (id: string): Promise<void> => {
    try {
      await api.delete(`/diagram-relationships/${id}/`);
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },
};

// Element Attributes API
export const attributesAPI = {
  // Add an attribute to an element
  addAttribute: async (data: Partial<ElementAttribute>): Promise<ElementAttribute> => {
    try {
      const response: AxiosResponse<ElementAttribute> = await api.post('/element-attributes/', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },

  // Delete an attribute
  deleteAttribute: async (id: string): Promise<void> => {
    try {
      await api.delete(`/element-attributes/${id}/`);
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },
};

// Element Methods API
export const methodsAPI = {
  // Add a method to an element
  addMethod: async (data: Partial<ElementMethod>): Promise<ElementMethod> => {
    try {
      const response: AxiosResponse<ElementMethod> = await api.post('/element-methods/', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },

  // Delete a method
  deleteMethod: async (id: string): Promise<void> => {
    try {
      await api.delete(`/element-methods/${id}/`);
    } catch (error) {
      throw handleApiError(error as AxiosError);
    }
  },
};

export default api;
