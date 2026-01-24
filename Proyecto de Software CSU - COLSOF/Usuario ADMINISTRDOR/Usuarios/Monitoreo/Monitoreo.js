// API Configuration
const API_URL = 'http://localhost:3001/api';

let casesData = [];
let usersData = [];
let currentTimeRange = '24h';

// Cargar datos desde la API
async function loadDataFromAPI() {
  try {
    const response = await fetch(`${API_URL}?action=get_casos_simple`);
    if (!response.ok) throw new Error('Error al cargar datos');
    
    const data = await response.json();
    casesData = data.cases || [];
    
    // Extraer usuarios
    extractUsers();
    
    console.log('✓ Datos cargados:', casesData.length, 'casos');
    updateKPIs();
    renderUsuariosActivos();
    renderActividad();
    renderUbicaciones();
    renderTimeline();
    
  } catch (error) {
    console.error('Error al cargar datos:', error);
  }
}

// Extraer usuarios únicos
function extractUsers() {
  const usersMap = new Map();
  
  // Admin
  usersMap.set('AdminColsof', {
    nombre: 'AdminColsof',
    rol: 'Administrador',
    estado: 'En línea',
    acciones: 0,
    ultimaAccion: new Date()
  });
  
  // Desde casos
  casesData.forEach(caso => {
    if (caso.asignado_a && caso.asignado_a !== 'Sin asignar') {
      if (!usersMap.has(caso.asignado_a)) {
        usersMap.set(caso.asignado_a, {
          nombre: caso.asignado_a,
          rol: 'Técnico',
          estado: Math.random() > 0.3 ? 'En línea' : 'Ausente',
          acciones: 0,
          ultimaAccion: new Date(caso.fecha_creacion)
        });
      }
      usersMap.get(caso.asignado_a).acciones++;
    }
    
    if (caso.autor && caso.autor !== 'Sistema') {
      if (!usersMap.has(caso.autor)) {
        usersMap.set(caso.autor, {
          nombre: caso.autor,
          rol: 'Gestor',
          estado: Math.random() > 0.4 ? 'En línea' : 'Ausente',
          acciones: 0,
          ultimaAccion: new Date(caso.fecha_creacion)
        });
      }
      usersMap.get(caso.autor).acciones++;
    }
  });
  
  usersData = Array.from(usersMap.values());
}

// Obtener rango de fechas
function getDateRange(timeRange) {
  const now = new Date();
  let startDate = new Date();
  
  switch(timeRange) {
    case '1h':
      startDate.setHours(now.getHours() - 1);
      break;
    case '24h':
      startDate.setDate(now.getDate() - 1);
      break;
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
  }
  
  return { start: startDate, end: now };
}

// Filtrar casos por rango
function filterCasesByTimeRange(timeRange) {
  const { start, end } = getDateRange(timeRange);
  return casesData.filter(c => {
    const caseDate = new Date(c.fecha_creacion);
    return caseDate >= start && caseDate <= end;
  });
}

// Actualizar KPIs
function updateKPIs() {
  const filteredCases = filterCasesByTimeRange(currentTimeRange);
  
  // Usuarios en línea
  const sesionesActivas = usersData.filter(u => u.estado === 'En línea').length;
  
  // Acciones hoy (casos en el rango)
  const totalAcciones = filteredCases.length;
  
  // Casos gestionados
  const casosGestionados = filteredCases.filter(c => c.estado === 'resuelto').length;
  
  // Tiempo promedio por sesión
  let totalHoras = 0;
  filteredCases.forEach(c => {
    if (c.fecha_creacion && c.fecha_resolucion) {
      const hours = (new Date(c.fecha_resolucion) - new Date(c.fecha_creacion)) / (1000 * 60 * 60);
      totalHoras += hours;
    }
  });
  
  const promedioHoras = filteredCases.length > 0 ? (totalHoras / filteredCases.length).toFixed(1) : 0;
  
  animateKPI(document.getElementById('sesiones'), sesionesActivas);
  animateKPI(document.getElementById('acciones'), totalAcciones);
  animateKPI(document.getElementById('casos'), casosGestionados);
  document.getElementById('tiempo').textContent = `${promedioHoras}h`;
}

// Animar KPI
function animateKPI(element, target) {
  const current = parseInt(element.textContent) || 0;
  if (current === target) return;
  
  const difference = target - current;
  const steps = 30;
  let step = 0;
  
  const timer = setInterval(() => {
    step++;
    const value = Math.round(current + (difference * step / steps));
    element.textContent = value;
    
    if (step === steps) {
      clearInterval(timer);
      element.textContent = target;
    }
  }, 20);
}

// Renderizar usuarios activos
function renderUsuariosActivos() {
  const cont = document.getElementById('usuariosActivos');
  cont.innerHTML = '';
  
  // Ordenar por acciones descendente
  const sorted = [...usersData].sort((a, b) => b.acciones - a.acciones);
  
  sorted.forEach((u, idx) => {
    const statusClass = u.estado === 'En línea' ? 'status-online' : 'status-away';
    const rowHTML = `
      <div class="user-card" style="animation: slideInLeft 0.3s ease ${idx * 0.05}s">
        <div class="user-meta">
          <div class="user-name">${u.nombre}</div>
          <div class="user-role">${u.rol}</div>
        </div>
        <div class="user-actions">
          <span class="status-pill ${statusClass}"><span class="status-dot"></span>${u.estado}</span>
          <div>${u.acciones} acciones</div>
        </div>
      </div>
    `;
    cont.insertAdjacentHTML('beforeend', rowHTML);
  });
}

