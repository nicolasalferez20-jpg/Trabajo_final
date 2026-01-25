// Script para Lista de Usuarios - Usuario ADMINISTRADOR
// Usa API compartido para gestión de usuarios

// Estado de la aplicación
const state = {
    usuarios: [],
    filteredUsuarios: [],
    currentFilter: 'todos', // todos, activos, inactivos
    currentRole: 'todos', // todos, administrador, gestor, tecnico
    searchTerm: '',
    selectedUser: null,
    sortColumn: null,
    sortDirection: 'asc'
};

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    await loadUsers();
    setupEventListeners();
});

// Cargar usuarios desde el API
async function loadUsers() {
    try {
        // Usar API client compartido
        const usuarios = await api.getUsuarios();
        state.usuarios = usuarios;
        state.filteredUsuarios = [...usuarios];
        
        renderTable();
        updateStats();
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        utils.showToast('Error al cargar usuarios', 'error');
        
        const tbody = document.getElementById('usersTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7">Error al cargar usuarios</td></tr>';
        }
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Botones de filtro por rol
    const filterButtons = document.querySelectorAll('[data-role-filter]');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            state.currentRole = btn.dataset.roleFilter;
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
    });

    // Botones de filtro por estado
    const statusButtons = document.querySelectorAll('[data-status-filter]');
    statusButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            state.currentFilter = btn.dataset.statusFilter;
            statusButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
    });

    // Barra de búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchTerm = e.target.value.toLowerCase();
            applyFilters();
        });
    }

    // Botón de agregar usuario
    const addBtn = document.getElementById('addUserBtn');
    if (addBtn) {
        addBtn.addEventListener('click', openCreateUserModal);
    }

    // Botón de refrescar
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadUsers);
    }
}

// Aplicar filtros
function applyFilters() {
    state.filteredUsuarios = state.usuarios.filter(user => {
        // Filtro por rol
        if (state.currentRole !== 'todos' && user.rol !== state.currentRole) {
            return false;
        }

        // Filtro por estado
        if (state.currentFilter === 'activos' && !user.activo) {
            return false;
        }
        if (state.currentFilter === 'inactivos' && user.activo) {
            return false;
        }

        // Búsqueda por texto
        if (state.searchTerm) {
            const searchStr = `${user.nombre} ${user.apellido} ${user.email}`.toLowerCase();
            if (!searchStr.includes(state.searchTerm)) {
                return false;
            }
        }

        return true;
    });

    renderTable();
    updateStats();
}

