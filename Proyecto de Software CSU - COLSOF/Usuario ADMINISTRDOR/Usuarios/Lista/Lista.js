// API Configuration
const API_URL = 'http://localhost:3001/api';

let usuarios = [];
let casesData = [];

const tabla = document.getElementById('tablaUsuarios');
const search = document.getElementById('search');
const filterRole = document.getElementById('filterRole');
const filterStatus = document.getElementById('filterStatus');

const roleMap = {
  Administrador: 'role-admin',
  Gestor: 'role-gestor',
  'Técnico': 'role-tecnico',
  Técnico: 'role-tecnico',
  Empleado: 'role-empleado'
};

const statusMap = {
  Activo: 'status-active',
  Inactivo: 'status-inactive'
};

// Cargar datos desde la API
async function loadDataFromAPI() {
  try {
    const response = await fetch(`${API_URL}?action=get_casos_simple`);
    if (!response.ok) throw new Error('Error al cargar datos');
    
    const data = await response.json();
    casesData = data.cases || [];
    
    // Extraer usuarios desde los casos
    extractUsersFromCases();
    
    console.log('✓ Datos cargados desde BD:', usuarios.length, 'usuarios');
    updateKPIs();
    renderTable();
    
  } catch (error) {
    console.error('Error al cargar datos:', error);
    showError('No se pudieron cargar los usuarios. Verifique la conexión.');
  }
}

// Extraer usuarios únicos desde los casos
function extractUsersFromCases() {
  const usuariosMap = new Map();
  
  // Agregar usuario administrador
  usuariosMap.set('AdminColsof', {
    id: 10001,
    nombre: 'AdminColsof',
    email: 'admincolsof@colsof.com.co',
    rol: 'Administrador',
    estado: 'Activo',
    ultimo: new Date().toISOString().replace('T', ' ').substring(0, 16),
    casosAsignados: 0
  });
  
  // Procesar casos
  casesData.forEach((caso) => {
    // Agregar técnico/asignado
    if (caso.asignado_a && caso.asignado_a !== 'Sin asignar') {
      if (!usuariosMap.has(caso.asignado_a)) {
        const rol = determineRole(caso.asignado_a);
        usuariosMap.set(caso.asignado_a, {
          id: 10000 + usuariosMap.size,
          nombre: caso.asignado_a,
          email: generateEmail(caso.asignado_a),
          rol: rol,
          estado: determineStatus(rol),
          ultimo: generateLastAccess(),
          casosAsignados: 0
        });
      }
      usuariosMap.get(caso.asignado_a).casosAsignados++;
    }
    
    // Agregar autor del caso si existe
    if (caso.autor && caso.autor !== 'Sistema' && caso.autor !== 'admin') {
      if (!usuariosMap.has(caso.autor)) {
        usuariosMap.set(caso.autor, {
          id: 10000 + usuariosMap.size,
          nombre: caso.autor,
          email: generateEmail(caso.autor),
          rol: 'Gestor',
          estado: 'Activo',
          ultimo: generateLastAccess(),
          casosAsignados: 0
        });
      }
    }
  });
  
  usuarios = Array.from(usuariosMap.values());
}

// Determinar rol automáticamente desde el nombre
function determineRole(nombre) {
  const nombreLower = nombre.toLowerCase();
  if (nombreLower.includes('técnico') || nombreLower.includes('tecnico')) return 'Técnico';
  if (nombreLower.includes('admin')) return 'Administrador';
  if (nombreLower.includes('gestor') || nombreLower.includes('manager')) return 'Gestor';
  return 'Técnico'; // Por defecto es técnico si viene de casos asignados
}

// Determinar estado según el rol
function determineStatus(rol) {
  return 'Activo'; // Todos los usuarios del sistema están activos
}

// Generar email automáticamente
function generateEmail(nombre) {
  return nombre.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '') + '@colsof.com.co';
}

