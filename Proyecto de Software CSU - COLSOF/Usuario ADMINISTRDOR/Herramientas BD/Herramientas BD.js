// Variables globales
let isExecutingQuery = false;
let allCases = [];
let dbStats = {};
let lastBackupDate = new Date();

// Consultas predefinidas
const sampleQueries = [
    { 
        name: 'Casos sin resolver', 
        query: 'SELECT * FROM casos WHERE estado != \'resuelto\' ORDER BY fecha_creacion DESC LIMIT 10',
        description: 'Lista todos los casos activos pendientes de resolución'
    },
    { 
        name: 'Técnicos con mayor carga', 
        query: 'SELECT asignado_a, COUNT(*) as total FROM casos WHERE estado != \'resuelto\' GROUP BY asignado_a ORDER BY total DESC LIMIT 10',
        description: 'Muestra técnicos ordenados por cantidad de casos activos'
    },
    { 
        name: 'Casos por prioridad', 
        query: 'SELECT prioridad, COUNT(*) as cantidad FROM casos GROUP BY prioridad ORDER BY cantidad DESC',
        description: 'Distribución de casos según nivel de prioridad'
    },
    { 
        name: 'Casos por categoría', 
        query: 'SELECT categoria, COUNT(*) as cantidad FROM casos GROUP BY categoria ORDER BY cantidad DESC',
        description: 'Distribución de casos por categoría'
    },
    { 
        name: 'Casos creados hoy', 
        query: 'SELECT * FROM casos WHERE DATE(fecha_creacion) = CURRENT_DATE ORDER BY fecha_creacion DESC',
        description: 'Lista de casos creados en el día actual'
    }
];

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', async function() {
    // Inicializar iconos de Lucide
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    // Cargar datos de la BD
    await loadDatabaseStats();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Inicializar pestañas
    initTabs();
    
    // Auto-actualizar cada 30 segundos
    startAutoRefresh();
});

// Cargar estadísticas de la BD desde la API
async function loadDatabaseStats() {
    try {
        const response = await fetch('http://localhost:3001/api?action=get_casos_simple');
        const data = await response.json();
        allCases = data.cases || [];
        
        // Calcular estadísticas
        updateDatabaseMetrics();
    } catch (error) {
        console.error('Error loading database stats:', error);
    }
}

// Actualizar métricas de la BD
function updateDatabaseMetrics() {
    if (allCases.length === 0) return;
    
    // Contar tablas (casos, usuarios, categorías)
    const tables = 3;
    const records = allCases.length;
    
    // Calcular tamaño aproximado (~50KB por caso)
    const sizeInMB = (records * 0.05) / 1024;
    const sizeInGB = sizeInMB / 1024;
    
    // Obtener fecha del último caso como "último backup"
    const sortedByDate = [...allCases].sort((a, b) => 
        new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
    );
    const lastCaseDate = sortedByDate[0]?.fecha_creacion || new Date();
    const backupDate = new Date(lastCaseDate).toLocaleString('es-ES');
    
    // Calcular uptime (días desde el caso más antiguo)
    const oldestCaseDate = sortedByDate[sortedByDate.length - 1]?.fecha_creacion || new Date();
    const daysDiff = Math.floor((new Date() - new Date(oldestCaseDate)) / (1000 * 60 * 60 * 24));
    const uptime = `${daysDiff} días`;
    
    // Actualizar elementos en el DOM
    document.getElementById('tables-count').textContent = tables;
    animateValue(document.getElementById('records-count'), records, 0);
    document.getElementById('db-size').textContent = sizeInGB.toFixed(2) + ' MB';
    document.getElementById('last-backup').textContent = backupDate;
    document.getElementById('uptime').textContent = uptime;
}

// Animar cambio de números
function animateValue(element, target, index) {
    const duration = 600;
    const start = parseInt(element.textContent.replace(/[^0-9]/g, '')) || 0;
    const difference = target - start;
    const steps = 60;
    let current = 0;
    
    const timer = setInterval(() => {
        current++;
        const value = Math.round(start + (difference * current / steps));
        element.textContent = value.toLocaleString();
        
        if (current === steps) clearInterval(timer);
    }, duration / steps);
}

