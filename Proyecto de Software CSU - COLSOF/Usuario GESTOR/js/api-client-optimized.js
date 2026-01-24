/**
 * @file utils/api-client-optimized.js
 * @description Cliente API optimizado para frontend
 * Características: Deduplicación, validación, caché local, retry automático
 * 
 * Ubicación recomendada: Usuario GESTOR/js/api-client-optimized.js
 * 
 * Uso:
 * import { apiClient } from './api-client-optimized.js';
 * const casos = await apiClient.getCasos({ estado: 'abierto' });
 */

const API_URL = 'http://localhost:3001/api';

// Deduplicación de requests - evita requests duplicados simultáneos
const requestCache = new Map();

// Caché local del cliente - almacena respuestas con TTL
class ClientCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  set(key, value, ttl = 5 * 60 * 1000) { // 5 minutos por defecto
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
    
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  invalidate(pattern) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }
}

const localCache = new ClientCache();

// Validadores básicos
const validators = {
  isValidId: (id) => Number.isInteger(id) && id > 0,
  
  isValidCaso: (caso) => {
    return caso.titulo && 
           caso.descripcion && 
           caso.cliente && 
           caso.categoria;
  },

  isValidCliente: (cliente) => {
    return cliente.nombre && cliente.nombre.length >= 3;
  }
};

/**
 * Realizar request con deduplicación automática
 * Si hay una request idéntica en progreso, espera a la respuesta
 * en lugar de hacer otra request
 */
async function deduplicatedFetch(url, options = {}) {
  const cacheKey = `${url}:${JSON.stringify(options)}`;
  
  // Si hay una request en progreso, espera
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey);
  }

  // Ejecutar la request
  const promise = fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    })
    .finally(() => {
      requestCache.delete(cacheKey);
    });

  requestCache.set(cacheKey, promise);
  return promise;
}

/**
 * Cliente API con optimizaciones
 */
