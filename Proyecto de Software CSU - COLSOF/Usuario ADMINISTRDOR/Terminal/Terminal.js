document.addEventListener('DOMContentLoaded', function() {
    // Dynamic data from API
    let systemStatus = {};
    let servicios = [];
    let logs = [];
    let configuraciones = [];
    const API_BASE = 'http://localhost:3001/api?action=get_casos_simple';

    // DOM elements
    const refreshBtn = document.getElementById('refreshBtn');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const systemTab = document.getElementById('systemTab');
    const servicesTab = document.getElementById('servicesTab');
    const logsTab = document.getElementById('logsTab');
    const configTab = document.getElementById('configTab');
    const servicesTableBody = document.getElementById('servicesTableBody');
    const logsList = document.getElementById('logsList');
    const configSections = document.querySelector('.config-sections');
    const logFilterButtons = document.querySelectorAll('.log-filter-btn');
    const exportBtn = document.querySelector('.btn-export');
    const importBtn = document.querySelector('.btn-import');
    const resetBtn = document.querySelector('.btn-reset');
    const saveBtn = document.querySelector('.btn-save');

    // Load data from API and generate system data
    async function loadDataFromAPI() {
        try {
            const response = await fetch(API_BASE);
            const casos = await response.json();
            
            if (Array.isArray(casos)) {
                generateSystemData(casos);
                updateSystemMetrics();
                renderServicesTable();
                renderLogs();
                renderConfigurations();
            }
        } catch (error) {
            console.error('Error loading data from API:', error);
            showNotification('Error cargando datos', 'error');
        }
    }

    function generateSystemData(casos) {
        // System Status
        const estadoCounts = {};
        casos.forEach(c => {
            estadoCounts[c.estado] = (estadoCounts[c.estado] || 0) + 1;
        });

        const cpuUsage = Math.floor(20 + Math.random() * 40);
        const ramUsage = Math.floor(30 + Math.random() * 50);
        const diskUsage = Math.floor(40 + Math.random() * 30);

        systemStatus = {
            servidor: {
                nombre: 'CSU-PROD-01',
                estado: 'Operativo',
                uptime: `${Math.floor(Math.random() * 90)} días ${Math.floor(Math.random() * 24)}:${Math.floor(Math.random() * 60)}:${Math.floor(Math.random() * 60)}`,
                cpu: cpuUsage,
                ram: ramUsage,
                disco: diskUsage,
                red: cpuUsage < 70 ? 'Normal' : 'Saturada'
            },
            baseDatos: {
                motor: 'PostgreSQL 15.2',
                estado: 'Activo',
                conexiones: Math.min(Math.floor(casos.length * 0.8), 95),
                maxConexiones: 100,
                tamaño: `${(casos.length * 0.045).toFixed(2)} GB`,
                ultimoBackup: new Date().toLocaleString('es-ES')
            },
            aplicacion: {
                version: 'CSU v2.1.0',
                estado: 'Operativo',
                usuariosConectados: Math.floor(casos.length / 5),
                solicitudesPorMinuto: Math.floor(100 + Math.random() * 100),
                tiempoRespuesta: `${Math.floor(150 + Math.random() * 200)}ms`
            }
        };

        // Services
        servicios = [
            { nombre: 'API REST', puerto: 3001, estado: 'Activo', pid: 1234, memoria: '456 MB', cpu: '12%' },
            { nombre: 'Base de Datos', puerto: 5432, estado: 'Activo', pid: 1235, memoria: `${Math.floor(100 + casos.length * 2)} MB`, cpu: '8%' },
            { nombre: 'Cache Server', puerto: 6379, estado: 'Activo', pid: 1236, memoria: '128 MB', cpu: '5%' },
            { nombre: 'Task Queue', puerto: 5672, estado: 'Activo', pid: 1237, memoria: '89 MB', cpu: '3%' },
            { nombre: 'Backup Scheduler', puerto: null, estado: 'Activo', pid: 1238, memoria: '45 MB', cpu: '1%' }
        ];

        // Logs from cases
        logs = [];
        const logLevels = ['INFO', 'WARNING', 'ERROR', 'DEBUG'];
        const serviciosList = ['auth', 'api', 'monitor', 'backup', 'security', 'database'];
        
        casos.slice(0, Math.min(6, casos.length)).forEach((caso, index) => {
            logs.push({
                nivel: logLevels[Math.floor(Math.random() * 3)],
                timestamp: new Date(caso.fecha_creacion).toLocaleString('es-ES'),
                mensaje: `Caso ${caso.id} (${caso.categoria}) - Estado: ${caso.estado} - Asignado a: ${caso.asignado_a}`,
                servicio: serviciosList[Math.floor(Math.random() * serviciosList.length)]
            });
        });

        // Configurations
        configuraciones = [
            { categoria: 'General', clave: 'app.name', valor: 'CSU - Centro de Soporte', tipo: 'texto' },
            { categoria: 'General', clave: 'app.version', valor: '2.1.0', tipo: 'texto' },
            { categoria: 'General', clave: 'total_casos', valor: casos.length.toString(), tipo: 'texto' },
            { categoria: 'Seguridad', clave: 'session.timeout', valor: '30', tipo: 'número' },
            { categoria: 'Seguridad', clave: 'password.min_length', valor: '8', tipo: 'número' },
            { categoria: 'Seguridad', clave: 'max_login_attempts', valor: '5', tipo: 'número' },
            { categoria: 'Base de Datos', clave: 'db.pool_size', valor: '20', tipo: 'número' },
            { categoria: 'Base de Datos', clave: 'db.backup_enabled', valor: 'true', tipo: 'booleano' },
            { categoria: 'Performance', clave: 'cache.enabled', valor: 'true', tipo: 'booleano' },
            { categoria: 'Performance', clave: 'cache.ttl', valor: '3600', tipo: 'número' }
        ];
    }

    // Actualizar métricas del sistema
    function updateSystemMetrics() {
        // Actualizar valores de CPU, RAM, Disco
        if (document.getElementById('cpuValue')) document.getElementById('cpuValue').textContent = `${systemStatus.servidor.cpu}%`;
        if (document.querySelector('.cpu-progress')) document.querySelector('.cpu-progress').style.width = `${systemStatus.servidor.cpu}%`;
        
        if (document.getElementById('ramValue')) document.getElementById('ramValue').textContent = `${systemStatus.servidor.ram}%`;
        if (document.querySelector('.ram-progress')) document.querySelector('.ram-progress').style.width = `${systemStatus.servidor.ram}%`;
        
        if (document.getElementById('diskValue')) document.getElementById('diskValue').textContent = `${systemStatus.servidor.disco}%`;
        if (document.querySelector('.disk-progress')) document.querySelector('.disk-progress').style.width = `${systemStatus.servidor.disco}%`;
        
        if (document.getElementById('uptimeValue')) document.getElementById('uptimeValue').textContent = systemStatus.servidor.uptime;
        if (document.getElementById('dbEngine')) document.getElementById('dbEngine').textContent = systemStatus.baseDatos.motor;
        if (document.getElementById('dbConnections')) document.getElementById('dbConnections').textContent = `${systemStatus.baseDatos.conexiones}/${systemStatus.baseDatos.maxConexiones}`;
        if (document.getElementById('dbSize')) document.getElementById('dbSize').textContent = systemStatus.baseDatos.tamaño;
        if (document.getElementById('lastBackup')) document.getElementById('lastBackup').textContent = systemStatus.baseDatos.ultimoBackup;
        if (document.getElementById('appVersion')) document.getElementById('appVersion').textContent = systemStatus.aplicacion.version;
        if (document.getElementById('activeUsers')) document.getElementById('activeUsers').textContent = systemStatus.aplicacion.usuariosConectados;
        if (document.getElementById('requestsPerMin')) document.getElementById('requestsPerMin').textContent = systemStatus.aplicacion.solicitudesPorMinuto;
        if (document.getElementById('responseTime')) document.getElementById('responseTime').textContent = systemStatus.aplicacion.tiempoRespuesta;
    }

    // Renderizar tabla de servicios
    function renderServicesTable() {
        if (!servicesTableBody) return;
        servicesTableBody.innerHTML = '';
        
        servicios.forEach((servicio, index) => {
            const row = document.createElement('tr');
            row.style.animation = `slideInLeft ${0.3 + index * 0.05}s ease-out`;
            
            row.innerHTML = `
                <td>${servicio.nombre}</td>
                <td>${servicio.puerto || 'N/A'}</td>
                <td>${servicio.pid}</td>
                <td>${servicio.memoria}</td>
                <td>${servicio.cpu}</td>
                <td>
                    <span class="status-badge-small">
                        <i class="fas fa-check-circle"></i>
                        ${servicio.estado}
                    </span>
                </td>
                <td>
                    <div class="service-actions">
                        <button class="btn-restart" onclick="restartService('${servicio.nombre}'); return false;">
                            Reiniciar
                        </button>
                        <button class="btn-stop" onclick="stopService('${servicio.nombre}'); return false;">
                            Detener
                        </button>
                    </div>
                </td>
            `;
            
            servicesTableBody.appendChild(row);
        });
    }

    // Renderizar logs
    function renderLogs(filter = 'all') {
        if (!logsList) return;
        logsList.innerHTML = '';
        
        const filteredLogs = filter === 'all' 
            ? logs 
            : logs.filter(log => log.nivel === filter);
        
        filteredLogs.forEach((log, index) => {
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry log-${log.nivel.toLowerCase()}`;
            logEntry.style.animation = `slideInUp ${0.3 + index * 0.05}s ease-out`;
            
            logEntry.innerHTML = `
                <div class="log-header">
                    <span class="log-level log-level-${log.nivel.toLowerCase()}">${log.nivel}</span>
                    <span class="log-service">[${log.servicio}]</span>
                    <span class="log-timestamp">${log.timestamp}</span>
                </div>
                <div class="log-message">${log.mensaje}</div>
            `;
            
            logsList.appendChild(logEntry);
        });
    }

    // Renderizar configuración
    function renderConfigurations() {
        if (!configSections) return;
        configSections.innerHTML = '';
        
        // Obtener categorías únicas
        const categorias = [...new Set(configuraciones.map(c => c.categoria))];
        
        categorias.forEach((categoria, catIndex) => {
            const section = document.createElement('div');
            section.className = 'config-section';
            section.style.animation = `slideInUp ${0.3 + catIndex * 0.1}s ease-out`;
            
            let sectionHTML = `<h3 class="section-title">${categoria}</h3>`;
            sectionHTML += `<div class="config-grid">`;
            
            const configs = configuraciones.filter(c => c.categoria === categoria);
            
            configs.forEach(config => {
                sectionHTML += `
                    <div class="config-item">
                        <label class="config-label">${config.clave}</label>
                        ${config.tipo === 'booleano' 
                            ? `<select class="config-input" data-key="${config.clave}">
                                <option value="true" ${config.valor === 'true' ? 'selected' : ''}>Activado</option>
                                <option value="false" ${config.valor === 'false' ? 'selected' : ''}>Desactivado</option>
                               </select>`
                            : `<input type="${config.tipo === 'número' ? 'number' : 'text'}" 
                                     class="config-input" 
                                     data-key="${config.clave}"
                                     value="${config.valor}">`
                        }
                    </div>
                `;
            });
            
            sectionHTML += `</div>`;
            section.innerHTML = sectionHTML;
            configSections.appendChild(section);
        });
    }

    // Funciones de acción
    window.restartService = function(serviceName) {
        showNotification(`Reiniciando servicio: ${serviceName}`, 'info');
    };

    window.stopService = function(serviceName) {
        showNotification(`Deteniendo servicio: ${serviceName}`, 'info');
    };

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

    // Cambiar entre pestañas
    function switchTab(tabId) {
        // Ocultar todas las pestañas
        if (systemTab) systemTab.classList.remove('active');
        if (servicesTab) servicesTab.classList.remove('active');
        if (logsTab) logsTab.classList.remove('active');
        if (configTab) configTab.classList.remove('active');
        
        // Remover clase active de todos los botones
        tabButtons.forEach(btn => btn.classList.remove('active'));
        
        // Mostrar la pestaña seleccionada
        if (tabId === 'system') {
            if (systemTab) systemTab.classList.add('active');
            const btn = document.querySelector('[data-tab="system"]');
            if (btn) btn.classList.add('active');
        } else if (tabId === 'services') {
            if (servicesTab) servicesTab.classList.add('active');
            const btn = document.querySelector('[data-tab="services"]');
            if (btn) btn.classList.add('active');
        } else if (tabId === 'logs') {
            if (logsTab) logsTab.classList.add('active');
            const btn = document.querySelector('[data-tab="logs"]');
            if (btn) btn.classList.add('active');
        } else if (tabId === 'config') {
            if (configTab) configTab.classList.add('active');
            const btn = document.querySelector('[data-tab="config"]');
            if (btn) btn.classList.add('active');
        }
    }

    // Actualizar datos
    function refreshData() {
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i');
            if (icon) icon.style.animation = 'spin 1s linear';
        }
        
        loadDataFromAPI();
        
        setTimeout(() => {
            if (refreshBtn) {
                const icon = refreshBtn.querySelector('i');
                if (icon) icon.style.animation = '';
            }
        }, 1000);
    }

    // Inicializar
    function init() {
        // Cargar datos desde API
        loadDataFromAPI();
        
        // Configurar event listeners para las pestañas
        tabButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                switchTab(tabId);
            });
        });
        
        // Configurar botón de refrescar
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshData);
        }
        
        // Configurar botones de acción en logs
        if (logFilterButtons) {
            logFilterButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    logFilterButtons.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    const filter = this.getAttribute('data-filter');
                    renderLogs(filter);
                });
            });
        }
        
        // Configurar botones de acción de configuración
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                showNotification('Exportando logs...', 'info');
            });
        }
        
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                showNotification('Importando configuración...', 'info');
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                showNotification('Restableciendo configuración...', 'info');
                loadDataFromAPI();
            });
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                showNotification('Configuración guardada', 'success');
            });
        }
    }

    // Auto-refresh every 30 seconds
    setInterval(() => {
        loadDataFromAPI();
    }, 30000);

    // Inicializar la aplicación
    init();
});
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', resetConfiguration);
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', saveConfiguration);
        }
    }

    // Inicializar la aplicación
    init();
});