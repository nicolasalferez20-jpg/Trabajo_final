/**
 * @file services/casosService.js
 * @description Lógica de negocio para casos
 * Contiene funciones reutilizables y consultas optimizadas
 */

import sql from '../config/database.js';
import cache, { getCached, setCached, deleteCached, invalidatePattern, cacheConfig } from '../config/cache.js';
import logger from '../config/logger.js';
import { ESTADO_MAP, PRIORIDAD_MAP } from '../config/constants.js';

/**
 * Obtener todos los casos (con caché)
 * @param {object} filters - Filtros opcionales
 * @param {boolean} forceRefresh - Forzar refresco del caché
 * @returns {array} Lista de casos
 */
export async function getCasos(filters = {}, forceRefresh = false) {
  const cacheKey = `${cacheConfig.KEYS.CASOS}list:${JSON.stringify(filters)}`;
  
  if (!forceRefresh) {
    const cached = getCached(cacheKey);
    if (cached) {
      logger.info('Cache hit', { key: cacheKey });
      return cached;
    }
  }

  try {
    logger.info('Fetching casos from database', { filters });

    let query = `
      SELECT 
        id, 
        titulo,
        descripcion,
        cliente,
        fecha_creacion,
        fecha_actualizacion,
        estado,
        asignado_a,
        prioridad,
        categoria,
        autor,
        presupuesto,
        costo_ejecutado,
        centro_costos
      FROM public.casos
      WHERE 1=1
    `;

    const params = [];

    if (filters.estado) {
      query += ` AND estado = $${params.length + 1}`;
      params.push(filters.estado);
    }

    if (filters.prioridad) {
      query += ` AND prioridad = $${params.length + 1}`;
      params.push(filters.prioridad);
    }

    if (filters.cliente) {
      query += ` AND LOWER(cliente) LIKE LOWER($${params.length + 1})`;
      params.push(`%${filters.cliente}%`);
    }

    if (filters.asignado_a) {
      query += ` AND asignado_a = $${params.length + 1}`;
      params.push(filters.asignado_a);
    }

    if (filters.desde) {
      query += ` AND fecha_creacion >= $${params.length + 1}`;
      params.push(new Date(filters.desde));
    }

    if (filters.hasta) {
      query += ` AND fecha_creacion <= $${params.length + 1}`;
      params.push(new Date(filters.hasta));
    }

    query += ` ORDER BY fecha_creacion DESC LIMIT 500`;

    const casos = await sql.unsafe(query, params);
    
    setCached(cacheKey, casos, cacheConfig.TTL.CASOS_LIST);
    logger.info('Casos fetched and cached', { count: casos.length });

    return casos;
  } catch (error) {
    logger.error('Error fetching casos', { error: error.message });
    throw error;
  }
}

/**
 * Obtener un caso por ID
 * @param {number} id - ID del caso
 * @returns {object} Caso encontrado
 */
export async function getCasoById(id) {
  const cacheKey = `${cacheConfig.KEYS.CASOS}${id}`;
  
  const cached = getCached(cacheKey);
  if (cached) {
    logger.info('Cache hit', { key: cacheKey });
    return cached;
  }

  try {
    const [caso] = await sql`
      SELECT * FROM public.casos WHERE id = ${id}
    `;

    if (!caso) {
      const error = new Error('Caso no encontrado');
      error.statusCode = 404;
      throw error;
    }

    setCached(cacheKey, caso, cacheConfig.TTL.CASOS_DETAIL);
    return caso;
  } catch (error) {
    logger.error('Error fetching caso by ID', { id, error: error.message });
    throw error;
  }
}

/**
 * Crear nuevo caso
 * @param {object} data - Datos del caso
 * @returns {object} Caso creado
 */