// Renderizar actividad reciente
function renderActividad() {
  const cont = document.getElementById('actividad');
  cont.innerHTML = '';
  
  const actividades = [];
  
  // Generar actividades desde casos
  casesData.slice(0, 10).forEach(caso => {
    if (caso.asignado_a) {
      actividades.push({
        texto: `${caso.asignado_a} asignó caso ${caso.id}`,
        tiempo: new Date(caso.fecha_creacion)
      });
    }
  });
  
  // Ordenar por tiempo descendente
  actividades.sort((a, b) => b.tiempo - a.tiempo);
  
  actividades.slice(0, 8).forEach((item, idx) => {
    const timeAgo = getTimeAgo(item.tiempo);
    const html = `
      <div class="activity-item" style="animation: fadeIn 0.3s ease ${idx * 0.1}s">
        <span class="activity-time">${timeAgo}</span>
        <span class="activity-text">${item.texto}</span>
      </div>
    `;
    cont.insertAdjacentHTML('beforeend', html);
  });
}

// Obtener tiempo transcurrido
function getTimeAgo(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

// Renderizar ubicaciones (simulado)
function renderUbicaciones() {
  const cont = document.getElementById('ubicaciones');
  cont.innerHTML = '';
  
  // Simular distribución geográfica basada en cantidad de usuarios
  const totalUsers = usersData.length;
  const ubicaciones = [
    { ciudad: 'Bogotá', porcentaje: Math.floor((totalUsers * 45) / 100) || 2 },
    { ciudad: 'Medellín', porcentaje: Math.floor((totalUsers * 27) / 100) || 1 },
    { ciudad: 'Cali', porcentaje: Math.floor((totalUsers * 18) / 100) || 1 },
    { ciudad: 'Barranquilla', porcentaje: Math.floor((totalUsers * 10) / 100) || 1 }
  ];
  
  ubicaciones.forEach((u, idx) => {
    const html = `
      <div class="location-row" style="animation: slideInUp 0.3s ease ${idx * 0.1}s">
        <div class="location-top"><span>${u.ciudad}</span><span>${u.porcentaje} usuarios</span></div>
        <div class="progress"><div class="progress-fill" style="width:${Math.min(u.porcentaje * 10, 100)}%"></div></div>
      </div>
    `;
    cont.insertAdjacentHTML('beforeend', html);
  });
}

// Renderizar timeline
function renderTimeline() {
  const cont = document.getElementById('timeline');
  cont.innerHTML = '';
  
  const timelineItems = [];
  const now = new Date();
  
  // Generar eventos desde casos
  casesData.slice(0, 12).forEach(caso => {
    const hours = Math.floor((now - new Date(caso.fecha_creacion)) / 3600000);
    if (hours < 24) {
      const minutes = Math.floor((now - new Date(caso.fecha_creacion)) / 60000);
      const timeStr = minutes < 60 
        ? `${minutes} minutos atrás` 
        : `${Math.floor(minutes / 60)} horas atrás`;
      
      timelineItems.push({
        tiempo: timeStr,
        evento: `${caso.asignado_a || 'Sistema'} gestionó caso ${caso.id}`,
        tipo: caso.estado
      });
    }
  });
  
  // Ordenar por reciente primero
  timelineItems.slice(0, 8).forEach((item, idx) => {
    const statusColor = item.tipo === 'resuelto' ? 'green' : item.tipo === 'pausado' ? 'amber' : 'blue';
    const html = `
      <li style="animation: slideInLeft 0.3s ease ${idx * 0.08}s">
        <span class="timeline-dot ${statusColor}"></span>
        <div class="timeline-content">
          <div class="timeline-time">${item.tiempo}</div>
          <div class="timeline-text">${item.evento}</div>
        </div>
      </li>
    `;
    cont.insertAdjacentHTML('beforeend', html);
  });
}

// Event listeners
function setupEventListeners() {
  const timeRangeSelect = document.getElementById('timeRange');
  if (timeRangeSelect) {
    timeRangeSelect.addEventListener('change', (e) => {
      currentTimeRange = e.target.value;
      updateKPIs();
    });
  }
  
  const btnRefresh = document.getElementById('btnRefresh');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', async () => {
      btnRefresh.disabled = true;
      btnRefresh.innerHTML = '<i class="fa fa-rotate-right fa-spin"></i> Actualizando...';
      await loadDataFromAPI();
      btnRefresh.disabled = false;
      btnRefresh.innerHTML = '<i class="fa fa-rotate-right"></i> Actualizar';
      showNotification('Datos actualizados', 'success');
    });
  }
}

// Mostrar notificación
function showNotification(mensaje, tipo = 'info') {
  const notif = document.createElement('div');
  notif.className = `notification notification-${tipo}`;
  notif.textContent = mensaje;
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    border-radius: 10px;
    background: ${tipo === 'success' ? '#16a34a' : tipo === 'error' ? '#dc2626' : '#2563eb'};
    color: white;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

// Auto-actualizar cada 30 segundos
function startAutoRefresh() {
  setInterval(loadDataFromAPI, 30000);
}

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
  await loadDataFromAPI();
  setupEventListeners();
  startAutoRefresh();
});
