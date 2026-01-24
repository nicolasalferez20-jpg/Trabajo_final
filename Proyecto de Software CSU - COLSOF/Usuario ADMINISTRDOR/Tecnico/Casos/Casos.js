document.addEventListener('DOMContentLoaded', function() {
    let casos = [];
    let todosLosCasos = [];

    const API_BASE = 'http://localhost:3001/api?action=get_casos_simple';

    // DOM elements
    const table = document.getElementById('casesTable');
    const tableBody = table ? table.querySelector('tbody') : null;
    const tableWrapper = document.getElementById('tableWrapper');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const emptyMessage = document.getElementById('emptyMessage');

    const statTotal = document.getElementById('statTotal');
    const statEnCurso = document.getElementById('statEnCurso');
    const statAlta = document.getElementById('statAlta');
    const statSla = document.getElementById('statSla');
    const statTotalNote = document.getElementById('statTotalNote');
    const statEnCursoNote = document.getElementById('statEnCursoNote');
    const statAltaNote = document.getElementById('statAltaNote');
    const statSlaNote = document.getElementById('statSlaNote');

    const btnRefresh = document.getElementById('btnRefresh');
    const btnNew = document.getElementById('btnNew');

    // Load data from API
    async function loadDataFromAPI() {
        try {
            const response = await fetch(API_BASE);
            const data = await response.json();
            
            if (Array.isArray(data)) {
                todosLosCasos = data.map((caso, index) => ({
                    id: caso.id || `C-${1000 + index}`,
                    titulo: caso.categoria || 'Sin título',
                    cliente: caso.cliente || 'Sin cliente',
                    tecnico: caso.asignado_a || 'Sin asignar',
                    prioridad: caso.prioridad || 'Media',
                    estado: mapEstadoToDisplay(caso.estado),
                    sla: calcularSLA(caso.fecha_creacion),
                    porcentajeSLA: calcularPorcentajeSLA(caso.estado, caso.fecha_creacion, caso.fecha_resolucion)
                }));
                
                casos = [...todosLosCasos];
                renderTable(casos);
                renderStats(casos);
            }
        } catch (error) {
            console.error('Error loading data from API:', error);
            showNotification('Error cargando datos', 'error');
        }
    }

    function mapEstadoToDisplay(estado) {
        const estadoMap = {
            'abierto': 'En Curso',
            'en_progreso': 'En Curso',
            'pausado': 'Pausado',
            'resuelto': 'Resuelto',
            'cerrado': 'Cerrado'
        };
        return estadoMap[estado?.toLowerCase()] || 'En Curso';
    }

    function calcularSLA(fechaCreacion) {
        if (!fechaCreacion) return '24h';
        const fecha = new Date(fechaCreacion);
        const ahora = new Date();
        const horas = Math.round((ahora - fecha) / (1000 * 60 * 60));
        if (horas < 1) return '<1h';
        if (horas < 24) return `${horas}h`;
        const dias = Math.round(horas / 24);
        return `${dias}d`;
    }

    function calcularPorcentajeSLA(estado, fechaCreacion, fechaResolucion) {
        const slaBase = 100;
        const fecha = new Date(fechaCreacion);
        const ahora = new Date();
        const horasTranscurridas = (ahora - fecha) / (1000 * 60 * 60);
        
        if (estado === 'resuelto' || estado === 'cerrado') {
            return 100;
        }
        if (estado === 'pausado') {
            return Math.max(50, 100 - Math.round(horasTranscurridas));
        }
        return Math.max(10, slaBase - Math.round(horasTranscurridas));
    }

    function renderTable(data) {
        if (!tableBody || !table) return;
        tableBody.innerHTML = '';

        const isEmpty = data.length === 0;
        if (emptyMessage) {
            emptyMessage.classList.toggle('hidden', !isEmpty);
        }
        table.classList.toggle('hidden', isEmpty);
        if (tableWrapper) {
            tableWrapper.classList.toggle('table-empty', isEmpty);
        }
        if (isEmpty) return;

        data.forEach((caso, index) => {
            const row = document.createElement('tr');
            row.style.animation = `slideInLeft ${0.3 + index * 0.05}s ease-out`;

            const prioridadClass = caso.prioridad.toLowerCase();
            const estadoClass = caso.estado.toLowerCase().replace(/\s+/g, '-');

            row.innerHTML = `
                <td>${caso.id}</td>
                <td><strong>${caso.titulo}</strong></td>
                <td>${caso.cliente}</td>
                <td>${caso.tecnico}</td>
                <td><span class="badge prioridad-${prioridadClass}">${caso.prioridad}</span></td>
                <td><span class="badge estado-${estadoClass}">${caso.estado}</span></td>
                <td><progress value="${caso.porcentajeSLA}" max="100"></progress>${caso.porcentajeSLA}% (${caso.sla})</td>
            `;

            tableBody.appendChild(row);
        });
    }

    function applyFilters() {
        const search = searchInput.value.toLowerCase();
        const estado = statusFilter.value;
        const prioridad = priorityFilter.value;

        casos = todosLosCasos.filter(c => {
            const matchesSearch =
                c.id.toLowerCase().includes(search) ||
                c.titulo.toLowerCase().includes(search) ||
                c.cliente.toLowerCase().includes(search);

            const matchesStatus = estado === 'todos' || c.estado === estado;
            const matchesPriority = prioridad === 'todos' || c.prioridad === prioridad;

            return matchesSearch && matchesStatus && matchesPriority;
        });

        renderTable(casos);
        renderStats(casos);
    }

    function renderStats(data) {
        const total = data.length;
        const enCurso = data.filter(c => c.estado === 'En Curso').length;
        const alta = data.filter(c => c.prioridad.toLowerCase() === 'alta' || c.prioridad.toLowerCase() === 'urgente' || c.prioridad.toLowerCase() === 'critica').length;
        const slaProm = total ? Math.round(data.reduce((acc, c) => acc + c.porcentajeSLA, 0) / total) : 0;

        animateCounter(statTotal, parseInt(statTotal.textContent) || 0, total);
        animateCounter(statEnCurso, parseInt(statEnCurso.textContent) || 0, enCurso);
        animateCounter(statAlta, parseInt(statAlta.textContent) || 0, alta);
        animateCounter(statSla, parseInt(statSla.textContent) || 0, slaProm);

        if (statTotalNote) statTotalNote.textContent = total ? 'Casos en la vista' : 'Sin datos';
        if (statEnCursoNote) statEnCursoNote.textContent = enCurso ? 'En seguimiento' : 'Ninguno activo';
        if (statAltaNote) statAltaNote.textContent = alta ? 'Requieren priorización' : 'Sin alertas altas';
        if (statSlaNote) statSlaNote.textContent = total ? 'Promedio visible' : 'Sin SLA para mostrar';
    }

    function animateCounter(element, start, end) {
        if (!element) return;
        const duration = 500;
        const steps = 30;
        const stepValue = (end - start) / steps;
        let current = start;
        let step = 0;

        const interval = setInterval(() => {
            step++;
            current += stepValue;
            element.textContent = Math.round(current);

            if (step >= steps) {
                element.textContent = end;
                clearInterval(interval);
            }
        }, duration / steps);
    }

    function resetAndRefresh() {
        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = 'todos';
        if (priorityFilter) priorityFilter.value = 'todos';
        loadDataFromAPI();
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.animation = 'slideIn 0.3s ease-out';
        
        const container = document.querySelector('.main-content') || document.body;
        container.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Setup event listeners
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    if (priorityFilter) {
        priorityFilter.addEventListener('change', applyFilters);
    }

    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            btnRefresh.style.animation = 'spin 1s linear';
            setTimeout(() => btnRefresh.style.animation = '', 1000);
            resetAndRefresh();
        });
    }
    if (btnNew) {
        btnNew.addEventListener('click', () => {
            showNotification('Crear nuevo caso - Función disponible próximamente', 'info');
        });
    }

    // Auto-refresh every 30 seconds
    setInterval(() => {
        loadDataFromAPI();
    }, 30000);

    // Initial load
    loadDataFromAPI();
});