/**
 * @file controllers/clientesController.js
 * @description Controladores para endpoints de clientes
 */

import * as clientesService from '../services/clientesService.js';
import { HTTP_STATUS } from '../config/constants.js';
import logger from '../config/logger.js';

/**
 * GET /api/clientes - Obtener todos los clientes
 */
export async function getAllClientes(req, res, next) {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const clientes = await clientesService.getClientes(forceRefresh);

    res.json({
      success: true,
      data: clientes,
      count: clientes.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/clientes/:id - Obtener cliente por ID
 */
export async function getClienteById(req, res, next) {
  try {
    const cliente = await clientesService.getClienteById(parseInt(req.params.id));
    res.json({
      success: true,
      data: cliente
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/clientes - Crear nuevo cliente
 */
export async function createCliente(req, res, next) {
  try {
    const cliente = await clientesService.createCliente(req.body);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Cliente creado correctamente',
      data: cliente
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/clientes/:id - Actualizar cliente
 */
export async function updateCliente(req, res, next) {
  try {
    const cliente = await clientesService.updateCliente(parseInt(req.params.id), req.body);
    res.json({
      success: true,
      message: 'Cliente actualizado correctamente',
      data: cliente
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/clientes/:id - Eliminar cliente
 */
export async function deleteCliente(req, res, next) {
  try {
    await clientesService.deleteCliente(parseInt(req.params.id));
    res.json({
      success: true,
      message: 'Cliente eliminado correctamente'
    });
  } catch (error) {
    next(error);
  }
}
