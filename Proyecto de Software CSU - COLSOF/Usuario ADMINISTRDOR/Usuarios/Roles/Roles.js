// API Configuration
const API_URL = 'http://localhost:3001/api';

let editingRole = null;
let roles = [];
let usersData = [];
let casesData = [];

// Definición de permisos
const permisos = [
  { key: 'crear_usuarios', label: 'Crear usuarios', cat: 'Usuarios' },
  { key: 'editar_usuarios', label: 'Editar usuarios', cat: 'Usuarios' },
  { key: 'eliminar_usuarios', label: 'Eliminar usuarios', cat: 'Usuarios' },
  { key: 'gestionar_casos', label: 'Gestionar casos', cat: 'Casos' },
  { key: 'asignar_casos', label: 'Asignar casos', cat: 'Casos' },
  { key: 'resolver_casos', label: 'Resolver casos', cat: 'Casos' },
  { key: 'ver_reportes', label: 'Ver reportes', cat: 'Reportes' },
  { key: 'generar_reportes', label: 'Generar reportes', cat: 'Reportes' },
  { key: 'acceso_bd', label: 'Acceso BD', cat: 'Sistema' },
  { key: 'ver_estadisticas', label: 'Ver estadísticas', cat: 'Sistema' },
  { key: 'auditar_sistema', label: 'Auditar sistema', cat: 'Sistema' }
];

// Matriz de permisos predefinida por rol
const permisosBase = {
  'Administrador': {
    crear_usuarios: true, editar_usuarios: true, eliminar_usuarios: true,
    gestionar_casos: true, asignar_casos: true, resolver_casos: true,
    ver_reportes: true, generar_reportes: true, acceso_bd: true,
    ver_estadisticas: true, auditar_sistema: true
  },
  'Gestor': {
    crear_usuarios: false, editar_usuarios: false, eliminar_usuarios: false,
    gestionar_casos: true, asignar_casos: true, resolver_casos: true,
    ver_reportes: true, generar_reportes: true, acceso_bd: false,
    ver_estadisticas: true, auditar_sistema: false
  },
  'Técnico': {
    crear_usuarios: false, editar_usuarios: false, eliminar_usuarios: false,
    gestionar_casos: false, asignar_casos: false, resolver_casos: true,
    ver_reportes: false, generar_reportes: false, acceso_bd: false,
    ver_estadisticas: false, auditar_sistema: false
  },
  'Empleado': {
    crear_usuarios: false, editar_usuarios: false, eliminar_usuarios: false,
    gestionar_casos: false, asignar_casos: false, resolver_casos: false,
    ver_reportes: false, generar_reportes: false, acceso_bd: false,
    ver_estadisticas: false, auditar_sistema: false
  }
};

// Matriz de permisos editable
let matriz = {};

// Cargar datos desde la API
async function loadDataFromAPI() {
  try {
    const response = await fetch(`${API_URL}?action=get_casos_simple`);
    if (!response.ok) throw new Error('Error al cargar datos');
    
    const data = await response.json();
    casesData = data.cases || [];
    
    // Extraer usuarios y contar por rol
    extractUsersAndBuildRoles();
    
    console.log('✓ Datos cargados:', roles.length, 'roles');
    renderRoles();
    
  } catch (error) {
    console.error('Error al cargar datos:', error);
    showError('No se pudieron cargar los roles. Verifique la conexión.');
  }
}

// Extraer usuarios y construir roles dinámicos
function extractUsersAndBuildRoles() {
  const usersMap = new Map();
  const roleColors = {
    'Administrador': 'role-red',
    'Gestor': 'role-blue',
    'Técnico': 'role-purple',
    'Empleado': 'role-slate'
  };
  
  // Procesar casos para extraer usuarios
  casesData.forEach(caso => {
    if (caso.asignado_a && caso.asignado_a !== 'Sin asignar') {
      if (!usersMap.has(caso.asignado_a)) {
        usersMap.set(caso.asignado_a, {
          nombre: caso.asignado_a,
          rol: 'Técnico'
        });
      }
    }
    if (caso.autor && caso.autor !== 'Sistema') {
      if (!usersMap.has(caso.autor)) {
        usersMap.set(caso.autor, {
          nombre: caso.autor,
          rol: 'Gestor'
        });
      }
    }
  });
  
  // Agregar admin
  usersMap.set('AdminColsof', {
    nombre: 'AdminColsof',
    rol: 'Administrador'
  });
  
  usersData = Array.from(usersMap.values());
  
  // Contar usuarios por rol
  const roleCounts = {};
  Object.keys(permisosBase).forEach(roleName => {
    roleCounts[roleName] = usersData.filter(u => u.rol === roleName).length;
  });
  
  // Construir roles dinámicos
  roles = Object.keys(permisosBase).map((roleName, idx) => ({
    id: idx + 1,
    nombre: roleName,
    color: roleColors[roleName] || 'role-slate',
    usuarios: roleCounts[roleName] || 0
  }));
  
  // Inicializar matriz de permisos
  roles.forEach(role => {
    matriz[role.id] = { ...permisosBase[role.nombre] };
  });
}

