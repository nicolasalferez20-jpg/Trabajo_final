/**
 * @file routes/clientes.js
 * @description Rutas para endpoints de clientes
 */

import express from 'express';
import * as clientesController from '../controllers/clientesController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

/**
 * GET /api/clientes - Obtener todos los clientes
 */
router.get('/', asyncHandler(clientesController.getAllClientes));

/**
 * GET /api/clientes/:id - Obtener cliente específico
 */
router.get('/:id', asyncHandler(clientesController.getClienteById));

/**
 * POST /api/clientes - Crear nuevo cliente
 */
router.post('/', validate(schemas.createClientSchema), asyncHandler(clientesController.createCliente));

/**
 * PUT /api/clientes/:id - Actualizar cliente
 */
router.put('/:id', validate(schemas.createClientSchema), asyncHandler(clientesController.updateCliente));

/**
 * DELETE /api/clientes/:id - Eliminar cliente
 */
router.delete('/:id', asyncHandler(clientesController.deleteCliente));

export default router;
