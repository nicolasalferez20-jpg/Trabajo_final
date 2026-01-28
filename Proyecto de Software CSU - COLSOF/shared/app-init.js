/**
 * Script de inicialización común para todos los módulos
 * Incluir en todas las páginas HTML antes de los scripts específicos
 */

// API Client compartido
// Use relative `/api` in production and localhost:3000 in dev (server runs on 3000)
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000/api'
  : '/api'

// Utilidades compartidas
const utils = {
  formatCaseId: (id) => `#${String(id ?? '').padStart(8, '0')}`,
  
  formatDate: (value) => {
    if (!value) return 'Sin fecha'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleString('es-CO', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric'
    })
  },

  formatDateTime: (value) => {
    if (!value) return 'Sin fecha'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleString('es-CO', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  },

  timeAgo: (value) => {
    if (!value) return 'Sin fecha'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return 'Sin fecha'
    const diff = Date.now() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 60) return `Hace ${minutes} min`
    if (hours < 24) return `Hace ${hours} hora${hours === 1 ? '' : 's'}`
    return `Hace ${days} dia${days === 1 ? '' : 's'}`
  },

  showToast: (msg, isError = false) => {
    let box = document.getElementById('app-toast')
    if (!box) {
      box = document.createElement('div')
      box.id = 'app-toast'
      box.style.position = 'fixed'
      box.style.right = '20px'
      box.style.bottom = '20px'
      box.style.padding = '12px 16px'
      box.style.borderRadius = '8px'
      box.style.boxShadow = '0 10px 30px rgba(0,0,0,0.12)'
      box.style.zIndex = '9999'
      box.style.fontWeight = '600'
      document.body.appendChild(box)
    }
    box.textContent = msg
    box.style.background = isError ? '#fee2e2' : '#d1fae5'
    box.style.color = isError ? '#991b1b' : '#065f46'
    clearTimeout(box._timer)
    box._timer = setTimeout(() => box.remove(), 2400)
  },

  getPriorityColor: (priority) => {
    const p = String(priority || '').toLowerCase()
    if (p === 'alta' || p === 'urgente' || p === 'crítica') return '#dc2626'
    if (p === 'media') return '#f97316'
    return '#10b981'
  },

  getStatusColor: (status) => {
    const s = String(status || '').toLowerCase()
    if (s.includes('abierto') || s.includes('activo')) return '#06b6d4'
    if (s.includes('progreso')) return '#f59e0b'
    if (s.includes('resuelto')) return '#10b981'
    if (s.includes('cerrado')) return '#6b7280'
    if (s.includes('cancelado')) return '#a855f7'
    return '#94a3b8'
  },

  normalize: (val) => String(val || '').toLowerCase()
}

// Cliente API
class APIClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    
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

  async getEstadisticasUsuarios() {
    const result = await this.request('/usuarios-stats')
    return result.data
  }
}

// Instancia global
const api = new APIClient()

// Hacer disponible globalmente
window.api = api
window.utils = utils
window.API_BASE_URL = API_BASE_URL

console.log('✅ Sistema inicializado - API conectada a:', API_BASE_URL)

// ===== ACTUALIZACIÓN AUTOMÁTICA DEL BADGE DE NOTIFICACIONES =====
function actualizarBadgeNotificaciones() {
  const badge = document.getElementById('notificationBadge');
  if (!badge) return;

  // Intentar cargar notificaciones desde API o usar datos de ejemplo
  (async () => {
    try {
      const casos = await api.getCasos();
      
      // Calcular notificaciones sin leer (casos nuevos o urgentes)
      const ahora = new Date();
      let countNoLeidas = 0;
      
      casos.forEach(caso => {
        const fechaCreacion = new Date(caso.fecha_creacion);
        const horasDesdeCreacion = (ahora - fechaCreacion) / 3600000;
        
        // Contar como no leída si:
        // - Es menor a 24 horas
        // - O es crítica/urgente
        const esReciente = horasDesdeCreacion < 24;
        const esUrgente = caso.prioridad && (caso.prioridad.toLowerCase().includes('critica') || caso.prioridad.toLowerCase().includes('urgente'));
        
        if (esReciente || esUrgente) {
          countNoLeidas++;
        }
      });
      
      // Actualizar badge
      badge.textContent = countNoLeidas;
      badge.classList.toggle('hidden', countNoLeidas === 0);
      
      console.log(`📬 Badge actualizado: ${countNoLeidas} notificaciones`);
    } catch (error) {
      console.warn('⚠️ No se pudo actualizar badge de notificaciones:', error);
      // En caso de error, mostrar 4 notificaciones de ejemplo
      badge.textContent = '4';
      badge.classList.remove('hidden');
    }
  })();
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', actualizarBadgeNotificaciones);
} else {
  actualizarBadgeNotificaciones();
}

// Actualizar cada 2 minutos
setInterval(actualizarBadgeNotificaciones, 120000);