// Renderizar roles
function renderRoles() {
  const cont = document.getElementById('roles');
  cont.innerHTML = '';
  
  roles.forEach((r, idx) => {
    const perms = Object.values(matriz[r.id]).filter(Boolean).length;
    const rowHTML = `
      <div class="role-card" style="animation: slideInUp 0.3s ease ${idx * 0.1}s">
        <div class="role-head ${r.color}">
          <div>
            <div class="role-name">${r.nombre}</div>
            <div class="role-users">${r.usuarios} usuario${r.usuarios !== 1 ? 's' : ''}</div>
          </div>
          <div class="role-actions">
            <button class="btn" data-role="${r.id}" aria-label="Editar rol">Editar</button>
          </div>
        </div>
        <div class="role-body">
          <div class="role-perms">${perms} permisos <small>activos</small></div>
        </div>
      </div>
    `;
    cont.insertAdjacentHTML('beforeend', rowHTML);
  });

  cont.querySelectorAll('.role-actions .btn').forEach(btn => {
    btn.addEventListener('click', () => editRole(Number(btn.dataset.role)));
  });
}

// Editar rol
function editRole(id) {
  editingRole = id;
  document.getElementById('editAlert').classList.remove('hidden');
  document.getElementById('acciones').classList.remove('hidden');
  renderPermisos();
  
  // Scroll a la sección de permisos
  document.getElementById('permisos').scrollIntoView({ behavior: 'smooth' });
}

// Renderizar matriz de permisos
function renderPermisos() {
  const cont = document.getElementById('permisos');
  cont.innerHTML = '<div class="card-header"><div><div class="card-title">Matriz de permisos</div><div class="card-subtitle">Configura los permisos para cada rol</div></div></div>';

  const categorias = [...new Set(permisos.map(p => p.cat))];

  categorias.forEach(cat => {
    let html = `<div class="perms-category"><h3>${cat}</h3><table><thead><tr><th>Permiso</th>`;
    roles.forEach(r => html += `<th>${r.nombre}</th>`);
    html += `</tr></thead><tbody>`;

    permisos.filter(p => p.cat === cat).forEach(p => {
      html += `<tr>
        <td class="perm-label">${p.label}</td>`;
      roles.forEach(r => {
        const activo = matriz[r.id][p.key];
        const disabled = editingRole !== r.id ? 'disabled' : '';
        html += `
          <td>
            <button class="perm-toggle ${activo ? 'active' : ''} ${disabled}"
              data-role="${r.id}"
              data-perm="${p.key}"
              onclick="togglePerm(${r.id},'${p.key}')">
              ${activo ? '✓' : '✗'}
            </button>
          </td>`;
      });
      html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    cont.insertAdjacentHTML('beforeend', html);
  });
}

// Alternar permiso
function togglePerm(roleId, key) {
  if (editingRole !== roleId) return;
  matriz[roleId][key] = !matriz[roleId][key];
  renderPermisos();
}

// Cancelar edición
function cancelarEdicion() {
  editingRole = null;
  document.getElementById('editAlert').classList.add('hidden');
  document.getElementById('acciones').classList.add('hidden');
  document.getElementById('permisos').innerHTML = '';
  renderRoles();
}

// Guardar cambios
function guardarCambios() {
  editingRole = null;
  document.getElementById('editAlert').classList.add('hidden');
  document.getElementById('acciones').classList.add('hidden');
  document.getElementById('permisos').innerHTML = '';
  
  showNotification('Permisos guardados correctamente', 'success');
  renderRoles();
}

// Crear nuevo rol
function crearNuevoRol() {
  const nombre = prompt('Ingresa el nombre del nuevo rol:');
  if (!nombre) return;
  
  // Validar que no exista
  if (roles.some(r => r.nombre.toLowerCase() === nombre.toLowerCase())) {
    showNotification('Este rol ya existe', 'error');
    return;
  }
  
  const nuevoId = Math.max(...roles.map(r => r.id), 0) + 1;
  const nuevoRol = {
    id: nuevoId,
    nombre: nombre,
    color: 'role-slate',
    usuarios: 0
  };
  
  roles.push(nuevoRol);
  matriz[nuevoId] = {};
  permisos.forEach(p => {
    matriz[nuevoId][p.key] = false;
  });
  
  renderRoles();
  showNotification(`Rol "${nombre}" creado exitosamente`, 'success');
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

// Mostrar error
function showError(mensaje) {
  const cont = document.getElementById('roles');
  cont.innerHTML = `<div style="color: #dc2626; font-weight: 600; text-align: center; padding: 40px;">${mensaje}</div>`;
}

// Configurar event listeners
function setupEventListeners() {
  const btnCrear = document.getElementById('btnCrear');
  if (btnCrear) btnCrear.addEventListener('click', crearNuevoRol);
  
  const btnCancelar = document.getElementById('btnCancelar');
  if (btnCancelar) btnCancelar.addEventListener('click', cancelarEdicion);
  
  const btnGuardar = document.getElementById('btnGuardar');
  if (btnGuardar) btnGuardar.addEventListener('click', guardarCambios);
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