// Generar último acceso aleatorio
function generateLastAccess() {
  const ahora = new Date();
  const minutosAtras = Math.floor(Math.random() * 480); // 0-8 horas
  ahora.setMinutes(ahora.getMinutes() - minutosAtras);
  return ahora.toISOString().replace('T', ' ').substring(0, 16);
}

// Actualizar KPIs
function updateKPIs() {
  const total = usuarios.length;
  const activos = usuarios.filter(u => u.estado === 'Activo').length;
  const inactivos = usuarios.filter(u => u.estado === 'Inactivo').length;
  const tecnicos = usuarios.filter(u => u.rol === 'Técnico').length;
  
  animateKPI(document.getElementById('total'), total);
  animateKPI(document.getElementById('activos'), activos);
  animateKPI(document.getElementById('inactivos'), inactivos);
  animateKPI(document.getElementById('tecnicos'), tecnicos);
}

// Animar cambio de KPI
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

// Obtener usuarios filtrados
function getFilteredUsers() {
  const searchTerm = search.value.toLowerCase();
  const roleFilter = filterRole.value;
  const statusFilter = filterStatus.value;
  
  return usuarios.filter(u => {
    const matchesSearch = !searchTerm || 
      u.nombre.toLowerCase().includes(searchTerm) ||
      u.email.toLowerCase().includes(searchTerm) ||
      u.id.toString().includes(searchTerm);
    
    const matchesRole = roleFilter === 'todos' || u.rol === roleFilter;
    const matchesStatus = statusFilter === 'todos' || u.estado === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });
}

// Renderizar tabla
function renderTable() {
  const filtrados = getFilteredUsers();
  tabla.innerHTML = '';

  if (filtrados.length === 0) {
    tabla.innerHTML = '<tr><td class="empty-row" colspan="6">No se encontraron usuarios con los filtros aplicados.</td></tr>';
    return;
  }

  filtrados.forEach((u, index) => {
    const roleClass = roleMap[u.rol] || 'role-neutral';
    const statusClass = statusMap[u.estado] || 'status-neutral';

    tabla.insertAdjacentHTML('beforeend', `
      <tr class="user-row" style="animation: slideInLeft 0.3s ease ${index * 0.05}s">
        <td>${u.id}</td>
        <td class="user-name">${u.nombre}</td>
        <td class="user-email">${u.email}</td>
        <td><span class="role-pill ${roleClass}"><span class="pill-dot"></span>${u.rol}</span></td>
        <td><span class="status-pill ${statusClass}"><span class="pill-dot"></span>${u.estado}</span></td>
        <td>${u.ultimo}</td>
      </tr>
    `);
  });
}

// Mostrar error
function showError(mensaje) {
  tabla.innerHTML = `<tr><td class="error-row" colspan="6" style="color: #dc2626; font-weight: 600; text-align: center; padding: 40px;">${mensaje}</td></tr>`;
}

// Event listeners para filtros
search.addEventListener('input', renderTable);
filterRole.addEventListener('change', renderTable);
filterStatus.addEventListener('change', renderTable);

// Exportar a CSV
function exportar() {
  const filtrados = getFilteredUsers();
  if (!filtrados.length) {
    showNotification('No hay usuarios para exportar con los filtros actuales.', 'info');
    return;
  }

  const header = ['ID', 'Usuario', 'Email', 'Rol', 'Estado', 'Último acceso', 'Casos Asignados'];
  const rows = filtrados.map(u => [
    u.id, 
    u.nombre, 
    u.email, 
    u.rol, 
    u.estado, 
    u.ultimo, 
    u.casosAsignados || 0
  ]);
  
  const csv = [header, ...rows].map(r => 
    r.map(cell => `"${cell}"`).join(',')
  ).join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const fecha = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `usuarios_${fecha}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification('CSV exportado exitosamente', 'success');
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
document.addEventListener('DOMContentLoaded', () => {
  loadDataFromAPI();
  startAutoRefresh();
});