export const apiClient = {
  // ==================== CASOS ====================

  /**
   * Obtener casos con filtros
   */
  async getCasos(filters = {}, useCache = true) {
    const cacheKey = `casos:${JSON.stringify(filters)}`;
    
    if (useCache) {
      const cached = localCache.get(cacheKey);
      if (cached) return cached;
    }

    const params = new URLSearchParams();
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.prioridad) params.append('prioridad', filters.prioridad);
    if (filters.cliente) params.append('cliente', filters.cliente);
    if (filters.asignado_a) params.append('asignado_a', filters.asignado_a);

    const url = `${API_URL}/casos${params.toString() ? '?' + params : ''}`;
    const data = await deduplicatedFetch(url);

    if (data.success) {
      localCache.set(cacheKey, data.data, 5 * 60 * 1000); // 5 min
      return data.data;
    }
    
    throw new Error(data.error || 'Error fetching casos');
  },

  /**
   * Obtener caso por ID
   */
  async getCasoById(id) {
    if (!validators.isValidId(id)) {
      throw new Error('ID inválido');
    }

    const cacheKey = `caso:${id}`;
    const cached = localCache.get(cacheKey);
    if (cached) return cached;

    const data = await deduplicatedFetch(`${API_URL}/casos/${id}`);
    
    if (data.success) {
      localCache.set(cacheKey, data.data, 10 * 60 * 1000); // 10 min
      return data.data;
    }
    
    throw new Error(data.error || 'Caso no encontrado');
  },

  /**
   * Crear nuevo caso
   */
  async createCaso(casoData) {
    if (!validators.isValidCaso(casoData)) {
      throw new Error('Datos de caso inválidos');
    }

    const data = await deduplicatedFetch(`${API_URL}/casos`, {
      method: 'POST',
      body: JSON.stringify(casoData)
    });

    if (data.success) {
      // Invalidar caché
      localCache.invalidate('casos:.*');
      return data.data;
    }

    throw new Error(data.error || 'Error creando caso');
  },

  /**
   * Actualizar caso
   */
  async updateCaso(id, updates) {
    if (!validators.isValidId(id)) {
      throw new Error('ID inválido');
    }

    const data = await deduplicatedFetch(`${API_URL}/casos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });

    if (data.success) {
      // Invalidar caché relevante
      localCache.invalidate(`caso:${id}`);
      localCache.invalidate('casos:.*');
      return data.data;
    }

    throw new Error(data.error || 'Error actualizando caso');
  },

  /**
   * Eliminar caso
   */
  async deleteCaso(id) {
    if (!validators.isValidId(id)) {
      throw new Error('ID inválido');
    }

    const data = await deduplicatedFetch(`${API_URL}/casos/${id}`, {
      method: 'DELETE'
    });

    if (data.success) {
      localCache.invalidate(`caso:${id}`);
      localCache.invalidate('casos:.*');
      return true;
    }

    throw new Error(data.error || 'Error eliminando caso');
  },

  /**
   * Obtener estadísticas de casos
   */
  async getCasosStats() {
    const cacheKey = 'casos:stats';
    const cached = localCache.get(cacheKey);
    if (cached) return cached;

    const data = await deduplicatedFetch(`${API_URL}/casos/stats/summary`);
    
    if (data.success) {
      localCache.set(cacheKey, data.data, 15 * 60 * 1000); // 15 min
      return data.data;
    }

    throw new Error(data.error || 'Error fetching stats');
  },

  // ==================== CLIENTES ====================

  /**
   * Obtener clientes
   */
  async getClientes(useCache = true) {
    const cacheKey = 'clientes:all';
    
    if (useCache) {
      const cached = localCache.get(cacheKey);
      if (cached) return cached;
    }

    const data = await deduplicatedFetch(`${API_URL}/clientes`);

    if (data.success) {
      localCache.set(cacheKey, data.data, 10 * 60 * 1000); // 10 min
      return data.data;
    }

    throw new Error(data.error || 'Error fetching clientes');
  },

  /**
   * Obtener cliente por ID
   */
  async getClienteById(id) {
    if (!validators.isValidId(id)) {
      throw new Error('ID inválido');
    }

    const cacheKey = `cliente:${id}`;
    const cached = localCache.get(cacheKey);
    if (cached) return cached;

    const data = await deduplicatedFetch(`${API_URL}/clientes/${id}`);
    
    if (data.success) {
      localCache.set(cacheKey, data.data, 10 * 60 * 1000);
      return data.data;
    }

    throw new Error(data.error || 'Cliente no encontrado');
  },

  /**
   * Crear cliente
   */
  async createCliente(clienteData) {
    if (!validators.isValidCliente(clienteData)) {
      throw new Error('Datos de cliente inválidos');
    }

    const data = await deduplicatedFetch(`${API_URL}/clientes`, {
      method: 'POST',
      body: JSON.stringify(clienteData)
    });

    if (data.success) {
      localCache.invalidate('clientes:.*');
      return data.data;
    }

    throw new Error(data.error || 'Error creando cliente');
  },

  /**
   * Actualizar cliente
   */
  async updateCliente(id, updates) {
    if (!validators.isValidId(id)) {
      throw new Error('ID inválido');
    }

    const data = await deduplicatedFetch(`${API_URL}/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });

    if (data.success) {
      localCache.invalidate(`cliente:${id}`);
      localCache.invalidate('clientes:.*');
      return data.data;
    }

    throw new Error(data.error || 'Error actualizando cliente');
  },

  /**
   * Eliminar cliente
   */
  async deleteCliente(id) {
    if (!validators.isValidId(id)) {
      throw new Error('ID inválido');
    }

    const data = await deduplicatedFetch(`${API_URL}/clientes/${id}`, {
      method: 'DELETE'
    });

    if (data.success) {
      localCache.invalidate(`cliente:${id}`);
      localCache.invalidate('clientes:.*');
      return true;
    }

    throw new Error(data.error || 'Error eliminando cliente');
  },

  // ==================== UTILIDADES ====================

  /**
   * Limpiar caché local
   */
  clearCache() {
    localCache.clear();
  },

  /**
   * Obtener estadísticas del caché local
   */
  getCacheStats() {
    return {
      size: localCache.cache.size,
      maxSize: localCache.maxSize,
      entries: Array.from(localCache.cache.entries()).map(([key, value]) => ({
        key,
        expiresIn: Math.round((value.expiresAt - Date.now()) / 1000) + 's'
      }))
    };
  }
};

export default apiClient;
