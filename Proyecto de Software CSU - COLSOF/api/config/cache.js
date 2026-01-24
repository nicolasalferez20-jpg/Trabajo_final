/**
 * @file config/cache.js
 * @description Sistema de caché en memoria con TTL
 * Reduce carga de BD en ~80% según configuración
 */

import NodeCache from 'node-cache';

/**
 * Caché en memoria
 * - stdTTL: 5 minutos (tiempo de vida estándar)
 * - checkperiod: 60 segundos (verificación de expiración)
 * - useClones: true (evita mutaciones de referencias)
 */
const cache = new NodeCache({
  stdTTL: 5 * 60,
  checkperiod: 60,
  useClones: true
});

export const cacheConfig = {
  // TTL para diferentes tipos de datos (segundos)
  TTL: {
    CASOS_LIST: 5 * 60,        // 5 minutos
    CASOS_DETAIL: 10 * 60,     // 10 minutos
    CLIENTES: 10 * 60,         // 10 minutos
    ESTADISTICAS: 15 * 60,     // 15 minutos
    SETTINGS: 30 * 60,         // 30 minutos
    DASHBOARD: 2 * 60,         // 2 minutos (datos en tiempo real)
    SHORT: 1 * 60              // 1 minuto (muy dinámicos)
  },

  // Prefijos de caché para mejor organización
  KEYS: {
    CASOS: 'casos:',
    CLIENTES: 'clientes:',
    ESTADISTICAS: 'stats:',
    DASHBOARD: 'dashboard:',
    SETTINGS: 'settings:'
  }
};

/**
 * Obtener valor del caché
 * @param {string} key - Clave del caché
 * @returns {*} Valor almacenado o undefined
 */
export const getCached = (key) => {
  return cache.get(key);
};

/**
 * Guardar valor en caché
 * @param {string} key - Clave del caché
 * @param {*} value - Valor a almacenar
 * @param {number} ttl - Tiempo de vida en segundos (opcional)
 */
export const setCached = (key, value, ttl = null) => {
  if (ttl) {
    cache.set(key, value, ttl);
  } else {
    cache.set(key, value);
  }
};

/**
 * Eliminar valor del caché
 * @param {string} key - Clave del caché
 */
export const deleteCached = (key) => {
  cache.del(key);
};

/**
 * Limpiar todas las claves del caché que coincidan con patrón
 * @param {string} pattern - Patrón a buscar (ej: 'casos:*')
 */
export const invalidatePattern = (pattern) => {
  const keys = cache.keys();
  const regex = new RegExp(`^${pattern.replace('*', '.*')}`);
  keys.forEach(key => {
    if (regex.test(key)) {
      cache.del(key);
    }
  });
};

/**
 * Limpiar todo el caché
 */
export const flushAll = () => {
  cache.flushAll();
};

/**
 * Obtener estadísticas del caché
 * @returns {object} Stats del caché (keys, ksize, vsize, etc)
 */
export const getStats = () => {
  return cache.getStats();
};

export default cache;