// Renderizar tabla de usuarios
function renderTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (state.filteredUsuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No se encontraron usuarios</td></tr>';
        return;
    }

    tbody.innerHTML = state.filteredUsuarios.map(user => `
        <tr onclick="selectUser(${user.id})">
            <td>${user.id}</td>
            <td>
                <div class="user-info">
                    <div class="user-avatar">${getInitials(user.nombre, user.apellido)}</div>
                    <div>
                        <div class="user-name">${user.nombre} ${user.apellido}</div>
                        <div class="user-email">${user.email}</div>
                    </div>
                </div>
            </td>
            <td>
                <span class="role-badge role-${user.rol}">${getRoleLabel(user.rol)}</span>
            </td>
            <td>
                <span class="status-badge ${user.activo ? 'status-active' : 'status-inactive'}">
                    ${user.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>${utils.formatDate(user.fecha_creacion)}</td>
            <td>${user.fecha_actualizacion ? utils.formatDate(user.fecha_actualizacion) : '-'}</td>
            <td>
                <div class="actions">
                    <button class="btn-icon" onclick="editUser(${user.id}, event)" title="Editar">
                        ✏️
                    </button>
                    <button class="btn-icon" onclick="toggleUserStatus(${user.id}, event)" title="${user.activo ? 'Desactivar' : 'Activar'}">
                        ${user.activo ? '🔒' : '🔓'}
                    </button>
                    <button class="btn-icon" onclick="deleteUser(${user.id}, event)" title="Eliminar">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Actualizar estadísticas
function updateStats() {
    const totalElement = document.getElementById('totalUsers');
    const activosElement = document.getElementById('activeUsers');
    const inactivosElement = document.getElementById('inactiveUsers');
    const filteredElement = document.getElementById('filteredUsers');

    if (totalElement) totalElement.textContent = state.usuarios.length;
    if (filteredElement) filteredElement.textContent = state.filteredUsuarios.length;

    const activos = state.usuarios.filter(u => u.activo).length;
    if (activosElement) activosElement.textContent = activos;
    if (inactivosElement) inactivosElement.textContent = state.usuarios.length - activos;

    // Estadísticas por rol
    const roles = { administrador: 0, gestor: 0, tecnico: 0 };
    state.usuarios.forEach(u => {
        if (roles.hasOwnProperty(u.rol)) {
            roles[u.rol]++;
        }
    });

    const adminElement = document.getElementById('adminCount');
    const gestorElement = document.getElementById('gestorCount');
    const tecnicoElement = document.getElementById('tecnicoCount');

    if (adminElement) adminElement.textContent = roles.administrador;
    if (gestorElement) gestorElement.textContent = roles.gestor;
    if (tecnicoElement) tecnicoElement.textContent = roles.tecnico;
}

// Seleccionar usuario
function selectUser(userId) {
    const user = state.usuarios.find(u => u.id === userId);
    if (user) {
        state.selectedUser = user;
        showUserDetails(user);
    }
}

// Mostrar detalles del usuario
function showUserDetails(user) {
    // Implementar modal o panel lateral con detalles del usuario
    console.log('Detalles del usuario:', user);
}

// Editar usuario
async function editUser(userId, event) {
    if (event) event.stopPropagation();
    
    const user = state.usuarios.find(u => u.id === userId);
    if (!user) return;

    // Mostrar modal de edición (implementar según diseño)
    const nombre = prompt('Nombre:', user.nombre);
    if (!nombre) return;

    const apellido = prompt('Apellido:', user.apellido);
    if (!apellido) return;

    try {
        const updated = await api.actualizarUsuario(userId, {
            nombre,
            apellido
        });

        utils.showToast('Usuario actualizado correctamente');
        await loadUsers();
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        utils.showToast('Error al actualizar usuario', 'error');
    }
}

// Cambiar estado del usuario
async function toggleUserStatus(userId, event) {
    if (event) event.stopPropagation();

    const user = state.usuarios.find(u => u.id === userId);
    if (!user) return;

    const action = user.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿Está seguro de ${action} este usuario?`)) return;

    try {
        await api.actualizarUsuario(userId, {
            activo: !user.activo
        });

        utils.showToast(`Usuario ${action}do correctamente`);
        await loadUsers();
    } catch (error) {
        console.error('Error al cambiar estado del usuario:', error);
        utils.showToast('Error al cambiar estado del usuario', 'error');
    }
}

// Eliminar usuario
async function deleteUser(userId, event) {
    if (event) event.stopPropagation();

    if (!confirm('¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        // Nota: El API actual no tiene endpoint de DELETE, implementar si es necesario
        utils.showToast('Funcionalidad de eliminación pendiente de implementar');
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        utils.showToast('Error al eliminar usuario', 'error');
    }
}

// Abrir modal de crear usuario
function openCreateUserModal() {
    // Implementar según diseño del modal
    const nombre = prompt('Nombre del nuevo usuario:');
    if (!nombre) return;

    const apellido = prompt('Apellido:');
    if (!apellido) return;

    const email = prompt('Email:');
    if (!email) return;

    const rol = prompt('Rol (administrador/gestor/tecnico):');
    if (!rol || !['administrador', 'gestor', 'tecnico'].includes(rol)) {
        utils.showToast('Rol inválido', 'error');
        return;
    }

    createUser({ nombre, apellido, email, rol });
}

// Crear nuevo usuario
async function createUser(userData) {
    try {
        const newUser = await api.crearUsuario({
            ...userData,
            password: 'temporal123', // Contraseña temporal
            activo: true
        });

        utils.showToast('Usuario creado correctamente');
        await loadUsers();
    } catch (error) {
        console.error('Error al crear usuario:', error);
        utils.showToast('Error al crear usuario', 'error');
    }
}

// Utilidades
function getInitials(nombre, apellido) {
    const n = (nombre || '').charAt(0).toUpperCase();
    const a = (apellido || '').charAt(0).toUpperCase();
    return n + a;
}

function getRoleLabel(rol) {
    const labels = {
        'administrador': 'Administrador',
        'gestor': 'Gestor',
        'tecnico': 'Técnico'
    };
    return labels[rol] || rol;
}

// Exportar funciones globales
window.selectUser = selectUser;
window.editUser = editUser;
window.toggleUserStatus = toggleUserStatus;
window.deleteUser = deleteUser;
