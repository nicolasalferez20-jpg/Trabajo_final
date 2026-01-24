/**
 * @file controllers/casosController.js
 * @description Controladores para endpoints de casos
 */

import * as casosService from '../services/casosService.js';
import { ApiError } from '../middleware/errorHandler.js';
import { HTTP_STATUS } from '../config/constants.js';
import logger from '../config/logger.js';

/**
 * GET /api/casos - Obtener todos los casos
 */
export async function getAllCasos(req, res, next) {
  try {
    const filters = {
      estado: req.query.estado,
      prioridad: req.query.prioridad,
      cliente: req.query.cliente,
      asignado_a: req.query.asignado_a,
      desde: req.query.desde,
      hasta: req.query.hasta
    };

    const forceRefresh = req.query.refresh === 'true';
    const casos = await casosService.getCasos(filters, forceRefresh);

    res.json({
      success: true,
      data: casos,
      count: casos.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/casos/:id - Obtener caso por ID
 */
export async function getCasoById(req, res, next) {
  try {
    const caso = await casosService.getCasoById(parseInt(req.params.id));
    res.json({
      success: true,
      data: caso
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/casos - Crear nuevo caso
 */
export async function createCaso(req, res, next) {
  try {
    const caso = await casosService.createCaso(req.body);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Caso creado correctamente',
      data: caso
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/casos/:id - Actualizar caso
 */
export async function updateCaso(req, res, next) {
  try {
    const caso = await casosService.updateCaso(parseInt(req.params.id), req.body);
    res.json({
      success: true,
      message: 'Caso actualizado correctamente',
      data: caso
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/casos/:id - Eliminar caso
 */
export async function deleteCaso(req, res, next) {
  try {
    await casosService.deleteCaso(parseInt(req.params.id));
    res.json({
      success: true,
      message: 'Caso eliminado correctamente'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/casos/stats/summary - Obtener estadísticas de casos
 */
export async function getCasosStats(req, res, next) {
  try {
    const stats = await casosService.getCasosStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/casos/dashboard/summary - Dashboard dinámico (para mantener compatibilidad)
 */
export async function getDashboardStats(req, res, next) {
  try {
    const stats = await casosService.getCasosStats();
    res.json({
      success: true,
      reportes_generados: stats.total,
      descargas: 0,
      usuarios_activos: 0,
      total_casos: stats.total,
      resueltos: stats.resueltos,
      pausados: 0,
      cerrados: stats.cerrados,
      pendientes: stats.abiertos + stats.en_progreso
    });
  } catch (error) {
    next(error);
  }
}
