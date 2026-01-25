// Script mejorado para Estadísticas del Gestor usando API compartido

// Verificar que api esté disponible
if (!window.api) {
    console.error('API client no disponible. Asegúrese de incluir app-init.js');
}

// Estado de la aplicación
const state = {
    casos: [],
    usuarios: [],
    estadisticas: null,
    loading: false
};

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    await loadDashboardData();
    setupAutoRefresh();
});

// Cargar datos del dashboard
async function loadDashboardData() {
    if (state.loading) return;
    
    state.loading = true;
    showLoadingIndicator();

    try {
        // Cargar estadísticas desde el API
        const stats = await api.getEstadisticas();
        state.estadisticas = stats;

        // Cargar casos y usuarios adicionales si es necesario
        const [casos, usuarios] = await Promise.all([
            api.getCasos(),
            api.getUsuarios()
        ]);
        
        state.casos = casos;
        state.usuarios = usuarios;

        // Renderizar dashboard
        renderGeneralStats(stats);
        renderCasesByStatus(stats);
        renderCasesByPriority(stats);
        renderTopTechnicians(stats);
        renderRecentActivity();
        
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        utils.showToast('Error al cargar las estadísticas', 'error');
    } finally {
        state.loading = false;
        hideLoadingIndicator();
    }
}

// Renderizar estadísticas generales
function renderGeneralStats(stats) {
    // Total de casos
    const totalElement = document.getElementById('total-casos');
    if (totalElement) {
        totalElement.textContent = stats.total_casos || 0;
    }

    // Casos activos
    const activosElement = document.getElementById('casos-activos');
    if (activosElement) {
        activosElement.textContent = stats.casos_activos || 0;
    }

    // Casos sin asignar
    const sinAsignarElement = document.getElementById('casos-sin-asignar');
    if (sinAsignarElement) {
        const sinAsignar = stats.por_estado?.['Sin Asignar'] || 0;
        sinAsignarElement.textContent = sinAsignar;
    }

    // Casos urgentes
    const urgentesElement = document.getElementById('casos-urgentes');
    if (urgentesElement) {
        const urgentes = stats.por_prioridad?.['Urgente'] || 0;
        urgentesElement.textContent = urgentes;
    }

    // Tasa de resolución
    const tasaElement = document.getElementById('tasa-resolucion');
    if (tasaElement) {
        const cerrados = stats.por_estado?.['Cerrado'] || 0;
        const total = stats.total_casos || 1;
        const tasa = ((cerrados / total) * 100).toFixed(1);
        tasaElement.textContent = `${tasa}%`;
    }
}

