// Script para módulo de Centro de Costos - Usuario GESTOR
// Extrae centros de costos únicos de los casos existentes

// Estado de la aplicación
const state = {
    centros: [],
    filteredCentros: [],
    searchTerm: '',
    sortBy: 'nombre', // nombre, casos, presupuesto
    sortDirection: 'asc'
};

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    await loadCentrosCosto();
    setupEventListeners();
});

// Cargar centros de costo desde casos
async function loadCentrosCosto() {
    try {
        // Obtener todos los casos
        const casos = await api.getCasos();
        
        // Extraer centros de costo únicos
        const centrosMap = new Map();
        
        casos.forEach(caso => {
            const centroNombre = caso.centro_costos;
            if (!centroNombre || centroNombre.trim() === '') return;
            
            if (!centrosMap.has(centroNombre)) {
                centrosMap.set(centroNombre, {
                    nombre: centroNombre,
                    totalCasos: 0,
                    casosActivos: 0,
                    casosCerrados: 0,
                    prioridades: {
                        'Urgente': 0,
                        'Alta': 0,
                        'Media': 0,
                        'Baja': 0
                    },
                    clientes: new Set(),
                    ultimaActividad: caso.fecha_actualizacion || caso.fecha_creacion
                });
            }
            
            const centro = centrosMap.get(centroNombre);
            centro.totalCasos++;
            
            if (caso.estado === 'Cerrado') {
                centro.casosCerrados++;
            } else if (caso.estado !== 'Cancelado') {
                centro.casosActivos++;
            }
            
            // Contar por prioridad
            if (caso.prioridad && centro.prioridades.hasOwnProperty(caso.prioridad)) {
                centro.prioridades[caso.prioridad]++;
            }
            
            if (caso.cliente) centro.clientes.add(caso.cliente);
            
            // Actualizar fecha de última actividad
            const fechaCaso = new Date(caso.fecha_actualizacion || caso.fecha_creacion);
            const fechaActual = new Date(centro.ultimaActividad);
            if (fechaCaso > fechaActual) {
                centro.ultimaActividad = caso.fecha_actualizacion || caso.fecha_creacion;
            }
        });
        
        // Convertir a array
        state.centros = Array.from(centrosMap.values()).map(centro => ({
            ...centro,
            clientes: Array.from(centro.clientes)
        }));
        
        state.filteredCentros = [...state.centros];
        sortCentros();
        renderTable();
        updateStats();
        renderChart();
        
    } catch (error) {
        console.error('Error al cargar centros de costo:', error);
        utils.showToast('Error al cargar centros de costo', 'error');
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
            sortCentros();
            renderTable();
        });
    });

    // Botón de refrescar
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadCentrosCosto);
    }
}

// Aplicar filtros
function applyFilters() {
    state.filteredCentros = state.centros.filter(centro => {
        if (state.searchTerm) {
            const searchStr = centro.nombre.toLowerCase();
            if (!searchStr.includes(state.searchTerm)) {
                return false;
            }
        }
        return true;
    });

    sortCentros();
    renderTable();
    updateStats();
}

