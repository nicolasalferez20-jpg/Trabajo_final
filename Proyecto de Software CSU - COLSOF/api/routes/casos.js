/**
 * @file routes/casos.js
 * @description Rutas para endpoints de casos
 */

import express from 'express';
import * as casosController from '../controllers/casosController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

/**
 * GET /api/casos - Obtener todos los casos (con filtros opcionales)
 * Query params: estado, prioridad, cliente, asignado_a, desde, hasta, refresh
 */
router.get('/', asyncHandler(casosController.getAllCasos));

/**
 * GET /api/casos/:id - Obtener caso específico
 */
router.get('/:id', asyncHandler(casosController.getCasoById));

/**
 * POST /api/casos - Crear nuevo caso
 */
router.post('/', validate(schemas.createCaseSchema), asyncHandler(casosController.createCaso));

/**
 * PUT /api/casos/:id - Actualizar caso
 */
router.put('/:id', validate(schemas.updateCaseSchema), asyncHandler(casosController.updateCaso));

/**
 * DELETE /api/casos/:id - Eliminar caso
 */
router.delete('/:id', asyncHandler(casosController.deleteCaso));

/**
 * GET /api/casos/stats/summary - Estadísticas de casos
 */
router.get('/stats/summary', asyncHandler(casosController.getCasosStats));

/**
 * GET /api/casos/dashboard/summary - Dashboard (compatibilidad)
 */
router.get('/dashboard/summary', asyncHandler(casosController.getDashboardStats));

export default router;