// Renderizar casos por estado (gráfico de barras o lista)
function renderCasesByStatus(stats) {
    const container = document.getElementById('casos-por-estado');
    if (!container) return;

    const estados = stats.por_estado || {};
    let html = '<div class="stats-list">';

    for (const [estado, cantidad] of Object.entries(estados)) {
        const color = getStatusColor(estado);
        const porcentaje = ((cantidad / stats.total_casos) * 100).toFixed(0);

        html += `
            <div class="stat-item">
                <div class="stat-label">
                    <span class="status-badge" style="background-color: ${color}"></span>
                    ${estado}
                </div>
                <div class="stat-bar">
                    <div class="stat-bar-fill" style="width: ${porcentaje}%; background-color: ${color}"></div>
                </div>
                <div class="stat-value">${cantidad}</div>
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;
}

// Renderizar casos por prioridad
function renderCasesByPriority(stats) {
    const container = document.getElementById('casos-por-prioridad');
    if (!container) return;

    const prioridades = stats.por_prioridad || {};
    let html = '<div class="priority-stats">';

    const orden = ['Urgente', 'Alta', 'Media', 'Baja'];
    
    for (const prioridad of orden) {
        const cantidad = prioridades[prioridad] || 0;
        const color = utils.getPriorityColor(prioridad);

        html += `
            <div class="priority-card" style="border-left: 4px solid ${color}">
                <div class="priority-name">${prioridad}</div>
                <div class="priority-count">${cantidad}</div>
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;
}

// Renderizar top técnicos
function renderTopTechnicians(stats) {
    const container = document.getElementById('top-tecnicos');
    if (!container) return;

    const tecnicos = stats.por_tecnico || {};
    
    // Convertir a array y ordenar por cantidad de casos
    const tecnicosArray = Object.entries(tecnicos)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5); // Top 5

    if (tecnicosArray.length === 0) {
        container.innerHTML = '<p class="empty-message">No hay técnicos con casos asignados</p>';
        return;
    }

    let html = '<div class="technician-list">';

    tecnicosArray.forEach((tecnico, index) => {
        const maxCasos = tecnicosArray[0].cantidad;
        const porcentaje = (tecnico.cantidad / maxCasos) * 100;

        html += `
            <div class="technician-item">
                <div class="tech-rank">#${index + 1}</div>
                <div class="tech-info">
                    <div class="tech-name">${tecnico.nombre || 'Sin asignar'}</div>
                    <div class="tech-bar">
                        <div class="tech-bar-fill" style="width: ${porcentaje}%"></div>
                    </div>
                </div>
                <div class="tech-count">${tecnico.cantidad}</div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// Renderizar actividad reciente
function renderRecentActivity() {
    const container = document.getElementById('actividad-reciente');
    if (!container) return;

    // Obtener los últimos 10 casos creados o modificados
    const recentCases = [...state.casos]
        .sort((a, b) => {
            const dateA = new Date(a.fecha_actualizacion || a.fecha_creacion);
            const dateB = new Date(b.fecha_actualizacion || b.fecha_creacion);
            return dateB - dateA;
        })
        .slice(0, 10);

    if (recentCases.length === 0) {
        container.innerHTML = '<p class="empty-message">No hay actividad reciente</p>';
        return;
    }

    let html = '<div class="activity-list">';

    recentCases.forEach(caso => {
        const caseId = utils.formatCaseId(caso.id);
        const fecha = utils.timeAgo(caso.fecha_actualizacion || caso.fecha_creacion);
        const statusColor = utils.getStatusColor(caso.estado);

        html += `
            <div class="activity-item">
                <div class="activity-icon" style="background-color: ${statusColor}"></div>
                <div class="activity-content">
                    <div class="activity-title">
                        <strong>${caseId}</strong> - ${caso.descripcion?.substring(0, 50) || 'Sin descripción'}...
                    </div>
                    <div class="activity-meta">
                        <span>${caso.estado}</span>
                        <span>•</span>
                        <span>${fecha}</span>
                        ${caso.asignado_a ? `<span>•</span><span>${caso.asignado_a}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// Obtener color por estado (fallback si utils no tiene la función)
function getStatusColor(estado) {
    if (utils && utils.getStatusColor) {
        return utils.getStatusColor(estado);
    }
    
    const colors = {
        'Activo': '#2563eb',
        'En Progreso': '#f59e0b',
        'Cerrado': '#10b981',
        'Cancelado': '#6b7280',
        'Sin Asignar': '#ef4444',
        'Pendiente': '#8b5cf6'
    };
    return colors[estado] || '#6b7280';
}

// Auto-refresh cada 30 segundos
function setupAutoRefresh() {
    setInterval(() => {
        if (!state.loading) {
            loadDashboardData();
        }
    }, 30000);
}

// Mostrar indicador de carga
function showLoadingIndicator() {
    const loadingElement = document.getElementById('loading-indicator');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
}

// Ocultar indicador de carga
function hideLoadingIndicator() {
    const loadingElement = document.getElementById('loading-indicator');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// Exportar funciones para uso externo
window.estadisticasGestor = {
    refresh: loadDashboardData,
    getState: () => state
};
