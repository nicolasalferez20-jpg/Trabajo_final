/**
 * @file middleware/requestLogger.js
 * @description Logging de requests y respuestas
 */

import logger from '../config/logger.js';

/**
 * Middleware para logging de requests
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Capturar el método original de res.json
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      query: req.query,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    return originalJson(data);
  };

  next();
};

/**
 * Middleware para logging detallado en desarrollo
 */
export const detailedLogger = (req, res, next) => {
  if (process.env.DEBUG_REQUESTS === 'true') {
    console.log('\n📨 ==========================================');
    console.log(`📨 ${req.method.toUpperCase()} ${req.path}`);
    console.log('📨 Headers:', req.headers);
    if (req.body) console.log('📨 Body:', req.body);
    console.log('📨 ==========================================\n');
  }
  next();
};