export async function createCaso(data) {
  const client = await sql.reserve();

  try {
    // Validar y mapear datos
    const estado = ESTADO_MAP[data.estado] || 'abierto';
    const prioridad = PRIORIDAD_MAP[data.prioridad] || 'media';

    logger.info('Creating caso', { titulo: data.titulo, cliente: data.cliente });

    // Usar transacción
    const [caso] = await client`
      INSERT INTO public.casos (
        titulo, descripcion, cliente, categoria,
        prioridad, estado, asignado_a, autor,
        presupuesto, costo_ejecutado, centro_costos,
        fecha_creacion, fecha_actualizacion
      ) VALUES (
        ${data.titulo},
        ${data.descripcion},
        ${data.cliente},
        ${data.categoria},
        ${prioridad},
        ${estado},
        ${data.asignado_a || null},
        ${data.autor || 'Sistema'},
        ${data.presupuesto || 0},
        ${data.costo_ejecutado || 0},
        ${data.centro_costos || null},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    // Invalidar caché de lista
    invalidatePattern(`${cacheConfig.KEYS.CASOS}list:*`);

    logger.info('Caso created', { id: caso.id });
    return caso;
  } catch (error) {
    logger.error('Error creating caso', { error: error.message });
    throw error;
  } finally {
    await client.release();
  }
}

/**
 * Actualizar caso
 * @param {number} id - ID del caso
 * @param {object} data - Datos a actualizar
 * @returns {object} Caso actualizado
 */
export async function updateCaso(id, data) {
  try {
    logger.info('Updating caso', { id, fields: Object.keys(data) });

    const updates = [];
    const values = [];

    if (data.estado) {
      updates.push(`estado = $${updates.length + 1}`);
      values.push(ESTADO_MAP[data.estado] || data.estado);
    }

    if (data.prioridad) {
      updates.push(`prioridad = $${updates.length + 1}`);
      values.push(PRIORIDAD_MAP[data.prioridad] || data.prioridad);
    }

    if (data.titulo) {
      updates.push(`titulo = $${updates.length + 1}`);
      values.push(data.titulo);
    }

    if (data.descripcion) {
      updates.push(`descripcion = $${updates.length + 1}`);
      values.push(data.descripcion);
    }

    if (data.asignado_a !== undefined) {
      updates.push(`asignado_a = $${updates.length + 1}`);
      values.push(data.asignado_a);
    }

    if (data.costo_ejecutado !== undefined) {
      updates.push(`costo_ejecutado = $${updates.length + 1}`);
      values.push(data.costo_ejecutado);
    }

    updates.push(`fecha_actualizacion = NOW()`);
    values.push(id);

    const query = `
      UPDATE public.casos 
      SET ${updates.join(', ')}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const [caso] = await sql.unsafe(query, values);

    if (!caso) {
      const error = new Error('Caso no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Invalidar caché
    deleteCached(`${cacheConfig.KEYS.CASOS}${id}`);
    invalidatePattern(`${cacheConfig.KEYS.CASOS}list:*`);

    logger.info('Caso updated', { id });
    return caso;
  } catch (error) {
    logger.error('Error updating caso', { id, error: error.message });
    throw error;
  }
}

/**
 * Eliminar caso
 * @param {number} id - ID del caso
 * @returns {boolean} Eliminado correctamente
 */
export async function deleteCaso(id) {
  try {
    logger.info('Deleting caso', { id });

    const result = await sql`
      DELETE FROM public.casos WHERE id = ${id} RETURNING id
    `;

    if (result.length === 0) {
      const error = new Error('Caso no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Invalidar caché
    deleteCached(`${cacheConfig.KEYS.CASOS}${id}`);
    invalidatePattern(`${cacheConfig.KEYS.CASOS}list:*`);

    logger.info('Caso deleted', { id });
    return true;
  } catch (error) {
    logger.error('Error deleting caso', { id, error: error.message });
    throw error;
  }
}

/**
 * Obtener estadísticas de casos
 * @returns {object} Estadísticas
 */
export async function getCasosStats() {
  const cacheKey = `${cacheConfig.KEYS.ESTADISTICAS}casos`;
  
  const cached = getCached(cacheKey);
  if (cached) {
    logger.info('Cache hit', { key: cacheKey });
    return cached;
  }

  try {
    const stats = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN estado = 'abierto' THEN 1 END) as abiertos,
        COUNT(CASE WHEN estado = 'en_progreso' THEN 1 END) as en_progreso,
        COUNT(CASE WHEN estado = 'resuelto' THEN 1 END) as resueltos,
        COUNT(CASE WHEN estado = 'cerrado' THEN 1 END) as cerrados,
        COUNT(CASE WHEN prioridad = 'critica' THEN 1 END) as criticos,
        COUNT(CASE WHEN prioridad = 'alta' THEN 1 END) as altos,
        SUM(COALESCE(presupuesto, 0)) as presupuesto_total,
        SUM(COALESCE(costo_ejecutado, 0)) as costo_total
      FROM public.casos
    `;

    setCached(cacheKey, stats[0], cacheConfig.TTL.ESTADISTICAS);
    return stats[0];
  } catch (error) {
    logger.error('Error fetching casos stats', { error: error.message });
    throw error;
  }
}
