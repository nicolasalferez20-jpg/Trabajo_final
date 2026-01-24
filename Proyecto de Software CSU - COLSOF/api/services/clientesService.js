/**
 * @file services/clientesService.js
 * @description Lógica de negocio para clientes
 */

import sql from '../config/database.js';
import cache, { getCached, setCached, deleteCached, invalidatePattern, cacheConfig } from '../config/cache.js';
import logger from '../config/logger.js';

/**
 * Obtener todos los clientes (con caché)
 * @param {boolean} forceRefresh - Forzar refresco del caché
 * @returns {array} Lista de clientes
 */
export async function getClientes(forceRefresh = false) {
  const cacheKey = `${cacheConfig.KEYS.CLIENTES}all`;
  
  if (!forceRefresh) {
    const cached = getCached(cacheKey);
    if (cached) {
      logger.info('Cache hit', { key: cacheKey });
      return cached;
    }
  }

  try {
    logger.info('Fetching clientes from database');

    const clientes = await sql`
      SELECT 
        id,
        nombre,
        industria,
        contacto,
        email,
        telefono,
        fecha_creacion,
        activo
      FROM public.clientes
      ORDER BY nombre
    `;

    setCached(cacheKey, clientes, cacheConfig.TTL.CLIENTES);
    logger.info('Clientes fetched and cached', { count: clientes.length });

    return clientes;
  } catch (error) {
    logger.error('Error fetching clientes', { error: error.message });
    // Retornar array vacío para no romper frontend
    return [];
  }
}

/**
 * Obtener cliente por ID
 * @param {number} id - ID del cliente
 * @returns {object} Cliente encontrado
 */
export async function getClienteById(id) {
  const cacheKey = `${cacheConfig.KEYS.CLIENTES}${id}`;
  
  const cached = getCached(cacheKey);
  if (cached) {
    logger.info('Cache hit', { key: cacheKey });
    return cached;
  }

  try {
    const [cliente] = await sql`
      SELECT * FROM public.clientes WHERE id = ${id}
    `;

    if (!cliente) {
      const error = new Error('Cliente no encontrado');
      error.statusCode = 404;
      throw error;
    }

    setCached(cacheKey, cliente, cacheConfig.TTL.CLIENTES);
    return cliente;
  } catch (error) {
    logger.error('Error fetching cliente', { id, error: error.message });
    throw error;
  }
}

/**
 * Crear nuevo cliente
 * @param {object} data - Datos del cliente
 * @returns {object} Cliente creado
 */
export async function createCliente(data) {
  try {
    logger.info('Creating cliente', { nombre: data.nombre });

    const [cliente] = await sql`
      INSERT INTO public.clientes (
        nombre, industria, contacto, email, telefono, fecha_creacion, activo
      ) VALUES (
        ${data.nombre},
        ${data.industria || null},
        ${data.contacto || null},
        ${data.email || null},
        ${data.telefono || null},
        NOW(),
        true
      )
      RETURNING *
    `;

    // Invalidar caché
    invalidatePattern(`${cacheConfig.KEYS.CLIENTES}*`);

    logger.info('Cliente created', { id: cliente.id });
    return cliente;
  } catch (error) {
    logger.error('Error creating cliente', { error: error.message });
    throw error;
  }
}

/**
 * Actualizar cliente
 * @param {number} id - ID del cliente
 * @param {object} data - Datos a actualizar
 * @returns {object} Cliente actualizado
 */
export async function updateCliente(id, data) {
  try {
    logger.info('Updating cliente', { id });

    const updates = [];
    const values = [];

    if (data.nombre) {
      updates.push(`nombre = $${updates.length + 1}`);
      values.push(data.nombre);
    }

    if (data.industria) {
      updates.push(`industria = $${updates.length + 1}`);
      values.push(data.industria);
    }

    if (data.contacto) {
      updates.push(`contacto = $${updates.length + 1}`);
      values.push(data.contacto);
    }

    if (data.email) {
      updates.push(`email = $${updates.length + 1}`);
      values.push(data.email);
    }

    if (data.telefono) {
      updates.push(`telefono = $${updates.length + 1}`);
      values.push(data.telefono);
    }

    if (!updates.length) {
      const error = new Error('No hay campos para actualizar');
      error.statusCode = 400;
      throw error;
    }

    values.push(id);
    const query = `
      UPDATE public.clientes 
      SET ${updates.join(', ')}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const [cliente] = await sql.unsafe(query, values);

    if (!cliente) {
      const error = new Error('Cliente no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Invalidar caché
    deleteCached(`${cacheConfig.KEYS.CLIENTES}${id}`);
    invalidatePattern(`${cacheConfig.KEYS.CLIENTES}all*`);

    logger.info('Cliente updated', { id });
    return cliente;
  } catch (error) {
    logger.error('Error updating cliente', { id, error: error.message });
    throw error;
  }
}

/**
 * Eliminar cliente
 * @param {number} id - ID del cliente
 * @returns {boolean} Eliminado correctamente
 */
export async function deleteCliente(id) {
  try {
    logger.info('Deleting cliente', { id });

    const result = await sql`
      DELETE FROM public.clientes WHERE id = ${id} RETURNING id
    `;

    if (result.length === 0) {
      const error = new Error('Cliente no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Invalidar caché
    deleteCached(`${cacheConfig.KEYS.CLIENTES}${id}`);
    invalidatePattern(`${cacheConfig.KEYS.CLIENTES}*`);

    logger.info('Cliente deleted', { id });
    return true;
  } catch (error) {
    logger.error('Error deleting cliente', { id, error: error.message });
    throw error;
  }
}
