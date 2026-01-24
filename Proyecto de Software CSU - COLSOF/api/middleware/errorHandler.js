/**
 * @file middleware/errorHandler.js
 * @description Manejo centralizado de errores
 */

import logger from '../config/logger.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';

/**
 * Middleware de manejo de errores
 * Debe ser el último middleware
 */
export const errorHandler = (err, req, res, next) => {
  logger.error('Request error', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack
  });

  // Error de validación (Joi)
  if (err.isJoi) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: ERROR_MESSAGES.VALIDATION_ERROR,
      details: err.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))
    });
  }

  // Error de base de datos
  if (err.message?.includes('postgres') || err.code?.startsWith('POSTGRES')) {
    logger.error('Database error', { error: err.message });
    return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.DATABASE_ERROR,
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }

  // Error de validación custom
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  // Error genérico
  res.status(HTTP_STATUS.INTERNAL_ERROR).json({
    success: false,
    error: ERROR_MESSAGES.INTERNAL_ERROR,
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
};

/**
 * Wrapper para funciones async en rutas
 * Captura errores automáticamente
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Error personalizado
 */
export class ApiError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_ERROR) {
    super(message);
    this.statusCode = statusCode;
  }
}