// Ordenar centros
function sortCentros() {
    state.filteredCentros.sort((a, b) => {
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

// Renderizar tabla de centros de costo
function renderTable() {
    const tbody = document.getElementById('centrosTableBody');
    if (!tbody) return;

    if (state.filteredCentros.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No se encontraron centros de costo</td></tr>';
        return;
    }

    tbody.innerHTML = state.filteredCentros.map((centro, index) => {
        const urgentes = centro.prioridades['Urgente'] || 0;
        
        return `
        <tr onclick="viewCentroDetails('${centro.nombre.replace(/'/g, "\\'")}')">
            <td>${index + 1}</td>
            <td>
                <div class="centro-name">${centro.nombre}</div>
                ${centro.clientes.length > 0 ? `<div class="centro-clientes">${centro.clientes.length} cliente${centro.clientes.length > 1 ? 's' : ''}</div>` : ''}
            </td>
            <td>${centro.totalCasos}</td>
            <td>
                <span class="badge badge-info">${centro.casosActivos}</span>
            </td>
            <td>
                <span class="badge badge-gray">${centro.casosCerrados}</span>
            </td>
            <td>
                ${urgentes > 0 ? `<span class="badge badge-danger">${urgentes}</span>` : '-'}
            </td>
            <td>${utils.timeAgo(centro.ultimaActividad)}</td>
        </tr>
        `;
    }).join('');
}

// Actualizar estadísticas
function updateStats() {
    const totalElement = document.getElementById('totalCentros');
    const activosElement = document.getElementById('centrosActivos');
    const totalCasosElement = document.getElementById('totalCasosCentros');

    if (totalElement) {
        totalElement.textContent = state.centros.length;
    }

    const conCasosActivos = state.centros.filter(c => c.casosActivos > 0).length;
    if (activosElement) {
        activosElement.textContent = conCasosActivos;
    }

    const totalCasos = state.centros.reduce((sum, c) => sum + c.totalCasos, 0);
    if (totalCasosElement) {
        totalCasosElement.textContent = totalCasos;
    }

    // Top centro con más casos
    const topCentro = [...state.centros].sort((a, b) => b.totalCasos - a.totalCasos)[0];
    const topElement = document.getElementById('topCentro');
    if (topElement && topCentro) {
        topElement.textContent = `${topCentro.nombre} (${topCentro.totalCasos} casos)`;
    }
}

// Renderizar gráfico de distribución
function renderChart() {
    const container = document.getElementById('centrosChart');
    if (!container) return;

    // Tomar los top 10 centros por casos
    const topCentros = [...state.centros]
        .sort((a, b) => b.totalCasos - a.totalCasos)
        .slice(0, 10);

    if (topCentros.length === 0) {
        container.innerHTML = '<p class="empty-message">No hay datos para mostrar</p>';
        return;
    }

    const maxCasos = topCentros[0].totalCasos;

    let html = '<div class="chart-bars">';
    
    topCentros.forEach(centro => {
        const porcentaje = (centro.totalCasos / maxCasos) * 100;
        
        html += `
            <div class="chart-bar-item">
                <div class="chart-label">${centro.nombre}</div>
                <div class="chart-bar-container">
                    <div class="chart-bar" style="width: ${porcentaje}%">
                        <span class="chart-value">${centro.totalCasos}</span>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// Ver detalles del centro de costo
async function viewCentroDetails(centroNombre) {
    try {
        // Obtener casos del centro de costo
        const casos = await api.getCasos();
        const casosCentro = casos.filter(c => c.centro_costos === centroNombre);
        const centro = state.centros.find(c => c.nombre === centroNombre);
        
        if (!centro) return;

        // Mostrar modal con detalles
        showCentroModal(centro, casosCentro);
    } catch (error) {
        console.error('Error al cargar detalles del centro:', error);
        utils.showToast('Error al cargar detalles del centro', 'error');
    }
}

// Mostrar modal de centro de costo
function showCentroModal(centro, casos) {
    const modal = document.getElementById('centroModal');
    if (!modal) return;

    // Actualizar contenido del modal
    document.getElementById('modalCentroName').textContent = centro.nombre;
    document.getElementById('modalTotalCasos').textContent = centro.totalCasos;
    document.getElementById('modalCasosActivos').textContent = centro.casosActivos;
    document.getElementById('modalCasosCerrados').textContent = centro.casosCerrados;

    // Distribución por prioridad
    const prioridadesContainer = document.getElementById('modalPrioridades');
    if (prioridadesContainer) {
        const prioridades = ['Urgente', 'Alta', 'Media', 'Baja'];
        prioridadesContainer.innerHTML = prioridades.map(p => {
            const count = centro.prioridades[p] || 0;
            const color = utils.getPriorityColor(p);
            return `
                <div class="priority-stat">
                    <span class="priority-label" style="color: ${color}">${p}</span>
                    <span class="priority-count">${count}</span>
                </div>
            `;
        }).join('');
    }

    // Lista de clientes
    const clientesContainer = document.getElementById('modalClientes');
    if (clientesContainer) {
        clientesContainer.innerHTML = centro.clientes.length > 0
            ? centro.clientes.map(cliente => `<span class="cliente-badge">${cliente}</span>`).join('')
            : '<span class="text-muted">Sin clientes registrados</span>';
    }

    // Casos recientes
    const casosContainer = document.getElementById('modalCasos');
    if (casosContainer) {
        const casosRecientes = casos.slice(0, 5);
        casosContainer.innerHTML = casosRecientes.map(caso => `
            <div class="caso-item">
                <div class="caso-id">${utils.formatCaseId(caso.id)}</div>
                <div class="caso-desc">${caso.descripcion?.substring(0, 50) || 'Sin descripción'}...</div>
                <div class="caso-prioridad">
                    <span class="badge" style="background-color: ${utils.getPriorityColor(caso.prioridad)}">
                        ${caso.prioridad}
                    </span>
                </div>
            </div>
        `).join('');
    }

    // Mostrar modal
    modal.classList.add('show');
}

// Cerrar modal
function closeCentroModal() {
    const modal = document.getElementById('centroModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Exportar funciones globales
window.viewCentroDetails = viewCentroDetails;
window.closeCentroModal = closeCentroModal;
