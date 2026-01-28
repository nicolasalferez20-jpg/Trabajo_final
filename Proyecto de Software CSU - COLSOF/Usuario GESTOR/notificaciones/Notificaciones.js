document.addEventListener('DOMContentLoaded', async () => {
  const listContainer = document.getElementById('notificationList');
  const filters = document.querySelectorAll('.filters button');

  let notifications = [];

  // 1. Cargar notificaciones desde los casos de la BD
  async function loadNotifications() {
    if(listContainer) {
      listContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#666;"><span style="opacity:0.7;">⏳ Cargando notificaciones...</span></div>';
    }
    
    try {
      // Usar window.api del app-init.js global
      if (!window.api) throw new Error('API no cargada. Verifica app-init.js');
      
      const casos = await window.api.getCasos();
      
      console.log('✅ Notificaciones cargadas desde la API:', casos.length);
      
      // Generar notificaciones dinámicas desde los casos
      notifications = generateNotificationsFromCasos(casos);
      
      renderNotifications('all');
      updateBadgeWithUnreadUrgent();
      updateFilterBadges();
    } catch (err) {
      console.warn('⚠️ Error al cargar notificaciones desde API:', err);
      console.log('➡️ Cargando notificaciones de ejemplo...');
      
      // Cargar notificaciones de ejemplo cuando no hay conexión
      notifications = generarNotificacionesEjemplo();
      
      renderNotifications('all');
      updateBadgeWithUnreadUrgent();
      updateFilterBadges();
      
      // Mostrar toast informativo
      mostrarToast('📬 Mostrando notificaciones de ejemplo (sin conexión a BD)', false);
    }
  }

  // Generar notificaciones de ejemplo para demostración
  function generarNotificacionesEjemplo() {
    const ahora = new Date();
    const ejemplos = [];
    
    // Notificaciones urgentes recientes
    ejemplos.push({
      id: 1,
      titulo: 'Hardware: Sistema Central',
      mensaje: 'Fallo crítico en servidor principal - Requiere atención inmediata',
      tipo: 'urgente',
      fecha: formatFecha(new Date(ahora - 15 * 60000)), // 15 min
      leido: false,
      prioridad: 'Crítica',
      estado: 'Abierto'
    });

    ejemplos.push({
      id: 2,
      titulo: 'Red: Conexión Corp',
      mensaje: 'Pérdida intermitente de conectividad en sede principal',
      tipo: 'urgente',
      fecha: formatFecha(new Date(ahora - 45 * 60000)), // 45 min
      leido: false,
      prioridad: 'Alta',
      estado: 'En Progreso'
    });

    // Asignaciones nuevas
    ejemplos.push({
      id: 3,
      titulo: 'Software: Suite Office',
      mensaje: 'Te han asignado: Actualización de licencias Microsoft 365',
      tipo: 'asignacion',
      fecha: formatFecha(new Date(ahora - 2 * 3600000)), // 2 horas
      leido: false,
      prioridad: 'Media',
      estado: 'Asignado'
    });

    ejemplos.push({
      id: 4,
      titulo: 'Hardware: Impresora',
      mensaje: 'Te han asignado: Mantenimiento preventivo impresora HP',
      tipo: 'asignacion',
      fecha: formatFecha(new Date(ahora - 4 * 3600000)), // 4 horas
      leido: false,
      prioridad: 'Baja',
      estado: 'Asignado'
    });

    // Notificaciones del sistema
    ejemplos.push({
      id: 5,
      titulo: 'Sistema: Backup completado',
      mensaje: 'Respaldo automático ejecutado exitosamente - 2.3 GB',
      tipo: 'sistema',
      fecha: formatFecha(new Date(ahora - 6 * 3600000)), // 6 horas
      leido: true,
      prioridad: 'Baja',
      estado: 'Completado'
    });

    ejemplos.push({
      id: 6,
      titulo: 'Seguridad: Actualización',
      mensaje: 'Nuevos parches de seguridad disponibles para instalación',
      tipo: 'sistema',
      fecha: formatFecha(new Date(ahora - 12 * 3600000)), // 12 horas
      leido: true,
      prioridad: 'Media',
      estado: 'Pendiente'
    });

    ejemplos.push({
      id: 7,
      titulo: 'Telefonía: Nueva solicitud',
      mensaje: 'Configuración de extensión para nuevo empleado',
      tipo: 'asignacion',
      fecha: formatFecha(new Date(ahora - 20 * 3600000)), // 20 horas
      leido: true,
      prioridad: 'Media',
      estado: 'Pausado'
    });

    ejemplos.push({
      id: 8,
      titulo: 'Red: Mantenimiento programado',
      mensaje: 'Mantenimiento de switches completado sin incidencias',
      tipo: 'sistema',
      fecha: formatFecha(new Date(ahora - 36 * 3600000)), // 1.5 días
      leido: true,
      prioridad: 'Baja',
      estado: 'Cerrado'
    });

    return ejemplos;
  }

  function mostrarToast(mensaje, esError = false) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${esError ? '#dc2626' : '#15467b'};
      color: white;
      padding: 14px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideIn 0.3s ease;
      max-width: 400px;
      font-size: 14px;
    `;
    toast.textContent = mensaje;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Generar notificaciones desde casos de servicio de la BD
  function generateNotificationsFromCasos(casos) {
    if (!casos || casos.length === 0) return [];
    
    return casos.map((caso, idx) => {
      const fecha = new Date(caso.fecha_creacion);
      const horasDesdeCreacion = (Date.now() - fecha.getTime()) / 3600000;
      
      // Determinar si está leída: casos más antiguos de 24h se marcan como leídos
      const leido = horasDesdeCreacion > 24;
      
      // Determinar tipo de notificación basado en múltiples factores
      let tipo = 'sistema';
      const estadoLower = (caso.estado || '').toLowerCase();
      const prioridadLower = (caso.prioridad || '').toLowerCase();
      
      // Casos urgentes/críticos son tipo 'urgente'
      if (prioridadLower.includes('critica') || 
          prioridadLower.includes('critico') || 
          prioridadLower.includes('urgente')) {
        tipo = 'urgente';
      }
      // Casos asignados o con asignación reciente son tipo 'asignacion'
      else if (caso.asignado_a || estadoLower === 'asignado') {
        tipo = 'asignacion';
      }
      // Estados del sistema (cerrado, completado, backup, etc.)
      else if (estadoLower === 'cerrado' || 
               estadoLower === 'completado' ||
               estadoLower === 'resuelto' ||
               estadoLower === 'solucionado') {
        tipo = 'sistema';
      }
      
      // Generar mensaje descriptivo basado en el caso
      let mensaje = caso.descripcion || 'Sin descripción';
      
      // Agregar contexto adicional al mensaje según el estado
      if (estadoLower === 'abierto' && horasDesdeCreacion < 1) {
        mensaje = `Nuevo caso abierto: ${mensaje}`;
      } else if (caso.asignado_a && horasDesdeCreacion < 2) {
        mensaje = `Te han asignado: ${mensaje}`;
      } else if (estadoLower === 'pausado') {
        mensaje = `Caso pausado - ${mensaje}`;
      } else if (estadoLower === 'cerrado') {
        mensaje = `Caso cerrado - ${mensaje}`;
      }
      
      return {
        id: caso.id || idx,
        titulo: `${caso.categoria || 'Caso'}: ${caso.cliente || 'Sin cliente'}`,
        mensaje: mensaje,
        tipo: tipo,
        fecha: formatFecha(fecha),
        leido: leido,
        prioridad: caso.prioridad || 'Media',
        estado: caso.estado || 'Abierto',
        casoId: caso.id,
        asignadoA: caso.asignado_a,
        categoria: caso.categoria
      };
    })
    // Ordenar por fecha más reciente primero
    .sort((a, b) => {
      const fechaA = new Date(a.fecha);
      const fechaB = new Date(b.fecha);
      return fechaB - fechaA;
    });
  }

  function formatFecha(date) {
    const ahora = new Date();
    const diff = ahora - date;
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);
    
    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `${minutos}m`;
    if (horas < 24) return `${horas}h`;
    if (dias < 7) return `${dias}d`;
    return date.toLocaleDateString('es-CO');
  }

  // 2. Renderizar lista con colores profesionales
  function renderNotifications(filterType) {
    if (!listContainer) return;
    listContainer.innerHTML = '';
    
    const filtered = notifications.filter(n => {
      if (filterType === 'all') return true;
      if (filterType === 'unread') return !n.leido;
      return n.tipo === filterType;
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = `<div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>Sin notificaciones</h3>
        <p>No hay notificaciones en esta categoría</p>
      </div>`;
      return;
    }

    filtered.forEach((n, idx) => {
      const div = document.createElement('div');
      const badge = getBadgeClass(n.tipo);
      const prioridad = getPrioridadClass(n.prioridad);
      const iconoTipo = getIconoTipo(n.tipo);
      const timestamp = n.fecha;
      
      div.className = `notification ${n.leido ? '' : 'unread'} ${prioridad}`;
      div.setAttribute('data-id', n.id);
      
      div.innerHTML = `
        <div class="notification-header">
          <div class="notification-icon ${badge}">${iconoTipo}</div>
          <div class="notification-meta">
            <h3 class="notification-title">${escapeHtml(n.titulo)}</h3>
            <p class="notification-message">${escapeHtml(n.mensaje)}</p>
          </div>
          <div class="notification-right">
            <span class="notification-time">${timestamp}</span>
            <span class="notification-badge ${badge}">${getTextoBadge(n.tipo)}</span>
          </div>
        </div>
        <div class="notification-footer">
          <div class="notification-status">
            <small>Estado: <strong>${n.estado}</strong></small>
            <small>Prioridad: <strong>${n.prioridad}</strong></small>
          </div>
          <div class="notification-actions">
            <button class="btn-action read" title="Marcar como leída">✓</button>
            <button class="btn-action delete" title="Eliminar">✕</button>
          </div>
        </div>
      `;
      
      // Agregar eventos
      div.querySelector('.read')?.addEventListener('click', (e) => {
        e.stopPropagation(); // Evitar que abra el modal
        markAsRead(idx, n);
        div.classList.remove('unread');
      });
      
      div.querySelector('.delete')?.addEventListener('click', (e) => {
        e.stopPropagation(); // Evitar que abra el modal
        div.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => div.remove(), 300);
      });
      
      // Agregar evento click para abrir modal con detalles
      div.addEventListener('click', () => {
        openNotificationModal(n);
      });
      
      listContainer.appendChild(div);
    });
  }

  function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  function getBadgeClass(tipo) {
    const clases = {
      'urgente': 'badge-red',
      'asignacion': 'badge-blue',
      'sistema': 'badge-gray'
    };
    return clases[tipo] || 'badge-gray';
  }

  function getPrioridadClass(prioridad) {
    if (!prioridad) return '';
    const p = prioridad.toLowerCase();
    if (p.includes('critica') || p.includes('critico')) return 'priority-critical';
    if (p === 'alta') return 'priority-high';
    if (p === 'media') return 'priority-medium';
    return 'priority-low';
  }

  function getIconoTipo(tipo) {
    const iconos = {
      'urgente': '⚠️',
      'asignacion': '👤',
      'sistema': 'ℹ️'
    };
    return iconos[tipo] || 'ℹ️';
  }

  function getTextoBadge(tipo) {
    const textos = {
      'urgente': 'Urgente',
      'asignacion': 'Asignación',
      'sistema': 'Sistema'
    };
    return textos[tipo] || 'Notificación';
  }

  function markAsRead(idx, notification) {
    notification.leido = true;
    updateBadgeWithUnreadUrgent();
    updateFilterBadges();
  }

  // Actualizar badge solo con notificaciones sin leer o urgentes
  function updateBadgeWithUnreadUrgent() {
    const unreadOrUrgent = notifications.filter(n => !n.leido || n.tipo === 'urgente');
    const count = unreadOrUrgent.length;
    const badge = document.getElementById('notificationBadge');
    
    if (badge) {
      badge.textContent = count;
      badge.classList.toggle('hidden', count === 0);
    }
  }

  // Actualizar badges de los filtros con contadores
  function updateFilterBadges() {
    // Contar todas
    const totalCount = notifications.length;
    document.getElementById('badge-all').textContent = totalCount;
    
    // Contar no leídas
    const unreadCount = notifications.filter(n => !n.leido).length;
    document.getElementById('badge-unread').textContent = unreadCount;
    
    // Contar urgentes
    const urgenteCount = notifications.filter(n => n.tipo === 'urgente').length;
    document.getElementById('badge-urgente').textContent = urgenteCount;
    
    // Contar asignaciones
    const asignacionCount = notifications.filter(n => n.tipo === 'asignacion').length;
    document.getElementById('badge-asignacion').textContent = asignacionCount;
    
    // Contar sistema
    const sistemaCount = notifications.filter(n => n.tipo === 'sistema').length;
    document.getElementById('badge-sistema').textContent = sistemaCount;
  }

  // Eventos de filtros
  filters.forEach(btn => btn.addEventListener('click', () => { 
    filters.forEach(b => b.classList.remove('active')); 
    btn.classList.add('active'); 
    renderNotifications(btn.dataset.filter); 
  }));

  // Evento botón "Marcar todas como leídas"
  const markAllBtn = document.getElementById('markAllBtn');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', () => {
      // Marcar todas las notificaciones como leídas
      notifications.forEach(n => n.leido = true);
      
      // Re-renderizar la vista actual
      const activeFilter = document.querySelector('.filters button.active');
      const currentFilter = activeFilter ? activeFilter.dataset.filter : 'all';
      renderNotifications(currentFilter);
      
      // Actualizar badges
      updateBadgeWithUnreadUrgent();
      updateFilterBadges();
      
      // Mostrar confirmación
      mostrarToast('✓ Todas las notificaciones marcadas como leídas', false);
    });
  }

  // Cargar notificaciones iniciales
  loadNotifications();

  // Actualizar notificaciones automáticamente cada 2 minutos
  setInterval(async () => {
    try {
      if (!window.api) return;
      
      const casos = await window.api.getCasos();
      console.log('🔄 Notificaciones actualizadas:', casos.length, 'casos');
      
      // Mantener el estado de leído de las notificaciones existentes
      const notificacionesNuevas = generateNotificationsFromCasos(casos);
      
      // Preservar el estado 'leido' para notificaciones que ya existían
      notificacionesNuevas.forEach(nueva => {
        const existente = notifications.find(n => n.casoId === nueva.casoId);
        if (existente && existente.leido) {
          nueva.leido = true;
        }
      });
      
      notifications = notificacionesNuevas;
      
      // Re-renderizar solo si estamos en la página de notificaciones
      if (document.getElementById('notificationList')) {
        const activeFilter = document.querySelector('.filters button.active');
        const currentFilter = activeFilter ? activeFilter.dataset.filter : 'all';
        renderNotifications(currentFilter);
        updateBadgeWithUnreadUrgent();
        updateFilterBadges();
      }
    } catch (err) {
      console.error('Error actualizando notificaciones:', err);
    }
  }, 120000); // 2 minutos

  // ===== FUNCIONALIDAD DEL MODAL =====
  
  const modal = document.getElementById('notificationModal');
  const modalClose = document.getElementById('modalClose');
  const modalMarkRead = document.getElementById('modalMarkRead');
  const modalViewCase = document.getElementById('modalViewCase');
  
  let currentNotification = null;
  
  // Función para abrir el modal con la información de la notificación
  function openNotificationModal(notification) {
    currentNotification = notification;
    
    // Cargar información en el modal
    document.getElementById('modalCasoId').textContent = notification.casoId || 'N/A';
    document.getElementById('modalCategoria').textContent = notification.categoria || 'Sin categoría';
    document.getElementById('modalCliente').textContent = extractClienteFromTitle(notification.titulo);
    document.getElementById('modalEstado').textContent = notification.estado || 'Sin estado';
    document.getElementById('modalPrioridad').textContent = notification.prioridad || 'Sin prioridad';
    document.getElementById('modalAsignado').textContent = notification.asignadoA || 'Sin asignar';
    document.getElementById('modalDescripcion').textContent = notification.mensaje || 'Sin descripción';
    document.getElementById('modalFechaCreacion').textContent = notification.fecha || 'N/A';
    document.getElementById('modalFechaActualizacion').textContent = notification.fecha || 'N/A';
    
    // Aplicar estilos según el estado
    const estadoBadge = document.getElementById('modalEstado');
    estadoBadge.className = 'status-badge';
    const estadoLower = (notification.estado || '').toLowerCase();
    
    if (estadoLower.includes('abierto') || estadoLower.includes('pendiente')) {
      estadoBadge.style.background = '#dbeafe';
      estadoBadge.style.color = '#1e40af';
    } else if (estadoLower.includes('proceso') || estadoLower.includes('asignado')) {
      estadoBadge.style.background = '#fef3c7';
      estadoBadge.style.color = '#92400e';
    } else if (estadoLower.includes('pausado')) {
      estadoBadge.style.background = '#fecaca';
      estadoBadge.style.color = '#991b1b';
    } else if (estadoLower.includes('cerrado') || estadoLower.includes('completado') || estadoLower.includes('resuelto')) {
      estadoBadge.style.background = '#d1fae5';
      estadoBadge.style.color = '#065f46';
    }
    
    // Aplicar estilos según la prioridad
    const prioridadBadge = document.getElementById('modalPrioridad');
    prioridadBadge.className = 'priority-badge';
    const prioridadLower = (notification.prioridad || '').toLowerCase();
    
    if (prioridadLower.includes('critica') || prioridadLower.includes('urgente')) {
      prioridadBadge.style.background = '#fee2e2';
      prioridadBadge.style.color = '#991b1b';
    } else if (prioridadLower.includes('alta')) {
      prioridadBadge.style.background = '#fed7aa';
      prioridadBadge.style.color = '#9a3412';
    } else if (prioridadLower.includes('media')) {
      prioridadBadge.style.background = '#fef3c7';
      prioridadBadge.style.color = '#92400e';
    } else {
      prioridadBadge.style.background = '#e5e7eb';
      prioridadBadge.style.color = '#374151';
    }
    
    // Mostrar modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  // Función para cerrar el modal
  function closeNotificationModal() {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    currentNotification = null;
  }
  
  // Función para extraer el cliente del título
  function extractClienteFromTitle(titulo) {
    if (!titulo) return 'Sin cliente';
    const parts = titulo.split(':');
    return parts.length > 1 ? parts[1].trim() : 'Sin cliente';
  }
  
  // Event listeners del modal
  modalClose?.addEventListener('click', closeNotificationModal);
  
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeNotificationModal();
    }
  });
  
  modalMarkRead?.addEventListener('click', () => {
    if (currentNotification) {
      currentNotification.leido = true;
      
      // Actualizar la notificación en el array principal
      const idx = notifications.findIndex(n => n.id === currentNotification.id);
      if (idx !== -1) {
        notifications[idx].leido = true;
      }
      
      // Re-renderizar
      const activeFilter = document.querySelector('.filters button.active');
      const currentFilter = activeFilter ? activeFilter.dataset.filter : 'all';
      renderNotifications(currentFilter);
      updateBadgeWithUnreadUrgent();
      updateFilterBadges();
      
      mostrarToast('✓ Notificación marcada como leída', false);
      closeNotificationModal();
    }
  });
  
  modalViewCase?.addEventListener('click', () => {
    if (currentNotification && currentNotification.casoId) {
      // Redirigir a la página de casos (ajustar según la estructura del proyecto)
      // Por ahora solo mostramos un mensaje
      mostrarToast(`Redirigiendo al caso #${currentNotification.casoId}`, false);
      
      // Aquí podrías implementar la navegación real, por ejemplo:
      // window.location.href = `../Casos/Mis Casos/Mis Casos.html?casoId=${currentNotification.casoId}`;
      
      closeNotificationModal();
    }
  });
  
  // Cerrar modal con tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeNotificationModal();
    }
  });

});