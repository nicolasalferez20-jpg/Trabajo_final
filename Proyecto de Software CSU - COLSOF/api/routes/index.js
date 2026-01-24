/**
 * @file routes/index.js
 * @description Integración de todas las rutas
 */

import express from 'express';
import casosRoutes from './casos.js';
import clientesRoutes from './clientes.js';

const router = express.Router();

// Rutas principales
router.use('/casos', casosRoutes);
router.use('/clientes', clientesRoutes);

// Endpoint de estado del API
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rutas heredadas (compatibilidad con código antiguo)
router.post('/', async (req, res, next) => {
  const { action } = req.body;
  
  try {
    switch (action) {
      case 'get_casos_simple':
        return res.redirect(`/api/casos`);
      case 'get_clientes':
        return res.redirect(`/api/clientes`);
      case 'get_dashboard_stats':
        return res.redirect(`/api/casos/dashboard/summary`);
      default:
        return res.status(404).json({ error: 'Acción no encontrada' });
    }
  } catch (error) {
    next(error);
  }
});

// Compatibilidad con GET parameters (antiguo api-server.js)
router.get('/', async (req, res, next) => {
  const { action } = req.query;
  
  try {
    switch (action) {
      case 'get_casos_simple':
        return res.redirect(`/api/casos`);
      case 'get_clientes':
        return res.redirect(`/api/clientes`);
      case 'get_dashboard_stats':
        return res.redirect(`/api/casos/dashboard/summary`);
      default:
        return res.status(404).json({ error: 'Acción no encontrada' });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
