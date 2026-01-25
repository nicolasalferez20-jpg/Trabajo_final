/**
 * Cliente API compartido para todo el proyecto
 * Uso: Importar en cualquier script que necesite comunicarse con el backend
 */

const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3001/api'
  : '/api'

// Caché simple para peticiones
const cache = new Map()

class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success === false) {
        throw new Error(data.error || 'Error desconocido')
      }

      return data
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error)
      throw error
    }
  }

  // ========== CASOS ==========
  async getCasos(filters = {}) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })
    
    const endpoint = `/casos${params.toString() ? '?' + params : ''}`
    const result = await this.request(endpoint)
    return result.data || []
  }

  async getCaso(id) {
    const result = await this.request(`/casos/${id}`)
    return result.data
  }

  async crearCaso(caso) {
    const result = await this.request('/casos', {
      method: 'POST',
      body: JSON.stringify(caso)
    })
    return result.data
  }

  async actualizarCaso(id, updates) {
    const result = await this.request(`/casos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
    return result.data
  }

  async getEstadisticasCasos() {
    const result = await this.request('/estadisticas')
    return result.data
  }

  // ========== USUARIOS ==========
  async getUsuarios(filters = {}) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value)
    })
    
    const endpoint = `/usuarios${params.toString() ? '?' + params : ''}`
    const result = await this.request(endpoint)
    return result.data || []
  }

  async getUsuario(id) {
    const result = await this.request(`/usuarios/${id}`)
    return result.data
  }

  async crearUsuario(usuario) {
    const result = await this.request('/usuarios', {
      method: 'POST',
      body: JSON.stringify(usuario)
    })
    return result.data
  }

  async actualizarUsuario(id, updates) {
    const result = await this.request(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
    return result.data
  }

  async getEstadisticasUsuarios() {
    const result = await this.request('/usuarios-stats')
    return result.data
  }

  // ========== UTILIDADES ==========
  async healthCheck() {
    try {
      const result = await this.request('/health')
      return result.status === 'ok'
    } catch {
      return false
    }
  }
}

// Instancia global
const apiClient = new APIClient(API_BASE_URL)

// Exportar para uso en módulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { apiClient, APIClient }
}

// También disponible globalmente para scripts tradicionales
if (typeof window !== 'undefined') {
  window.apiClient = apiClient
  window.APIClient = APIClient
}
