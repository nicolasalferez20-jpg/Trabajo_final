// Script para módulo de Clientes - Usuario GESTOR
// Extrae clientes únicos de los casos existentes

// Estado de la aplicación
const state = {
    clientes: [],
    filteredClientes: [],
    searchTerm: '',
    sortBy: 'nombre', // nombre, casos, ultima_actividad
    sortDirection: 'asc'
};

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    await loadClientes();
    setupEventListeners();
});

// Cargar clientes desde casos
async function loadClientes() {
    try {
        // Obtener todos los casos
        const casos = await api.getCasos();
        
        // Extraer clientes únicos
        const clientesMap = new Map();
        
        casos.forEach(caso => {
            const clienteNombre = caso.cliente;
            if (!clienteNombre || clienteNombre.trim() === '') return;
            
            if (!clientesMap.has(clienteNombre)) {
                clientesMap.set(clienteNombre, {
                    nombre: clienteNombre,
                    sedes: new Set(),
                    totalCasos: 0,
                    casosActivos: 0,
                    casosCerrados: 0,
                    ultimaActividad: caso.fecha_actualizacion || caso.fecha_creacion,
                    contactos: new Set()
                });
            }
            
            const cliente = clientesMap.get(clienteNombre);
            cliente.totalCasos++;
            
            if (caso.estado === 'Cerrado') {
                cliente.casosCerrados++;
            } else if (caso.estado !== 'Cancelado') {
                cliente.casosActivos++;
            }
            
            if (caso.sede) cliente.sedes.add(caso.sede);
            if (caso.contacto) cliente.contactos.add(caso.contacto);
            
            // Actualizar fecha de última actividad
            const fechaCaso = new Date(caso.fecha_actualizacion || caso.fecha_creacion);
            const fechaActual = new Date(cliente.ultimaActividad);
            if (fechaCaso > fechaActual) {
                cliente.ultimaActividad = caso.fecha_actualizacion || caso.fecha_creacion;
            }
        });
        
        // Convertir a array
        state.clientes = Array.from(clientesMap.values()).map(cliente => ({
            ...cliente,
            sedes: Array.from(cliente.sedes),
            contactos: Array.from(cliente.contactos)
        }));
        
        state.filteredClientes = [...state.clientes];
        sortClientes();
        renderTable();
        updateStats();
        
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        utils.showToast('Error al cargar clientes', 'error');
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Barra de búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchTerm = e.target.value.toLowerCase();
            applyFilters();
        });
    }

    // Botones de ordenamiento
    const sortButtons = document.querySelectorAll('[data-sort]');
    sortButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const sortBy = btn.dataset.sort;
            if (state.sortBy === sortBy) {
                state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                state.sortBy = sortBy;
                state.sortDirection = 'asc';
            }
            sortClientes();
            renderTable();
        });
    });

    // Botón de refrescar
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadClientes);
    }
}

// Aplicar filtros
function applyFilters() {
    state.filteredClientes = state.clientes.filter(cliente => {
        if (state.searchTerm) {
            const searchStr = `${cliente.nombre} ${cliente.sedes.join(' ')}`.toLowerCase();
            if (!searchStr.includes(state.searchTerm)) {
                return false;
            }
        }
        return true;
    });

    sortClientes();
    renderTable();
    updateStats();
}

