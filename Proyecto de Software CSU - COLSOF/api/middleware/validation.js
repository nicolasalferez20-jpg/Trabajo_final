/**
 * @file middleware/validation.js
 * @description Middleware de validación de datos con Joi
 */

import Joi from 'joi';
import { ApiError } from './errorHandler.js';
import { HTTP_STATUS } from '../config/constants.js';

/**
 * Crear middleware de validación
 * @param {object} schema - Esquema Joi para validar
 * @param {string} source - 'body', 'query', 'params'
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      error.isJoi = true;
      return next(error);
    }

    req[source] = value;
    next();
  };
};

/**
 * Esquemas de validación comunes
 */
export const schemas = {
  // Validación de ID
  idSchema: Joi.object({
    id: Joi.number().integer().positive().required()
  }),

  // Validación de paginación
  paginationSchema: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(1000).default(50),
    search: Joi.string().max(255).optional()
  }),

  // Validación de caso (crear)
  createCaseSchema: Joi.object({
    titulo: Joi.string().min(5).max(255).required(),
    descripcion: Joi.string().min(10).max(5000).required(),
    cliente: Joi.string().max(255).required(),
    categoria: Joi.string().max(100).required(),
    prioridad: Joi.string().valid('critica', 'alta', 'media', 'baja').default('media'),
    estado: Joi.string().valid('abierto', 'en_progreso', 'pausado', 'resuelto', 'cerrado').default('abierto'),
    asignado_a: Joi.string().max(255).optional(),
    centro_costos: Joi.string().max(255).optional(),
    presupuesto: Joi.number().min(0).optional(),
    costo_ejecutado: Joi.number().min(0).optional()
  }).required(),

  // Validación de caso (actualizar)
  updateCaseSchema: Joi.object({
    titulo: Joi.string().min(5).max(255).optional(),
    descripcion: Joi.string().min(10).max(5000).optional(),
    cliente: Joi.string().max(255).optional(),
    categoria: Joi.string().max(100).optional(),
    prioridad: Joi.string().valid('critica', 'alta', 'media', 'baja').optional(),
    estado: Joi.string().valid('abierto', 'en_progreso', 'pausado', 'resuelto', 'cerrado').optional(),
    asignado_a: Joi.string().max(255).optional(),
    presupuesto: Joi.number().min(0).optional(),
    costo_ejecutado: Joi.number().min(0).optional()
  }).min(1),

  // Validación de cliente (crear)
  createClientSchema: Joi.object({
    nombre: Joi.string().min(3).max(255).required(),
    industria: Joi.string().max(100).optional(),
    contacto: Joi.string().max(255).optional(),
    email: Joi.string().email().optional(),
    telefono: Joi.string().max(20).optional()
  }).required(),

  // Validación de filtros
  filterSchema: Joi.object({
    estado: Joi.string().max(50).optional(),
    prioridad: Joi.string().max(50).optional(),
    cliente: Joi.string().max(255).optional(),
    asignado_a: Joi.string().max(255).optional(),
    desde: Joi.date().iso().optional(),
    hasta: Joi.date().iso().optional()
  })
};
