#!/usr/bin/env node

/**
 * @file server.js
 * @description Punto de entrada del servidor API
 * Ubicación: Usuario GESTOR/server.js
 * Uso: npm start (producción) o npm run dev (desarrollo)
 */

import dotenv from 'dotenv';
import { startServer } from '../api/app.js';
import logger from '../api/config/logger.js';

// Cargar variables de entorno
dotenv.config();

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

logger.info('Iniciando servidor CSU COLSOF API v2.0', {
  port: PORT,
  environment: NODE_ENV,
  nodeVersion: process.version
});

// Iniciar servidor
startServer(PORT).catch((error) => {
  logger.error('Error fatal al iniciar servidor', { error: error.message });
  process.exit(1);
});

// Manejo de excepciones no capturadas
process.on('uncaughtException', (error) => {
  logger.error('Excepción no capturada', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesa rechazada no manejada', { reason, promise });
  process.exit(1);
});
