// User types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  date_joined?: string;
  is_active?: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
}

// Project types
export interface Project {
  id: string;
  name: string;
  description: string;
  owner: User;
  created_at: string;
  updated_at: string;
  collaborators_count: number;
  diagrams_count: number;
  visibility: 'public' | 'private';
  // is_favorite: boolean;
}

export interface ProjectCreate {
  name: string;
  description: string;
  visibility: 'public' | 'private';
}

export interface Collaborator {
  id: string;
  user: User;
  role: 'admin' | 'editor' | 'viewer';
  permissions: string[];
  joined_at: string;
}

// Diagram types
export interface Diagram {
  id: string;
  name: string;
  description: string;
  project: string;
  diagram_type: 'class' | 'sequence' | 'usecase' | 'activity' | 'usecase'
  canvas_data: any;
  created_at: string;
  updated_at: string;
  created_by: User;
}

export interface DiagramElement {
  id: string;
  type: 'class' | 'interface' | 'enum' | 'relationship' | 'abstract_class' | 'package';
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: any;
  style: any;
}

export interface UMLClass {
  id: string;
  name: string;
  attributes: ClassAttribute[];
  methods: ClassMethod[];
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface ClassAttribute {
  id: string;
  name: string;
  type: string;
  visibility: 'public' | 'private' | 'protected' | 'package';
  is_static: boolean;
}

export interface ClassMethod {
  id: string;
  name: string;
  return_type: string;
  parameters: MethodParameter[];
  visibility: 'public' | 'private' | 'protected' | 'package';
  is_static: boolean;
  is_abstract: boolean;
}

export interface MethodParameter {
  name: string;
  type: string;
}

export interface Relationship {
  id: string;
  source_id: string;
  target_id: string;
  type: 'association' | 'inheritance' | 'aggregation' | 'composition' | 'dependency';
  name?: string;
  multiplicity_source?: string;
  multiplicity_target?: string;
}

// Relationship types
export interface DiagramRelationship {
  id: string;
  diagram: string;
  source_element: string;
  target_element: string;
  relationship_type: 'inheritance' | 'realization' | 'composition' | 'aggregation' | 'association' | 'dependency' | 'one_to_one' | 'one_to_many' | 'many_to_many' | 'foreign_key';
  name?: string;
  source_multiplicity?: string;
  target_multiplicity?: string;
  source_role?: string;
  target_role?: string;
  is_navigable: boolean;
  line_style: 'solid' | 'dashed' | 'dotted';
  color: string;
  waypoints: any[];
  properties: Record<string, any>;
  created_at: string;
}

// Collaboration types
export interface ActiveUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  last_seen: string;
  cursor_position?: { x: number; y: number };
  color?: string;
}

export interface ElementLock {
  element_id: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  locked_at: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: any;
  sender?: {
    id: string;
    email: string;
    name: string;
  };
  project_id?: string;
  diagram_id?: string;
  is_read: boolean;
  created_at: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface DiagramUpdateMessage extends WebSocketMessage {
  type: 'element_update' | 'element_create' | 'element_delete' | 'cursor_move' | 'element_lock' | 'element_unlock';
  element?: DiagramElement;
  element_id?: string;
  cursor?: { x: number; y: number };
  user: string;
  timestamp: string;
}

// API Response types
export interface ApiResponse<T> {
  results?: T[];
  count?: number;
  next?: string;
  previous?: string;
  data?: T;
}

export interface ApiError {
  detail?: string;
  message?: string;
  errors?: { [key: string]: string[] };
}

// Form types
export interface ValidationErrors {
  [key: string]: string;
}

// Theme types
export interface AppTheme {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
}

// Canvas types
export interface CanvasPosition {
  x: number;
  y: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

// Code Generation types
export interface CodeGenerationJob {
  id: string;
  diagram: string;
  template: string;
  template_name: string;
  diagram_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  output_format: 'zip' | 'tar' | 'folder';
  configuration: any;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  output_file?: string;
  output_size?: number;
  generated_files?: GeneratedFile[];
  database_schemas?: DatabaseSchema[];
}

export interface GeneratedFile {
  file_path: string;
  file_name: string;
  file_type: 'entity' | 'repository' | 'service' | 'controller' | 'config' | 'test' | 'migration' | 'schema' | 'documentation' | 'other';
  content: string;
  size: number;
  based_on_element?: string;
}

export interface DatabaseSchema {
  database_type: 'postgresql' | 'mysql' | 'sqlite' | 'oracle' | 'sqlserver' | 'mongodb';
  schema_name?: string;
  ddl_script: string;
  migration_scripts: string[];
  indexes: string[];
  constraints: string[];
}

export interface SpringBootConfig {
  diagram_id: string;
  template_type: 'spring_boot';
  language: 'java';
  output_format?: 'zip' | 'tar' | 'folder';
  package_name?: string;
  project_name?: string;
  spring_boot_version?: string;
  java_version?: string;
  include_tests?: boolean;
  include_swagger?: boolean;
  include_security?: boolean;
  configuration?: any;
}

export interface DatabaseScriptConfig {
  diagram_id: string;
  database_types: ('postgresql' | 'mysql' | 'sqlserver' | 'sqlite')[];
  include_constraints?: boolean;
  include_indexes?: boolean;
  include_sample_data?: boolean;
  schema_name?: string;
}

export interface CodeGenerationTemplate {
  id: string;
  name: string;
  description?: string;
  template_type: 'spring_boot' | 'django' | 'nodejs' | 'dotnet' | 'laravel' | 'database';
  language: 'java' | 'python' | 'javascript' | 'typescript' | 'csharp' | 'php' | 'sql';
  version: string;
  template_content: any;
  is_default: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Element Attribute types
export interface ElementAttribute {
  id: string;
  element: string;
  name: string;
  data_type: string;
  visibility: '+' | '-' | '#' | '~';
  is_static: boolean;
  is_final: boolean;
  is_abstract: boolean;
  default_value?: string;
  constraints: Record<string, any>;
  order: number;
  documentation?: string;
}

// Element Method types
export interface ElementMethod {
  id: string;
  element: string;
  name: string;
  return_type: string;
  visibility: '+' | '-' | '#' | '~';
  is_static: boolean;
  is_final: boolean;
  is_abstract: boolean;
  is_constructor: boolean;
  parameters: { name: string; type: string; default?: string }[];
  order: number;
  documentation?: string;
}