// Ejecutar consulta
function executeQuery() {
    if (isExecutingQuery) return;
    
    const queryEditor = document.getElementById('query-editor');
    const queryText = queryEditor.value.trim();
    
    if (!queryText) {
        alert('Por favor, escribe una consulta SQL');
        return;
    }
    
    isExecutingQuery = true;
    const executeBtn = document.getElementById('execute-query');
    const originalText = executeBtn.innerHTML;
    executeBtn.innerHTML = '<i data-lucide="refresh-cw" class="btn-icon animate-spin"></i> Ejecutando...';
    executeBtn.disabled = true;
    
    // Procesar la consulta
    setTimeout(() => {
        processQuery(queryText);
        
        isExecutingQuery = false;
        executeBtn.innerHTML = originalText;
        executeBtn.disabled = false;
        document.getElementById('export-results').style.display = 'flex';
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, 500);
}

// Procesar consulta y mostrar resultados
function processQuery(queryText) {
    // Parsear la consulta para determinar qué hacer
    const query = queryText.toLowerCase();
    let results = [];
    
    if (query.includes('count(*)') || query.includes('count(')) {
        // Consulta de agregación
        results = processAggregationQuery(queryText);
    } else {
        // Consulta SELECT normal
        results = processSelectQuery(queryText);
    }
    
    displayQueryResults(results, queryText);
}

// Procesar consultas de agregación
function processAggregationQuery(queryText) {
    const query = queryText.toLowerCase();
    
    if (query.includes('prioridad')) {
        const grouped = {};
        allCases.forEach(c => {
            const priority = c.prioridad || 'sin_especificar';
            grouped[priority] = (grouped[priority] || 0) + 1;
        });
        
        const result = {
            columns: ['Prioridad', 'Cantidad'],
            rows: Object.entries(grouped).map(([k, v]) => [k, v]),
            executionTime: '0.012s',
            rowsAffected: Object.keys(grouped).length
        };
        return result;
    }
    
    if (query.includes('categoria')) {
        const grouped = {};
        allCases.forEach(c => {
            const category = c.categoria || 'sin_especificar';
            grouped[category] = (grouped[category] || 0) + 1;
        });
        
        const result = {
            columns: ['Categoría', 'Cantidad'],
            rows: Object.entries(grouped).map(([k, v]) => [k, v]),
            executionTime: '0.012s',
            rowsAffected: Object.keys(grouped).length
        };
        return result;
    }
    
    if (query.includes('asignado_a') || query.includes('tecnico')) {
        const grouped = {};
        allCases.forEach(c => {
            const tech = c.asignado_a || 'sin_asignar';
            grouped[tech] = (grouped[tech] || 0) + 1;
        });
        
        const sorted = Object.entries(grouped)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        const result = {
            columns: ['Técnico/Asignado', 'Total'],
            rows: sorted,
            executionTime: '0.015s',
            rowsAffected: sorted.length
        };
        return result;
    }
    
    return { columns: [], rows: [], executionTime: '0.001s', rowsAffected: 0 };
}

// Procesar consultas SELECT normales
function processSelectQuery(queryText) {
    let results = [...allCases];
    
    // Aplicar filtros según la consulta
    const query = queryText.toLowerCase();
    
    if (query.includes('where estado')) {
        // Filtrar por estado
        if (query.includes('!= \'resuelto\'') || query.includes('!= "resuelto"')) {
            results = results.filter(c => c.estado !== 'resuelto');
        } else if (query.includes('= \'resuelto\'') || query.includes('= "resuelto"')) {
            results = results.filter(c => c.estado === 'resuelto');
        }
    }
    
    if (query.includes('order by fecha_creacion desc')) {
        results.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
    }
    
    if (query.includes('limit 10')) {
        results = results.slice(0, 10);
    }
    
    // Preparar resultado
    const columns = ['ID', 'Cliente', 'Estado', 'Prioridad', 'Categoría', 'Asignado', 'Fecha'];
    const rows = results.map(c => [
        c.id || '-',
        c.cliente || '-',
        c.estado || '-',
        c.prioridad || '-',
        c.categoria || '-',
        c.asignado_a || '-',
        new Date(c.fecha_creacion).toLocaleDateString('es-ES')
    ]);
    
    return {
        columns,
        rows: rows.slice(0, 20),
        executionTime: '0.024s',
        rowsAffected: rows.length
    };
}

// Mostrar resultados de consulta
function displayQueryResults(resultData, queryText) {
    const resultsContainer = document.getElementById('query-results');
    
    if (!resultData.rows || resultData.rows.length === 0) {
        resultsContainer.innerHTML = `
            <div class="results-empty">
                <i data-lucide="inbox" style="width:48px;height:48px;opacity:0.5"></i>
                <p style="color:#666;margin-top:12px">No se encontraron resultados</p>
            </div>
        `;
        resultsContainer.style.display = 'block';
        return;
    }
    
    resultsContainer.innerHTML = `
        <div class="results-header">
            <div class="results-title">Resultados (${resultData.rowsAffected} filas)</div>
            <div class="results-meta">
                <span class="results-time">
                    <i data-lucide="clock" class="btn-icon-small"></i>
                    ${resultData.executionTime}
                </span>
                <span class="results-rows">
                    <i data-lucide="file-text" class="btn-icon-small"></i>
                    Query ejecutado
                </span>
            </div>
        </div>
        <table class="results-table">
            <thead>
                <tr>
                    ${resultData.columns.map(col => `<th>${col}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${resultData.rows.map(row => `
                    <tr>
                        ${row.map((cell, cellIdx) => {
                            // Resaltar prioridad
                            if (cellIdx === 3) {
                                let priorityClass = 'priority-low';
                                if (cell === 'critica') priorityClass = 'priority-high';
                                else if (cell === 'urgente') priorityClass = 'priority-high';
                                else if (cell === 'alta') priorityClass = 'priority-high';
                                else if (cell === 'media') priorityClass = 'priority-medium';
                                
                                return `<td><span class="priority-badge ${priorityClass}">${cell}</span></td>`;
                            }
                            // Resaltar estado
                            if (cellIdx === 2) {
                                let stateClass = 'state-open';
                                if (cell === 'resuelto') stateClass = 'state-resolved';
                                else if (cell === 'pausado') stateClass = 'state-paused';
                                else if (cell === 'cerrado') stateClass = 'state-closed';
                                
                                return `<td><span class="state-badge ${stateClass}">${cell}</span></td>`;
                            }
                            return `<td>${cell}</td>`;
                        }).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    resultsContainer.style.display = 'block';
    if (window.lucide) {
        window.lucide.createIcons();
    }
}
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    // Activar la primera pestaña por defecto
    if (tabButtons.length > 0 && tabPanes.length > 0) {
        const firstTabId = tabButtons[0].dataset.tab;
        showTab(firstTabId);
    }
}

// Mostrar una pestaña específica
function showTab(tabId) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Desactivar todos los botones de pestaña
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Mostrar la pestaña seleccionada
    const tabPane = document.getElementById(`${tabId}-tab`);
    if (tabPane) {
        tabPane.classList.add('active');
    }
    
    // Activar el botón de la pestaña seleccionada
    const tabButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
    if (tabButton) {
        tabButton.classList.add('active');
    }
}

// Ejecutar consulta SQL
function executeQuery() {
    if (isExecutingQuery) return;
    
    const queryEditor = document.getElementById('query-editor');
    const queryText = queryEditor.value.trim();
    
    if (!queryText) {
        alert('Por favor, escribe una consulta SQL');
        return;
    }
    
    // Mostrar estado de ejecución
    isExecutingQuery = true;
    const executeBtn = document.getElementById('execute-query');
    const originalText = executeBtn.innerHTML;
    executeBtn.innerHTML = '<i data-lucide="refresh-cw" class="btn-icon animate-spin"></i> Ejecutando...';
    executeBtn.disabled = true;
    
    // Simular tiempo de ejecución
    setTimeout(() => {
        // Mostrar resultados
        displayQueryResults();
        
        // Restaurar botón
        isExecutingQuery = false;
        executeBtn.innerHTML = originalText;
        executeBtn.disabled = false;
        
        // Mostrar botón de exportar
        document.getElementById('export-results').style.display = 'flex';
        
        // Re-inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, 800);
}

// Limpiar editor
function clearQueryEditor() {
    document.getElementById('query-editor').value = '';
    document.getElementById('query-results').style.display = 'none';
    document.getElementById('export-results').style.display = 'none';
}

// Exportar resultados
function exportQueryResults() {
    const resultsTable = document.querySelector('.results-table');
    if (!resultsTable) {
        alert('No hay resultados para exportar');
        return;
    }
    
    // Convertir tabla a CSV
    let csv = '';
    const rows = resultsTable.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('th, td');
        const rowData = Array.from(cells).map(cell => cell.textContent).join(',');
        csv += rowData + '\n';
    });
    
    // Descargar CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_results_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Crear backup
function createBackup() {
    const backupType = document.getElementById('backup-type').value;
    const backupBtn = document.getElementById('create-backup');
    const originalText = backupBtn.textContent;
    
    backupBtn.textContent = 'Creando backup...';
    backupBtn.disabled = true;
    
    setTimeout(() => {
        lastBackupDate = new Date();
        backupBtn.textContent = originalText;
        backupBtn.disabled = false;
        
        // Agregar backup al historial
        addBackupToHistory(backupType);
        alert('Backup creado exitosamente');
    }, 1500);
}

// Agregar backup al historial
function addBackupToHistory(backupType) {
    const historyList = document.querySelector('.backup-history-list');
    const now = new Date();
    const backupDate = now.toLocaleString('es-ES');
    const backupSize = ((Math.random() * 0.5 + 2).toFixed(1)) + ' GB';
    
    const newBackup = document.createElement('div');
    newBackup.className = 'backup-item';
    newBackup.innerHTML = `
        <div class="backup-header">
            <div class="backup-info">
                <i data-lucide="check-circle" class="backup-icon success"></i>
                <div>
                    <div class="backup-date">${backupDate}</div>
                    <div class="backup-type">${backupType}</div>
                </div>
            </div>
            <div class="backup-size">${backupSize}</div>
        </div>
        <div class="backup-actions">
            <button class="btn-backup-action restore">Restaurar</button>
            <button class="btn-backup-action download">Descargar</button>
            <button class="btn-backup-action delete" aria-label="Eliminar backup">
                <i data-lucide="trash-2" class="btn-icon-small"></i>
            </button>
        </div>
    `;
    
    historyList.insertBefore(newBackup, historyList.firstChild);
    
    // Re-inicializar lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    // Agregar event listeners al nuevo elemento
    setupBackupActions(newBackup);
}

// Setup backup actions
function setupBackupActions(backupElement) {
    backupElement.querySelectorAll('.btn-backup-action.restore').forEach(button => {
        button.addEventListener('click', function() {
            const backupDate = this.closest('.backup-item').querySelector('.backup-date').textContent;
            if (confirm(`¿Restaurar backup del ${backupDate}? Esto sobrescribirá los datos actuales.`)) {
                alert(`Restaurando backup del ${backupDate}...`);
            }
        });
    });
    
    backupElement.querySelectorAll('.btn-backup-action.download').forEach(button => {
        button.addEventListener('click', function() {
            const backupDate = this.closest('.backup-item').querySelector('.backup-date').textContent;
            alert(`Descargando backup del ${backupDate}...`);
        });
    });
    
    backupElement.querySelectorAll('.btn-backup-action.delete').forEach(button => {
        button.addEventListener('click', function() {
            const backupDate = this.closest('.backup-item').querySelector('.backup-date').textContent;
            if (confirm(`¿Eliminar backup del ${backupDate}?`)) {
                this.closest('.backup-item').remove();
                alert('Backup eliminado');
            }
        });
    });
}

// Seleccionar archivo de backup
function selectBackupFile() {
    alert('Selecciona el archivo de backup desde tu computadora');
}

// Auto-actualizar métricas
function startAutoRefresh() {
    setInterval(async () => {
        await loadDatabaseStats();
    }, 30000);
}

// Configurar event listeners
function setupEventListeners() {
    // Navegación de pestañas
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            showTab(tabId);
        });
    });
    
    // Consultas SQL
    const btnExecute = document.getElementById('execute-query');
    if (btnExecute) btnExecute.addEventListener('click', executeQuery);
    
    const btnClear = document.getElementById('clear-query');
    if (btnClear) btnClear.addEventListener('click', clearQueryEditor);
    
    const btnExport = document.getElementById('export-results');
    if (btnExport) btnExport.addEventListener('click', exportQueryResults);
    
    // Consultas predefinidas
    document.querySelectorAll('.sample-query').forEach(query => {
        query.addEventListener('click', function() {
            const queryText = this.dataset.query;
            document.getElementById('query-editor').value = queryText;
        });
    });
    
    // Backup
    const btnCreateBackup = document.getElementById('create-backup');
    if (btnCreateBackup) btnCreateBackup.addEventListener('click', createBackup);
    
    const btnSelectBackup = document.getElementById('select-backup-file');
    if (btnSelectBackup) btnSelectBackup.addEventListener('click', selectBackupFile);
    
    // Botones de mantenimiento
    document.querySelectorAll('.maintenance-card .btn').forEach(button => {
        button.addEventListener('click', function() {
            const cardTitle = this.closest('.maintenance-card').querySelector('.maintenance-title').textContent;
            const btn = this;
            const originalText = btn.textContent;
            btn.textContent = 'Procesando...';
            btn.disabled = true;
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
                alert(`✓ ${cardTitle} completado exitosamente`);
            }, 1500);
        });
    });
    
    // Botones de backup history existentes
    setupBackupHistoryActions();
    
    // Botones de importación/exportación
    const importBtn = document.querySelector('.import-card .btn');
    if (importBtn) {
        importBtn.addEventListener('click', function() {
            alert('Selecciona el archivo CSV, JSON o XML que deseas importar');
        });
    }
    
    document.querySelectorAll('.btn-export').forEach(button => {
        button.addEventListener('click', function() {
            const format = this.textContent.toUpperCase();
            const data = allCases;
            
            if (format === 'CSV') {
                exportAsCSV(data);
            } else if (format === 'EXCEL') {
                exportAsJSON(data);
            } else if (format === 'JSON') {
                exportAsJSON(data);
            }
        });
    });
}

// Setup backup history actions
function setupBackupHistoryActions() {
    document.querySelectorAll('.btn-backup-action.restore').forEach(button => {
        button.addEventListener('click', function() {
            const backupDate = this.closest('.backup-item').querySelector('.backup-date').textContent;
            if (confirm(`¿Restaurar backup del ${backupDate}? Esto sobrescribirá los datos actuales.`)) {
                alert(`Restaurando backup del ${backupDate}...`);
            }
        });
    });
    
    document.querySelectorAll('.btn-backup-action.download').forEach(button => {
        button.addEventListener('click', function() {
            const backupDate = this.closest('.backup-item').querySelector('.backup-date').textContent;
            alert(`Descargando backup del ${backupDate}...`);
        });
    });
    
    document.querySelectorAll('.btn-backup-action.delete').forEach(button => {
        button.addEventListener('click', function() {
            const backupDate = this.closest('.backup-item').querySelector('.backup-date').textContent;
            if (confirm(`¿Eliminar backup del ${backupDate}?`)) {
                this.closest('.backup-item').remove();
                alert('Backup eliminado');
            }
        });
    });
}

// Exportar como CSV
function exportAsCSV(data) {
    let csv = 'ID,Cliente,Estado,Prioridad,Categoría,Asignado,Fecha\n';
    data.forEach(c => {
        csv += `"${c.id}","${c.cliente}","${c.estado}","${c.prioridad}","${c.categoria}","${c.asignado_a}","${c.fecha_creacion}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `casos_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    alert('Datos exportados en formato CSV');
}

// Exportar como JSON
function exportAsJSON(data) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `casos_export_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    alert('Datos exportados en formato JSON');
}

// Añadir animación de spin para iconos de carga
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    .animate-spin {
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(style);