document.addEventListener('DOMContentLoaded', function() {
    // Initialize with dynamic data from API
    let notificacionesSistema = [];
    let notificacionesUsuarios = [];
    const API_BASE = 'http://localhost:3001/api?action=get_casos_simple';

    // DOM elements
    const systemTab = document.getElementById('systemTab');
    const usersTab = document.getElementById('usersTab');
    const sendTab = document.getElementById('sendTab');
    const systemNotifications = document.getElementById('systemNotifications');
    const userNotifications = document.getElementById('userNotifications');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const sendNotificationBtn = document.getElementById('sendNotificationBtn');
    const notificationModal = document.getElementById('notificationModal');
    const modalClose = document.querySelector('.modal-close');
    const notificationForm = document.getElementById('notificationForm');
    const btnMarkRead = document.querySelector('.btn-mark-read');

    // Load data from API
    async function loadDataFromAPI() {
        try {
            const response = await fetch(API_BASE);
            const casos = await response.json();
            
            if (Array.isArray(casos)) {
                // Generate notifications from cases
                generarNotificacionesDelSistema(casos);
                generarNotificacionesDeUsuarios(casos);
                
                renderSystemNotifications();
                renderUserNotifications();
                updateStats();
            }
        } catch (error) {
            console.error('Error loading data from API:', error);
            showNotification('Error cargando datos', 'error');
        }
    }

    function generarNotificacionesDelSistema(casos) {
        notificacionesSistema = [];
        const estadoCounts = {};
        const prioridades = ['critica', 'urgente', 'alta', 'media', 'baja'];
        
        casos.forEach(caso => {
            estadoCounts[caso.estado] = (estadoCounts[caso.estado] || 0) + 1;
        });

        let id = 1;
        const tipos = ['critical', 'warning', 'info', 'security'];
        const iconos = ['fa-server', 'fa-database', 'fa-shield-alt', 'fa-exclamation-triangle'];
        
        // Notificaciones de casos críticos
        const casosCriticos = casos.filter(c => c.prioridad === 'critica' || c.prioridad === 'urgente');
        if (casosCriticos.length > 0) {
            notificacionesSistema.push({
                id: id++,
                tipo: 'critical',
                titulo: `${casosCriticos.length} casos de prioridad crítica/urgente`,
                mensaje: `Hay ${casosCriticos.length} casos que requieren atención inmediata`,
                fecha: new Date().toLocaleString('es-ES'),
                origen: 'Monitor Sistema',
                estado: 'unread',
                prioridad: 'high',
                icon: 'fa-exclamation-circle'
            });
        }

        // Notificaciones de resumen por estado
        Object.entries(estadoCounts).forEach(([estado, count]) => {
            if (count > 0) {
                const estadoMap = {
                    'abierto': { text: 'Abiertos', icon: 'fa-unlock' },
                    'en_progreso': { text: 'En Progreso', icon: 'fa-hourglass-half' },
                    'pausado': { text: 'Pausados', icon: 'fa-pause' },
                    'resuelto': { text: 'Resueltos', icon: 'fa-check-circle' },
                    'cerrado': { text: 'Cerrados', icon: 'fa-check-double' }
                };
                
                const info = estadoMap[estado] || { text: estado, icon: 'fa-info-circle' };
                
                notificacionesSistema.push({
                    id: id++,
                    tipo: 'info',
                    titulo: `${count} casos ${info.text.toLowerCase()}`,
                    mensaje: `Resumen de casos en estado: ${info.text}`,
                    fecha: new Date().toLocaleString('es-ES'),
                    origen: 'Monitor Sistema',
                    estado: 'read',
                    prioridad: 'low',
                    icon: info.icon
                });
            }
        });

        // Notificación de últimas actualizaciones
        if (casos.length > 0) {
            notificacionesSistema.push({
                id: id++,
                tipo: 'info',
                titulo: `Base de datos sincronizada`,
                mensaje: `${casos.length} casos cargados correctamente desde la BD`,
                fecha: new Date().toLocaleString('es-ES'),
                origen: 'Sistema Base de Datos',
                estado: 'read',
                prioridad: 'low',
                icon: 'fa-database'
            });
        }
    }

    function generarNotificacionesDeUsuarios(casos) {
        notificacionesUsuarios = [];
        const usuarios = new Set();
        const tecnicos = new Set();
        let id = 101;

        casos.forEach(caso => {
            if (caso.autor) usuarios.add(caso.autor);
            if (caso.asignado_a) tecnicos.add(caso.asignado_a);
        });

        // Notificaciones de usuarios activos
        const usuariosArray = Array.from(usuarios);
        usuariosArray.slice(0, 3).forEach((usuario, index) => {
            const casosPorUsuario = casos.filter(c => c.autor === usuario).length;
            notificacionesUsuarios.push({
                id: id++,
                tipo: 'activity',
                titulo: `${usuario} ha creado ${casosPorUsuario} caso(s)`,
                mensaje: `${usuario} es responsable de ${casosPorUsuario} casos en el sistema`,
                fecha: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleString('es-ES'),
                usuario: usuario,
                estado: index === 0 ? 'unread' : 'read',
                icon: 'fa-user-check'
            });
        });

        // Notificaciones de técnicos activos
        const tecnicosArray = Array.from(tecnicos);
        tecnicosArray.slice(0, 2).forEach((tecnico, index) => {
            const casosAsignados = casos.filter(c => c.asignado_a === tecnico).length;
            notificacionesUsuarios.push({
                id: id++,
                tipo: 'activity',
                titulo: `${tecnico} tiene ${casosAsignados} caso(s) asignado(s)`,
                mensaje: `${tecnico} está trabajando en ${casosAsignados} casos actualmente`,
                fecha: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleString('es-ES'),
                usuario: tecnico,
                estado: 'read',
                icon: 'fa-users'
            });
        });
    }

    // Actualizar estadísticas
    function updateStats() {
        const criticalCount = notificacionesSistema.filter(n => n.prioridad === 'high').length;
        const systemCount = notificacionesSistema.length;
        const systemNewCount = notificacionesSistema.filter(n => n.estado === 'unread').length;
        const usersCount = notificacionesUsuarios.length;
        const usersNewCount = notificacionesUsuarios.filter(n => n.estado === 'unread').length;
        const securityCount = notificacionesSistema.filter(n => n.tipo === 'security' || n.tipo === 'critical').length;
        const databaseCount = notificacionesSistema.filter(n => n.origen.includes('Base de Datos') || n.origen.includes('Database')).length;
        
        // Total de sin leer
        const totalUnread = systemNewCount + usersNewCount;

        if (document.getElementById('criticalCount')) document.getElementById('criticalCount').textContent = criticalCount;
        if (document.getElementById('systemCount')) document.getElementById('systemCount').textContent = systemCount;
        if (document.getElementById('systemNewCount')) document.getElementById('systemNewCount').textContent = systemNewCount;
        if (document.getElementById('usersCount')) document.getElementById('usersCount').textContent = usersCount;
        if (document.getElementById('usersNewCount')) document.getElementById('usersNewCount').textContent = usersNewCount;
        if (document.getElementById('securityCount')) document.getElementById('securityCount').textContent = securityCount;
        if (document.getElementById('databaseCount')) document.getElementById('databaseCount').textContent = databaseCount;
        if (document.querySelector('.notification-count')) document.querySelector('.notification-count').textContent = criticalCount;

        // Actualizar badge dinámicamente
        const badgeNotif = document.getElementById('badgeNotif');
        if (badgeNotif) {
            if (totalUnread > 0) {
                badgeNotif.textContent = totalUnread;
                badgeNotif.style.display = 'inline-flex';
            } else {
                badgeNotif.style.display = 'none';
            }
        }
    }

    // Renderizar notificaciones del sistema
    function renderSystemNotifications() {
        systemNotifications.innerHTML = '';
        
        notificacionesSistema.forEach((notif, index) => {
            const notificationElement = document.createElement('div');
            notificationElement.className = `notification-item notification-${notif.tipo} notification-${notif.estado}`;
            notificationElement.style.animation = `slideInUp ${0.3 + index * 0.05}s ease-out`;
            
            let priorityText = '';
            if (notif.prioridad === 'high') priorityText = 'ALTA';
            else if (notif.prioridad === 'medium') priorityText = 'MEDIA';
            else if (notif.prioridad === 'low') priorityText = 'BAJA';
            
            notificationElement.innerHTML = `
                <div class="notification-content">
                    <div class="notification-header">
                        <div class="notification-icon-container">
                            <i class="fas ${notif.icon} notification-icon"></i>
                        </div>
                        <div class="notification-details">
                            <div class="notification-title-row">
                                <div>
                                    <h3 class="notification-title">${notif.titulo}
                                        ${notif.estado === 'unread' ? '<span class="unread-indicator"></span>' : ''}
                                    </h3>
                                    <div class="notification-meta">
                                        ${notif.prioridad ? `<span class="priority-badge priority-${notif.prioridad}">${priorityText}</span>` : ''}
                                        <span class="notification-source">${notif.origen}</span>
                                        <span class="notification-time">${notif.fecha}</span>
                                    </div>
                                </div>
                            </div>
                            <p class="notification-message">${notif.mensaje}</p>
                            <div class="notification-actions">
                                <button class="btn-view" data-id="${notif.id}" onclick="markAsRead(this); return false;">
                                    <i class="fas fa-eye"></i>
                                    Marcar leído
                                </button>
                                <button class="btn-delete" data-id="${notif.id}" data-type="system" onclick="deleteNotification(${notif.id}, 'system'); return false;">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            systemNotifications.appendChild(notificationElement);
        });
    }

    // Renderizar notificaciones de usuarios
    function renderUserNotifications() {
        userNotifications.innerHTML = '';
        
        notificacionesUsuarios.forEach((notif, index) => {
            const notificationElement = document.createElement('div');
            notificationElement.className = `notification-item notification-${notif.tipo} notification-${notif.estado}`;
            notificationElement.style.animation = `slideInUp ${0.3 + index * 0.05}s ease-out`;
            
            notificationElement.innerHTML = `
                <div class="notification-content">
                    <div class="notification-header">
                        <div class="notification-icon-container">
                            <i class="fas ${notif.icon} notification-icon"></i>
                        </div>
                        <div class="notification-details">
                            <div class="notification-title-row">
                                <div>
                                    <h3 class="notification-title">${notif.titulo}
                                        ${notif.estado === 'unread' ? '<span class="unread-indicator"></span>' : ''}
                                    </h3>
                                    <div class="notification-meta">
                                        <span class="notification-source">Usuario: ${notif.usuario}</span>
                                        <span class="notification-time">${notif.fecha}</span>
                                    </div>
                                </div>
                            </div>
                            <p class="notification-message">${notif.mensaje}</p>
                            <div class="notification-actions">
                                <button class="btn-resolve" onclick="markAsRead(this); return false;">
                                    Marcar leído
                                </button>
                                <button class="btn-delete" data-id="${notif.id}" data-type="users" onclick="deleteNotification(${notif.id}, 'users'); return false;">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            userNotifications.appendChild(notificationElement);
        });
    }

    // Eliminar notificación
    window.deleteNotification = function(id, type) {
        if (type === 'system') {
            const index = notificacionesSistema.findIndex(n => n.id === id);
            if (index !== -1) {
                notificacionesSistema.splice(index, 1);
                renderSystemNotifications();
            }
        } else {
            const index = notificacionesUsuarios.findIndex(n => n.id === id);
            if (index !== -1) {
                notificacionesUsuarios.splice(index, 1);
                renderUserNotifications();
            }
        }
        updateStats();
    };

    window.markAsRead = function(btn) {
        btn.textContent = '✓ Leído';
        btn.disabled = true;
    };

    // Cambiar entre pestañas
    function switchTab(tabId) {
        // Ocultar todas las pestañas
        if (systemTab) systemTab.classList.remove('active');
        if (usersTab) usersTab.classList.remove('active');
        if (sendTab) sendTab.classList.remove('active');
        
        // Remover clase active de todos los botones
        tabButtons.forEach(btn => btn.classList.remove('active'));
        
        // Mostrar la pestaña seleccionada
        if (tabId === 'system') {
            if (systemTab) systemTab.classList.add('active');
            const btn = document.querySelector('[data-tab="system"]');
            if (btn) btn.classList.add('active');
        } else if (tabId === 'users') {
            if (usersTab) usersTab.classList.add('active');
            const btn = document.querySelector('[data-tab="users"]');
            if (btn) btn.classList.add('active');
        } else if (tabId === 'send') {
            if (sendTab) sendTab.classList.add('active');
            const btn = document.querySelector('[data-tab="send"]');
            if (btn) btn.classList.add('active');
        }
    }

    // Marcar todas como leídas
    function markAllAsRead() {
        notificacionesSistema.forEach(notif => notif.estado = 'read');
        notificacionesUsuarios.forEach(notif => notif.estado = 'read');
        
        renderSystemNotifications();
        renderUserNotifications();
        updateStats();
        
        showNotification('Todas las notificaciones marcadas como leídas', 'success');
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
        
        // Configurar botón "Marcar todas como leídas"
        if (btnMarkRead) {
            btnMarkRead.addEventListener('click', markAllAsRead);
        }
        
        // Configurar botón "Enviar Notificación" en el header
        if (sendNotificationBtn) {
            sendNotificationBtn.addEventListener('click', function() {
                switchTab('send');
            });
        }
        
        // Configurar modal
        if (modalClose) {
            modalClose.addEventListener('click', function() {
                if (notificationModal) notificationModal.style.display = 'none';
            });
        }
        
        // Configurar formulario de notificación
        if (notificationForm) {
            notificationForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const title = document.getElementById('notificationTitle').value;
                const message = document.getElementById('notificationMessage').value;
                const type = document.getElementById('notificationType').value;
                const recipients = document.getElementById('recipients').value;
                
                if (title.trim() && message.trim()) {
                    showNotification(`Notificación enviada a: ${recipients}`, 'success');
                    
                    // Resetear formulario
                    notificationForm.reset();
                    
                    // Cambiar a la pestaña de sistema
                    switchTab('system');
                    
                    // Recargar datos
                    loadDataFromAPI();
                } else {
                    showNotification('Por favor complete todos los campos requeridos', 'error');
                }
            });
        }
        
        // Cerrar modal al hacer clic fuera de él
        window.addEventListener('click', function(e) {
            if (e.target === notificationModal) {
                notificationModal.style.display = 'none';
            }
        });
    }

    // Auto-refresh every 30 seconds
    setInterval(() => {
        loadDataFromAPI();
    }, 30000);

    // Inicializar la aplicación
    init();
});