/**
 * @file config/constants.js
 * @description Constantes centralizadas del sistema
 */

export const ESTADO_MAP = {
  // Frontend -> BD
  'Activo': 'abierto',
  'En Progreso': 'en_progreso',
  'En progreso': 'en_progreso',
  'Pausado': 'pausado',
  'Resuelto': 'resuelto',
  'Cerrado': 'cerrado',
  'Cancelado': 'cancelado',
  'Completado': 'resuelto',
  // BD -> Frontend (directo)
  'abierto': 'abierto',
  'en_progreso': 'en_progreso',
  'pausado': 'pausado',
  'resuelto': 'resuelto',
  'cerrado': 'cerrado',
  'cancelado': 'cancelado'
};

export const PRIORIDAD_MAP = {
  // Frontend -> BD
  'Crítica': 'critica',
  'Critica': 'critica',
  'Urgente': 'critica',
  'Alta': 'alta',
  'Media': 'media',
  'Baja': 'baja',
  // BD -> Frontend (directo)
  'critica': 'critica',
  'alta': 'alta',
  'media': 'media',
  'baja': 'baja'
};

export const ESTADO_LABELS = {
  'abierto': 'Abierto',
  'en_progreso': 'En Progreso',
  'pausado': 'Pausado',
  'resuelto': 'Resuelto',
  'cerrado': 'Cerrado',
  'cancelado': 'Cancelado'
};

export const PRIORIDAD_LABELS = {
  'critica': 'Crítica',
  'alta': 'Alta',
  'media': 'Media',
  'baja': 'Baja'
};

export const PRIORIDAD_COLORS = {
  'critica': '#b91c1c',  // Red
  'alta': '#f97316',     // Orange
  'media': '#facc15',    // Yellow
  'baja': '#16a34a'      // Green
};

export const ESTADO_COLORS = {
  'abierto': '#16a34a',      // Green
  'en_progreso': '#f59e0b',  // Amber
  'pausado': '#6b7280',      // Gray
  'resuelto': '#2563eb',     // Blue
  'cerrado': '#0f172a',      // Slate
  'cancelado': '#a855f7'     // Purple
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

export const ERROR_MESSAGES = {
  INVALID_INPUT: 'Datos de entrada inválidos',
  NOT_FOUND: 'Recurso no encontrado',
  UNAUTHORIZED: 'No autorizado',
  DATABASE_ERROR: 'Error en la base de datos',
  VALIDATION_ERROR: 'Error de validación',
  INTERNAL_ERROR: 'Error interno del servidor',
  RESOURCE_EXISTS: 'El recurso ya existe'
};

// Usuario actual del sistema (hardcoded por ahora, puede venir de JWT)
export const CURRENT_USER = {
  id: 1,
  nombre: 'Juan Pérez',
  email: 'JPerez@colsof.com.co',
  rol: 'GESTOR'
};

// Límites del sistema
export const LIMITS = {
  MAX_PAGE_SIZE: 1000,
  DEFAULT_PAGE_SIZE: 50,
  MAX_REQUEST_SIZE: '10mb',
  REQUEST_TIMEOUT: 30000, // 30 segundos
  MAX_RETRIES: 3
};