// Ordenar clientes
function sortClientes() {
    state.filteredClientes.sort((a, b) => {
        let compareA, compareB;

        switch (state.sortBy) {
            case 'nombre':
                compareA = a.nombre.toLowerCase();
                compareB = b.nombre.toLowerCase();
                break;
            case 'casos':
                compareA = a.totalCasos;
                compareB = b.totalCasos;
                break;
            case 'ultima_actividad':
                compareA = new Date(a.ultimaActividad);
                compareB = new Date(b.ultimaActividad);
                break;
            default:
                return 0;
        }

        if (compareA < compareB) return state.sortDirection === 'asc' ? -1 : 1;
        if (compareA > compareB) return state.sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
}

// Renderizar tabla de clientes
function renderTable() {
    const tbody = document.getElementById('clientesTableBody');
    if (!tbody) return;

    if (state.filteredClientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No se encontraron clientes</td></tr>';
        return;
    }

    tbody.innerHTML = state.filteredClientes.map((cliente, index) => `
        <tr onclick="viewClientDetails('${cliente.nombre.replace(/'/g, "\\'")}')">
            <td>${index + 1}</td>
            <td>
                <div class="client-name">${cliente.nombre}</div>
                ${cliente.sedes.length > 0 ? `<div class="client-sedes">${cliente.sedes.length} sede${cliente.sedes.length > 1 ? 's' : ''}</div>` : ''}
            </td>
            <td>${cliente.totalCasos}</td>
            <td>
                <span class="badge badge-success">${cliente.casosActivos}</span>
            </td>
            <td>
                <span class="badge badge-gray">${cliente.casosCerrados}</span>
            </td>
            <td>${utils.timeAgo(cliente.ultimaActividad)}</td>
        </tr>
    `).join('');
}

// Actualizar estadísticas
function updateStats() {
    const totalElement = document.getElementById('totalClientes');
    const activosElement = document.getElementById('clientesActivos');
    const totalCasosElement = document.getElementById('totalCasosClientes');

    if (totalElement) {
        totalElement.textContent = state.clientes.length;
    }

    const conCasosActivos = state.clientes.filter(c => c.casosActivos > 0).length;
    if (activosElement) {
        activosElement.textContent = conCasosActivos;
    }

    const totalCasos = state.clientes.reduce((sum, c) => sum + c.totalCasos, 0);
    if (totalCasosElement) {
        totalCasosElement.textContent = totalCasos;
    }

    // Mostrar resultados filtrados
    const filteredElement = document.getElementById('filteredCount');
    if (filteredElement) {
        filteredElement.textContent = `${state.filteredClientes.length} de ${state.clientes.length}`;
    }
}

// Ver detalles del cliente
async function viewClientDetails(clienteNombre) {
    try {
        // Obtener casos del cliente
        const casos = await api.getCasos({ cliente: clienteNombre });
        const cliente = state.clientes.find(c => c.nombre === clienteNombre);
        
        if (!cliente) return;

        // Mostrar modal con detalles
        showClientModal(cliente, casos);
    } catch (error) {
        console.error('Error al cargar detalles del cliente:', error);
        utils.showToast('Error al cargar detalles del cliente', 'error');
    }
}

// Mostrar modal de cliente
function showClientModal(cliente, casos) {
    const modal = document.getElementById('clientModal');
    if (!modal) return;

    // Actualizar contenido del modal
    document.getElementById('modalClientName').textContent = cliente.nombre;
    document.getElementById('modalTotalCasos').textContent = cliente.totalCasos;
    document.getElementById('modalCasosActivos').textContent = cliente.casosActivos;
    document.getElementById('modalCasosCerrados').textContent = cliente.casosCerrados;

    // Lista de sedes
    const sedesContainer = document.getElementById('modalSedes');
    if (sedesContainer) {
        sedesContainer.innerHTML = cliente.sedes.length > 0
            ? cliente.sedes.map(sede => `<span class="sede-badge">${sede}</span>`).join('')
            : '<span class="text-muted">Sin sedes registradas</span>';
    }

    // Lista de contactos
    const contactosContainer = document.getElementById('modalContactos');
    if (contactosContainer) {
        contactosContainer.innerHTML = cliente.contactos.length > 0
            ? cliente.contactos.map(contacto => `<div class="contacto-item">${contacto}</div>`).join('')
            : '<span class="text-muted">Sin contactos registrados</span>';
    }

    // Lista de casos recientes
    const casosContainer = document.getElementById('modalCasos');
    if (casosContainer) {
        const casosRecientes = casos.slice(0, 5);
        casosContainer.innerHTML = casosRecientes.map(caso => `
            <div class="caso-item">
                <div class="caso-id">${utils.formatCaseId(caso.id)}</div>
                <div class="caso-desc">${caso.descripcion?.substring(0, 50) || 'Sin descripción'}...</div>
                <div class="caso-estado">
                    <span class="badge" style="background-color: ${utils.getStatusColor(caso.estado)}">
                        ${caso.estado}
                    </span>
                </div>
            </div>
        `).join('');
    }

    // Mostrar modal
    modal.classList.add('show');
}

// Cerrar modal
function closeClientModal() {
    const modal = document.getElementById('clientModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Exportar funciones globales
window.viewClientDetails = viewClientDetails;
window.closeClientModal = closeClientModal;
