'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // =====================
  // Helpers
  // =====================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const currentUserName = document.querySelector('.profile-name')?.textContent?.trim() || 'Gestor asignado';

  // Formato de ID de casos (prefijo 030 + padding)
  const formatCaseId = (id) => `030${String(id ?? '').padStart(9, '0')}`;

  // Colores por estado
  const estadoMeta = {
    'abierto': { clase: 'abierto', etiqueta: 'Abierto', color: '#16a34a' },
    'en_progreso': { clase: 'progreso', etiqueta: 'En Progreso', color: '#f59e0b' },
    'en progreso': { clase: 'progreso', etiqueta: 'En Progreso', color: '#f59e0b' },
    'pausado': { clase: 'pausado', etiqueta: 'Pausado', color: '#6b7280' },
    'resuelto': { clase: 'resuelto', etiqueta: 'Resuelto', color: '#2563eb' },
    'cerrado': { clase: 'cerrado', etiqueta: 'Cerrado', color: '#0f172a' },
    'cancelado': { clase: 'cancelado', etiqueta: 'Cancelado', color: '#a855f7' }
  };

  // Colores por prioridad
  const prioridadMeta = {
    'critica': { clase: 'critica', color: '#b91c1c', label: 'CrÃ­tica' },
    'urgente': { clase: 'critica', color: '#b91c1c', label: 'Urgente' },
    'alta': { clase: 'alta', color: '#f97316', label: 'Alta' },
    'media': { clase: 'media', color: '#facc15', label: 'Media' },
    'baja': { clase: 'baja', color: '#16a34a', label: 'Baja' }
  };

  let casesPaginationInitialized = false;

  const resolveLoginPath = () => {
    const href = window.location.href;
    const encodedMarker = 'Proyecto%20de%20Software%20CSU%20-%20COLSOF';
    if (href.includes(encodedMarker)) return href.split(encodedMarker)[0] + `${encodedMarker}/index.html`;

    const plainMarker = 'Proyecto de Software CSU - COLSOF';
    if (href.includes(plainMarker)) return href.split(plainMarker)[0] + `${plainMarker}/index.html`;

    return '/index.html';
  };

  const loginPath = resolveLoginPath();
  $$('.logout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      alert('SesiÃ³n cerrada.');
      window.location.href = loginPath;
    });
  });


  // Estilos rÃ¡pidos para el menÃº contextual y modales
  (function injectCaseMenuStyles() {
    if (document.getElementById('case-menu-styles')) return;
    const style = document.createElement('style');
    style.id = 'case-menu-styles';
    style.textContent = `
      .case-menu { position: fixed; background: #fff; border: 1px solid #e5e7eb; box-shadow: 0 10px 30px rgba(0,0,0,0.12); border-radius: 10px; padding: 8px; z-index: 9999; min-width: 180px; }
      .case-menu button { width: 100%; text-align: left; background: none; border: none; padding: 10px 12px; border-radius: 8px; cursor: pointer; color: #111827; font-weight: 600; }
      .case-menu button:hover:not(:disabled) { background: #f3f4f6; }
      .case-menu button:disabled { color: #9ca3af; cursor: not-allowed; }
      .case-menu .danger { color: #b91c1c; }
      .case-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 9998; }
      .case-modal { background: #fff; border-radius: 14px; padding: 20px; width: min(640px, 90vw); box-shadow: 0 20px 50px rgba(0,0,0,0.18); }
      .case-modal h3 { margin-bottom: 10px; }
      .case-modal .field { margin-bottom: 12px; }
      .case-modal label { display: block; font-weight: 700; margin-bottom: 4px; color: #111827; }
      .case-modal input, .case-modal select, .case-modal textarea { width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px; font: inherit; }
      .case-modal textarea { min-height: 100px; resize: vertical; }
      .case-modal .actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 14px; }
      .case-modal .btn { padding: 10px 16px; border-radius: 10px; border: none; cursor: pointer; font-weight: 700; }
      .case-modal .btn.cancel { background: #e5e7eb; color: #111827; }
      .case-modal .btn.primary { background: #2563eb; color: #fff; }
      .case-modal .timeline { margin-top: 12px; padding-left: 10px; border-left: 3px solid #e5e7eb; color: #374151; }
      .case-modal .timeline-item { margin-bottom: 8px; }
      .case-modal .timeline-item strong { color: #111827; }
    `;
    document.head.appendChild(style);
  })();

  const empresasBogota = [
    'Ecopetrol', 'Bancolombia', 'Davivienda', 'Avianca', 'Claro Colombia',
    'Movistar Colombia', 'ETB', 'Tigo Une', 'Grupo Ã‰xito', 'PostobÃ³n',
    'Alpina', 'Nutresa', 'Carvajal', 'Compensar', 'Sura', 'Seguros BolÃ­var'
  ];

  // API base (local: http://localhost:3001/api, producciÃ³n: {origin}/api, file:// -> localhost)
  const getApiUrl = () => {
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '';
    if (isLocal) return 'http://localhost:3001/api';
    return `${window.location.protocol}//${host}${port}/api`;
  };

  // =====================
  // Actualizar Badge de Notificaciones
  // =====================
  function updateBadgeWithUnreadUrgent() {
    // TODO: Implementar endpoint para notificaciones
    return;
    /* DESHABILITADO POR AHORA
    fetch(getApiUrl() + '?action=get_notifications')
      .then(res => {
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        return res.text().then(text => {
          try {
            return JSON.parse(text);
          } catch (e) {
            return [];
          }

      })
      .then(notifications => {
        const unreadOrUrgent = notifications.filter(n => !n.leido || n.tipo === 'urgente');
        const count = unreadOrUrgent.length;
        const badge = document.getElementById('notificationBadge');
        
        if (badge) {
          badge.textContent = count;
          badge.classList.toggle('hidden', count === 0);
        }
      })
      .catch(err => console.error('Error al actualizar badge:', err));
  }
  */

  // Cierre de la funciÃ³n de badge (bloque comentado arriba)
  }

  // Actualizar badge al cargar la pÃ¡gina
  updateBadgeWithUnreadUrgent();
  // Actualizar cada 30 segundos
  setInterval(updateBadgeWithUnreadUrgent, 30000);

  // Determinar si estamos en una subcarpeta
  const isInSubfolder = () => {
    return window.location.pathname.includes('estadisticas') ||
           window.location.pathname.includes('notificaciones') ||
           window.location.pathname.includes('reportes') ||
           window.location.pathname.includes('herramientas') ||
           window.location.pathname.includes('configuracion') ||
           window.location.pathname.includes('Casos') ||
           window.location.pathname.includes('Centro de costos') ||
           window.location.pathname.includes('Clientes');
  };

  // Interceptar enlaces del menÃº (excepto Inicio si existe)
  $$('.menu-list a').forEach(a => {
    if (a.id === 'link-inicio' || a.getAttribute('href').includes('Menu principal.html')) return; // dejar navegar

    const inSubfolder = isInSubfolder();

    // Permitir navegaciÃ³n a Notificaciones
    if (a.textContent.includes('Notificaciones') || a.querySelector('.badge')) {
      a.href = inSubfolder ? '../notificaciones/Menu - Notificaciones.html' : 'notificaciones/Menu - Notificaciones.html';
      return;
    }

    // Permitir navegaciÃ³n a EstadÃ­sticas
    if (a.textContent.includes('EstadÃ­sticas') || a.textContent.includes('Estadisticas')) {
      a.href = inSubfolder ? '../estadisticas/Menu - Estadisticas.html' : 'estadisticas/Menu - Estadisticas.html';
      return;
    }

    // Permitir navegaciÃ³n a Reportes
    if (a.textContent.includes('Reportes')) {
      a.href = inSubfolder ? '../reportes/Menu - Reportes.html' : 'reportes/Menu - Reportes.html';
      return;
    }

    // Permitir navegaciÃ³n a Herramientas
    if (a.textContent.includes('Herramientas')) {
      a.href = inSubfolder ? '../herramientas/Menu - Herramientas.html' : 'herramientas/Menu - Herramientas.html';
      return;
    }

    // Permitir navegaciÃ³n a ConfiguraciÃ³n
    if (a.textContent.includes('ConfiguraciÃ³n') || a.textContent.includes('Configuracion')) {
      a.href = inSubfolder ? '../configuracion/Menu - Configuracion.html' : 'configuracion/Menu - Configuracion.html';
      return;
    }
  });

  // =====================
  // MenÃº de perfil
  // =====================
  const profileBtn = $('.profile-menu-btn');
  const profileMenu = $('.profile-menu');
  if (profileBtn && profileMenu) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileMenu.style.display = (profileMenu.style.display === 'block') ? 'none' : 'block';
    });

    document.addEventListener('click', () => { if (profileMenu.style.display === 'block') profileMenu.style.display = 'none'; });
  }

  // =====================
  // PÃ¡gina: MenÃº principal
  // =====================
  const btnNuevoCaso = document.getElementById('btn-nuevo-caso');
  if (btnNuevoCaso) {
    btnNuevoCaso.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'Creacion de Casos.html';
    });
  }

  const checkAll = document.getElementById('check-all');
  if (checkAll) {
    checkAll.addEventListener('change', () => {
      $$('tbody input[type="checkbox"]').forEach(cb => { cb.checked = checkAll.checked; });
    });
  }

  // =====================
  // PÃ¡gina: CreaciÃ³n de Casos 
  // NOTA: Los handlers completos estÃ¡n implementados mÃ¡s abajo (lÃ­nea 553+)
  // =====================

  // =====================
  // Select personalizado (opcional; requiere un contenedor de montaje)
  // =====================
  (function mountCustomSelect() {
    const select = document.getElementById('categoria');
    const mount = document.getElementById('categoria-custom');
    if (!select || !mount) return;

    select.classList.add('visually-hidden');

    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'cs-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const valueSpan = document.createElement('span');
    valueSpan.className = 'cs-value';
    valueSpan.textContent = (select.selectedOptions && select.selectedOptions[0]?.textContent) || (select.options[0]?.textContent || '');

    const caret = document.createElement('span');
    caret.className = 'cs-caret';
    caret.textContent = 'â–¾';

    trigger.append(valueSpan, caret);

    const list = document.createElement('ul');
    list.className = 'cs-list';
    list.setAttribute('role', 'listbox');

    Array.from(select.options).forEach(opt => {
      const li = document.createElement('li');
      li.className = 'cs-option';
      li.setAttribute('role', 'option');
      li.dataset.value = opt.value || opt.textContent.trim().toLowerCase();
      if (opt.title) li.setAttribute('data-title', opt.title);
      li.textContent = opt.textContent;
      if (opt.selected) li.setAttribute('aria-selected', 'true');

      li.addEventListener('click', () => {
        list.querySelectorAll('.cs-option[aria-selected="true"]').forEach(el => el.removeAttribute('aria-selected'));
        li.setAttribute('aria-selected', 'true');
        valueSpan.textContent = li.textContent;
        wrapper.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
        select.value = opt.value || opt.textContent;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });

      list.appendChild(li);
    });

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = wrapper.classList.toggle('open');
      trigger.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', () => {
      if (wrapper.classList.contains('open')) {
        wrapper.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });

    wrapper.append(trigger, list);
    mount.appendChild(wrapper);
  })();

  // =====================
  // Resumen dinÃ¡mico + ID
  // =====================
  (function summaryBindings() {
    const idEl = document.getElementById('summary-id');
    const sCliente = document.getElementById('summary-cliente');
    const sCategoria = document.getElementById('summary-categoria');
    const sPrioridad = document.getElementById('summary-prioridad');
    const sTecnicos = document.getElementById('summary-tecnicos');
    const sAdjuntos = document.getElementById('summary-adjuntos');

    const inputCliente = document.getElementById('cliente');
    const selectCategoria = document.getElementById('categoria');
    const selectPrioridad = document.getElementById('prioridad');
    const selectAsignar = document.getElementById('asignar');
    const fileInput = document.querySelector('.file-field input[type="file"]');

    if (!idEl && !sCliente && !sCategoria && !sPrioridad && !sTecnicos && !sAdjuntos) return;

    // Obtener ID real de la base de datos
    if (idEl) {
      fetch(getApiUrl() + '?action=get_next_id')
        .then(res => res.json())
        .then(data => { if(data.new_id) idEl.textContent = data.new_id; })
        .catch(err => console.error(err));
    }

    const updateCliente = () => { if (sCliente) sCliente.textContent = inputCliente && inputCliente.value ? inputCliente.value : 'â€”'; };
    const updateCategoria = () => {
      if (!sCategoria) return;
      const opt = selectCategoria && selectCategoria.selectedOptions && selectCategoria.selectedOptions[0];
      sCategoria.textContent = opt ? opt.textContent.toUpperCase() : 'â€”';
    };
    const updatePrioridad = () => {
      if (!sPrioridad) return;
      const val = selectPrioridad ? (selectPrioridad.value || selectPrioridad.options[selectPrioridad.selectedIndex]?.text) : 'â€”';
      sPrioridad.textContent = val;
      const low = String(val).toLowerCase();
      sPrioridad.className = 'pill ' + (low === 'alta' ? 'green' : 'gray');
    };
    const updateTecnicos = () => { if (sTecnicos) sTecnicos.textContent = (selectAsignar && selectAsignar.value ? '1' : '0'); };
    const updateAdjuntos = () => { if (sAdjuntos) sAdjuntos.textContent = fileInput && fileInput.files ? String(fileInput.files.length) : '0'; };

    if (inputCliente) inputCliente.addEventListener('input', updateCliente);
    if (selectCategoria) selectCategoria.addEventListener('change', updateCategoria);
    if (selectPrioridad) selectPrioridad.addEventListener('change', updatePrioridad);
    if (selectAsignar) selectAsignar.addEventListener('change', updateTecnicos);
    if (fileInput) fileInput.addEventListener('change', updateAdjuntos);

    updateCliente();
    updateCategoria();
    updatePrioridad();
    updateTecnicos();
    updateAdjuntos();
  })();

  // =====================
  // Carga de Datos para Panel de MÃ©tricas (Menu principal)
  // =====================
  (function loadMetricsPanel() {
    const metricCreados = document.getElementById('metric-creados');
    const metricPausados = document.getElementById('metric-pausados');
    const metricSolucionados = document.getElementById('metric-solucionados');
    const metricCerrados = document.getElementById('metric-cerrados');

    // Si no existen estos elementos, no estamos en el menÃº principal
    if (!metricCreados) return;

    // Cargar estadÃ­sticas desde la API
    fetch(getApiUrl() + '?action=get_dashboard_stats')
      .then(res => res.json())
      .then(data => {
        // Actualizar los valores de las mÃ©tricas
        if (metricCreados) metricCreados.textContent = (data.total_casos || 0).toLocaleString('es-CO');
        if (metricPausados) metricPausados.textContent = (data.pausados || 0).toLocaleString('es-CO');
        if (metricSolucionados) metricSolucionados.textContent = (data.resueltos || 0).toLocaleString('es-CO');
        if (metricCerrados) metricCerrados.textContent = (data.cerrados || 0).toLocaleString('es-CO');
      })
      .catch(err => {
        console.error('Error cargando mÃ©tricas:', err);
        // Mantener valores en 0 en caso de error
      });
  })();

  // =====================
  // Carga de Datos para Reportes (Si estamos en la pÃ¡gina de reportes)
  // =====================
  (function loadReportsData() {
    const kpiGenerados = document.getElementById('kpi-generados');
    const kpiUsuarios = document.getElementById('kpi-usuarios');
    const listRecent = document.getElementById('recentReports');

    // Si no existen estos elementos, no estamos en la pÃ¡gina de reportes
    if (!kpiGenerados && !listRecent) return;

    // Cargar EstadÃ­sticas
    fetch(getApiUrl() + '?action=get_dashboard_stats')
      .then(res => res.json())
      .then(data => {
        if (kpiGenerados) kpiGenerados.innerHTML = `<strong>${data.reportes_generados || 0}</strong>`;
        if (kpiUsuarios) kpiUsuarios.innerHTML = `<strong>${data.usuarios_activos || 0}</strong>`;
        // Puedes agregar mÃ¡s KPIs aquÃ­
      })
      .catch(err => console.error('Error cargando stats:', err));

    // Cargar Lista Reciente
    if (listRecent) {
      fetch(getApiUrl() + '?action=get_recent_reports')
        .then(res => res.json())
        .then(reports => {
          listRecent.innerHTML = ''; // Limpiar lista ficticia
          reports.forEach(rep => {
            const li = document.createElement('li');
            li.className = 'report-item';
            li.innerHTML = `
              <div class="left">
                <div class="r-icon">ðŸ“„</div>
                <div class="r-info">
                  <div class="r-title">Caso #${rep.id} - ${rep.cliente}</div>
                  <div class="r-meta">${rep.fecha_creacion} â€¢ ${rep.categoria}</div>
                </div>
              </div>
              <div class="r-actions">ðŸ”½</div>
            `;
            listRecent.appendChild(li);
          });
        })
        .catch(err => console.error('Error cargando reports:', err));
    }

  })();

  // =====================
  // PaginaciÃ³n de Tabla de Casos (Menu principal.html)
  // =====================
  (function initCasesPagination() {
    if (casesPaginationInitialized) return;
    if (casesPaginationInitialized) return; // evitar doble inicializaciÃ³n
    casesPaginationInitialized = true;

    const tbody = document.getElementById('cases-table-body');
    const pagerContainer = document.querySelector('.pager');
    const prevBtn = document.querySelector('.table-footer .filters-btn:first-of-type');
    const nextBtn = document.querySelector('.table-footer .filters-btn:last-of-type');
    
    if (!tbody || !pagerContainer) return;

    const itemsPerPage = 12; // 12 casos por pÃ¡gina
    let allCases = [];
    let currentPage = 1;
    let contextMenu;

    function ensureContextMenu() {
      if (contextMenu) return contextMenu;
      contextMenu = document.createElement('div');
      contextMenu.className = 'case-menu';
      contextMenu.innerHTML = `
        <button data-action="view">Ver</button>
        <button data-action="edit">Modificar</button>
        <button data-action="delete" class="danger">Eliminar</button>
      `;
      document.body.appendChild(contextMenu);

      document.addEventListener('click', (ev) => {
        if (!contextMenu) return;
        if (!contextMenu.contains(ev.target)) {
          contextMenu.style.display = 'none';
        }
      });

      return contextMenu;
    }

    function showCaseMenu(caseData, anchorRect) {
      const menu = ensureContextMenu();
      if (!caseData) return;
      const deleteBtn = menu.querySelector('[data-action="delete"]');
      const isAuthor = (caseData.autor || '').trim().toLowerCase() === currentUserName.toLowerCase();
      deleteBtn.disabled = !isAuthor;
      deleteBtn.title = isAuthor ? '' : 'Solo el autor puede eliminar';

      menu.dataset.caseId = caseData.id;
      menu.style.display = 'block';
      menu.style.top = `${anchorRect.bottom + 4}px`;
      menu.style.left = `${anchorRect.left - 40}px`;
    }

    function closeMenu() {
      if (contextMenu) contextMenu.style.display = 'none';
    }

    function openCaseDetailModal(caseData) {
      if (!caseData) return;
      
      let overlay = document.getElementById('case-detail-modal-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'case-detail-modal-overlay';
        overlay.className = 'case-modal-overlay';
        document.body.appendChild(overlay);
      }

      const estadoLower = (caseData.estado || '').toLowerCase();
      const estadoInfo = estadoMeta[estadoLower] || { clase: 'abierto', etiqueta: caseData.estado || 'Abierto', color: '#16a34a' };
      
      const prioridadLower = (caseData.prioridad || 'media').toLowerCase();
      const prioridadInfo = prioridadMeta[prioridadLower] || prioridadMeta['media'];

      const coloresAvatar = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
      const hash = (caseData.asignado_a || 'U').charCodeAt(0) % coloresAvatar.length;
      const colorAvatar = coloresAvatar[hash];

      const fechaFormato = caseData.fecha_creacion 
        ? new Date(caseData.fecha_creacion).toLocaleDateString('es-ES', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        : 'N/D';

      overlay.innerHTML = `
        <div class="case-modal" style="width: min(900px, 90vw); max-height: 90vh; overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <h2 style="margin: 0; color: #111827;">#${formatCaseId(caseData.id)}</h2>
              <p style="margin: 5px 0 0 0; color: #7b8694; font-size: 14px;">${fechaFormato}</p>
            </div>
            <button onclick="document.getElementById('case-detail-modal-overlay').style.display='none'" style="background: #e5e7eb; border: none; border-radius: 8px; padding: 10px 16px; cursor: pointer; font-weight: 600;">✕ Cerrar</button>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 16px;">Información General</h3>
              
              <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: 700; color: #111827; margin-bottom: 4px;">Cliente</label>
                <p style="margin: 0; color: #2b3440; background: #f9fafb; padding: 10px; border-radius: 8px;">${caseData.cliente || 'N/D'}</p>
              </div>

              <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: 700; color: #111827; margin-bottom: 4px;">Categoría</label>
                <p style="margin: 0; color: #2b3440; background: #f9fafb; padding: 10px; border-radius: 8px;">${caseData.categoria || 'General'}</p>
              </div>

              <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: 700; color: #111827; margin-bottom: 4px;">Estado</label>
                <span class="status ${estadoInfo.clase}" style="display: inline-block; color:${estadoInfo.color}; background-color:${estadoInfo.color}22; padding: 8px 12px; border-radius: 8px; font-weight: 600;">${estadoInfo.etiqueta}</span>
              </div>

              <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: 700; color: #111827; margin-bottom: 4px;">Prioridad</label>
                <span class="priority ${prioridadInfo.clase}" style="display: inline-block; background-color:${prioridadInfo.color}22; color:${prioridadInfo.color}; padding: 8px 12px; border-radius: 8px; font-weight: 600;">${prioridadInfo.label}</span>
              </div>
            </div>

            <div>
              <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 16px;">Asignación</h3>

              <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: 700; color: #111827; margin-bottom: 4px;">Asignado a</label>
                <div style="display: flex; align-items: center; background: #f9fafb; padding: 10px; border-radius: 8px;">
                  <span style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: ${colorAvatar}; color: white; border-radius: 50%; font-weight: 700; margin-right: 10px;">${(caseData.asignado_a || 'U').charAt(0).toUpperCase()}</span>
                  <span style="color: #2b3440; font-weight: 600;">${caseData.asignado_a || 'Sin asignar'}</span>
                </div>
              </div>

              <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: 700; color: #111827; margin-bottom: 4px;">Autor</label>
                <p style="margin: 0; color: #2b3440; background: #f9fafb; padding: 10px; border-radius: 8px;">${caseData.autor || 'Gestor asignado'}</p>
              </div>
            </div>
          </div>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ebedf2;">
            <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 16px;">Descripción</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; color: #2b3440; line-height: 1.6; white-space: pre-wrap;">
              ${caseData.descripcion || 'Sin descripción disponible'}
            </div>
          </div>

          ${caseData.sede ? `
          <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 8px;">
            <p style="margin: 0; color: #0369a1;"><strong>Sede:</strong> ${caseData.sede}</p>
          </div>
          ` : ''}

          ${caseData.contacto || caseData.correo || caseData.telefono ? `
          <div style="margin-top: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 16px;">Contacto</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              ${caseData.contacto ? `<div style="background: #f9fafb; padding: 10px; border-radius: 8px;"><strong style="color: #111827;">Contacto:</strong> <p style="margin: 5px 0 0 0; color: #2b3440;">${caseData.contacto}</p></div>` : ''}
              ${caseData.correo ? `<div style="background: #f9fafb; padding: 10px; border-radius: 8px;"><strong style="color: #111827;">Correo:</strong> <p style="margin: 5px 0 0 0; color: #2b3440;">${caseData.correo}</p></div>` : ''}
              ${caseData.telefono ? `<div style="background: #f9fafb; padding: 10px; border-radius: 8px;"><strong style="color: #111827;">Teléfono:</strong> <p style="margin: 5px 0 0 0; color: #2b3440;">${caseData.telefono}</p></div>` : ''}
            </div>
          </div>
          ` : ''}

          <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
            <button onclick="document.getElementById('case-detail-modal-overlay').style.display='none'" style="background: #e5e7eb; color: #111827; border: none; border-radius: 10px; padding: 10px 20px; cursor: pointer; font-weight: 700;">Cerrar</button>
            <button onclick="openCaseModal('edit', window.currentCaseData)" style="background: #2563eb; color: white; border: none; border-radius: 10px; padding: 10px 20px; cursor: pointer; font-weight: 700;">Editar</button>
          </div>
        </div>
      `;

      window.currentCaseData = caseData;
      overlay.style.display = 'flex';
      
      // Cerrar al hacer clic fuera del modal
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.style.display = 'none';
        }
      });
    }

    function openCaseModal(mode, caseData) {
      closeMenu();
      let overlay = document.getElementById('case-modal-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'case-modal-overlay';
        overlay.className = 'case-modal-overlay';
        document.body.appendChild(overlay);
      }
      const timelineHtml = `
        <div class="timeline">
          <div class="timeline-item"><strong>Creado:</strong> ${caseData.fecha_creacion || 'N/D'} • por ${caseData.autor || 'Gestor'}</div>
          <div class="timeline-item"><strong>Última actualización:</strong> ${new Date().toLocaleString('es-ES')}</div>
        </div>
      `;

      const readOnly = mode === 'view';
      overlay.innerHTML = `
        <div class="case-modal">
          <h3>${mode === 'view' ? 'Detalle del caso' : 'Modificar caso'}</h3>
          <div class="field">
            <label>ID</label>
            <input value="#${formatCaseId(caseData.id)}" disabled>
          </div>
          <div class="field">
            <label>Cliente</label>
            <input value="${caseData.cliente || ''}" ${readOnly ? 'disabled' : ''}>
          </div>
          <div class="field">
            <label>Categoría</label>
            <input value="${caseData.categoria || ''}" ${readOnly ? 'disabled' : ''}>
          </div>
          <div class="field">
            <label>Estado</label>
            <select id="case-estado" ${readOnly ? 'disabled' : ''}>
              <option value="abierto" ${String(caseData.estado||'').toLowerCase()==='abierto'?'selected':''}>Abierto</option>
              <option value="en_progreso" ${String(caseData.estado||'').toLowerCase().includes('progreso')?'selected':''}>En Progreso</option>
              <option value="pausado" ${String(caseData.estado||'').toLowerCase()==='pausado'?'selected':''}>Pausado</option>
              <option value="resuelto" ${String(caseData.estado||'').toLowerCase()==='resuelto'?'selected':''}>Resuelto</option>
              <option value="cerrado" ${String(caseData.estado||'').toLowerCase()==='cerrado'?'selected':''}>Cerrado</option>
            </select>
          </div>
          <div class="field">
            <label>DescripciÃ³n</label>
            <textarea id="case-descripcion" ${readOnly ? 'disabled' : ''}>${caseData.descripcion || ''}</textarea>
          </div>
          ${timelineHtml}
          <div class="actions">
            <button class="btn cancel" id="case-cancel">Cerrar</button>
            ${readOnly ? '' : '<button class="btn primary" id="case-save">Guardar cambios</button>'}
          </div>
        </div>
      `;

      overlay.style.display = 'flex';

      overlay.querySelector('#case-cancel').onclick = () => { overlay.style.display = 'none'; };
      const saveBtn = overlay.querySelector('#case-save');
      if (saveBtn) {
        saveBtn.onclick = async () => {
          const newEstado = overlay.querySelector('#case-estado').value;
          const newDescripcion = overlay.querySelector('#case-descripcion').value;
          try {
            const resp = await fetch(getApiUrl() + '?action=update_case', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: caseData.id, estado: newEstado, descripcion: newDescripcion })
            });
            const data = await resp.json();
            if (!data.success) throw new Error(data.error || 'No se pudo actualizar');
            // refrescar en memoria
            const idx = allCases.findIndex(x => x.id === caseData.id);
            if (idx >= 0) {
              allCases[idx].estado = newEstado;
              allCases[idx].descripcion = newDescripcion;
            }
            renderPage(currentPage);
            overlay.style.display = 'none';
          } catch (err) {
            alert('Error al guardar cambios: ' + err.message);
          }
        };
      }
    }

    async function deleteCase(caseData) {
      closeMenu();
      if (!caseData) return;
      const isAuthor = (caseData.autor || '').trim().toLowerCase() === currentUserName.toLowerCase();
      if (!isAuthor) {
        alert('Solo el autor puede eliminar este caso');
        return;
      }
      if (!confirm('Â¿Seguro que deseas eliminar el caso #' + formatCaseId(caseData.id) + '?')) return;
      try {
        const resp = await fetch(getApiUrl() + '?action=delete_case', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: caseData.id })
        });
        const data = await resp.json();
        if (!data.success) throw new Error(data.error || 'No se pudo eliminar');
        allCases = allCases.filter(x => x.id !== caseData.id);
        const totalPages = Math.max(1, Math.ceil(allCases.length / itemsPerPage));
        if (currentPage > totalPages) currentPage = totalPages;
        renderPage(currentPage);
      } catch (err) {
        alert('Error al eliminar: ' + err.message);
      }
    }

    // FunciÃ³n para renderizar una pÃ¡gina
    function renderPage(page) {
      const startIdx = (page - 1) * itemsPerPage;
      const endIdx = startIdx + itemsPerPage;
      const pageCases = allCases.slice(startIdx, endIdx);

      tbody.innerHTML = '';

      if (pageCases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:20px;">No hay casos en esta pÃ¡gina</td></tr>';
        return;
      }

      pageCases.forEach(c => {
        const tr = document.createElement('tr');
        tr.dataset.caseId = c.id;
        tr.style.cursor = 'pointer';
        
        // Formatear fecha
        let fechaFormato = c.fecha_creacion;
        if (c.fecha_creacion) {
          const fecha = new Date(c.fecha_creacion);
          const opciones = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
          fechaFormato = fecha.toLocaleDateString('es-ES', opciones);
        }
        
        const estadoLower = (c.estado || '').toLowerCase();
        const estadoInfo = estadoMeta[estadoLower] || { clase: 'abierto', etiqueta: c.estado || 'Abierto', color: '#16a34a' };
        
        const prioridadLower = (c.prioridad || 'media').toLowerCase();
        const prioridadInfo = prioridadMeta[prioridadLower] || prioridadMeta['media'];

        const clienteNombre = c.cliente || empresasBogota[Math.floor(Math.random() * empresasBogota.length)];
        const autorNombre = c.autor || 'Gestor asignado';
        
        // Color avatar
        const coloresAvatar = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
        const hash = (c.asignado_a || 'U').charCodeAt(0) % coloresAvatar.length;
        const colorAvatar = coloresAvatar[hash];
        
        tr.innerHTML = `
          <td class="td-check"><input type="checkbox"></td>
          <td><strong>#${formatCaseId(c.id)}</strong></td>
          <td><small>${fechaFormato}</small></td>
          <td><span class="status ${estadoInfo.clase}" style="color:${estadoInfo.color}; background-color:${estadoInfo.color}22;"><span class="checkdot" style="background:${estadoInfo.color}"></span>${estadoInfo.etiqueta}</span></td>
          <td>
            <div class="assignee">
              <span class="ava" style="background:${colorAvatar}">${(c.asignado_a || 'U').charAt(0).toUpperCase()}</span>
              <div>${c.asignado_a || 'Sin asignar'}</div>
            </div>
          </td>
          <td><span class="priority ${prioridadInfo.clase}" style="background-color:${prioridadInfo.color}22; color:${prioridadInfo.color}">${prioridadInfo.label}</span></td>
          <td><span class="category-badge">${c.categoria || 'General'}</span></td>
          <td>${clienteNombre}</td>
          <td><small>${autorNombre}</small></td>
          <td class="ellipsis">···</td>
        `;
        
        // Evento para abrir modal al hacer clic en la fila
        tr.addEventListener('click', (e) => {
          if (e.target.type !== 'checkbox') {
            openCaseDetailModal(c);
          }
        });
        
        // Evento para doble clic
        tr.addEventListener('dblclick', (e) => {
          e.preventDefault();
          openCaseDetailModal(c);
        });
        
        tbody.appendChild(tr);

      });

      updatePagerButtons();
    }

    // Actualizar nÃºmeros de pÃ¡gina
    function updatePagerButtons() {
      const totalPages = Math.ceil(allCases.length / itemsPerPage);
      const pages = [];
      
      // LÃ³gica para mostrar pÃ¡ginas (ej: 1, 2, 3, ..., 8, 9, 10)
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1, 2, 3, '...', totalPages - 2, totalPages - 1, totalPages);
      }

      pagerContainer.innerHTML = pages.map(p => {
        if (p === '...') return '<span class="pg">...</span>';
        return `<span class="pg ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</span>`;
      }).join('');

      // Eventos para nÃºmeros de pÃ¡gina
      pagerContainer.querySelectorAll('[data-page]').forEach(el => {
        el.addEventListener('click', () => {
          currentPage = parseInt(el.dataset.page);
          renderPage(currentPage);
        });
      });

      // Actualizar botones Previous/Next
      prevBtn.disabled = currentPage === 1;
      nextBtn.disabled = currentPage === totalPages;
      
      prevBtn.style.opacity = currentPage === 1 ? '0.5' : '1';
      prevBtn.style.cursor = currentPage === 1 ? 'not-allowed' : 'pointer';
      nextBtn.style.opacity = currentPage === totalPages ? '0.5' : '1';
      nextBtn.style.cursor = currentPage === totalPages ? 'not-allowed' : 'pointer';
    }

    // MenÃº contextual en ellipsis
    tbody.addEventListener('click', (e) => {
      const target = e.target.closest('.ellipsis');
      if (!target) return;
      const tr = target.closest('tr');
      const caseId = tr?.dataset.caseId;
      const caseData = allCases.find(x => String(x.id) === String(caseId));
      if (!caseData) return;
      const rect = target.getBoundingClientRect();
      showCaseMenu(caseData, rect);
    });

    // Acciones del menÃº
    document.body.addEventListener('click', (e) => {
      if (!contextMenu || contextMenu.style.display !== 'block') return;
      if (e.target.dataset.action === 'view' || e.target.dataset.action === 'edit' || e.target.dataset.action === 'delete') {
        const caseId = contextMenu.dataset.caseId;
        const caseData = allCases.find(x => String(x.id) === String(caseId));
        if (!caseData) return;
        if (e.target.dataset.action === 'view') openCaseModal('view', caseData);
        if (e.target.dataset.action === 'edit') openCaseModal('edit', caseData);
        if (e.target.dataset.action === 'delete') deleteCase(caseData);
      }
    });

    // Cargar datos
    fetch(getApiUrl() + '/casos')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Error HTTP: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // El API retorna {success: true, data: [], count: n}
        allCases = (data.data && Array.isArray(data.data)) ? data.data : (data || []);
        
        if (allCases.length === 0) {
          tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:20px;">No hay casos registrados</td></tr>';
          return;
        }

        currentPage = 1;
        renderPage(currentPage);
      })
      .catch(err => {
        console.error('Error cargando tabla:', err);
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:20px; color:#dc2626;">Error al cargar casos. Por favor, verifica la conexiÃ³n.</td></tr>';
      });

    // Eventos de Previous/Next
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          renderPage(currentPage);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(allCases.length / itemsPerPage);
        if (currentPage < totalPages) {
          currentPage++;
          renderPage(currentPage);
        }
      });
    }
  })();

  // =====================
  // Auto-actualizaciÃ³n de tabla de casos cada 30 segundos
  // =====================
  (function autoRefreshCases() {
    const tbody = document.getElementById('cases-table-body');
    const indicator = document.getElementById('autoRefreshIndicator');
    if (!tbody) return;

    let autoRefreshInterval;
    let lastCasesCount = 0;

    // Mostrar indicador de auto-actualizaciÃ³n
    if (indicator) {
      indicator.style.display = 'flex';
      setTimeout(() => {
        indicator.style.opacity = '0.7';
      }, 3000);
    }

    function refreshCasesData() {
      fetch(getApiUrl() + '/casos')
        .then(res => res.ok ? res.json() : { data: [] })
        .then(data => {
          const casos = (data.data && Array.isArray(data.data)) ? data.data : (data || []);
          if (casos && casos.length > 0) {
            // Solo actualizar si hay cambios en la cantidad de casos
            if (casos.length !== lastCasesCount) {
              console.log(`ðŸ”„ Datos actualizados: ${casos.length} casos (antes: ${lastCasesCount})`);
              lastCasesCount = casos.length;
              allCases = casos;
              
              // Re-renderizar la pÃ¡gina actual
              if (typeof renderPage === 'function') {
                renderPage(currentPage);
              }
              
              // Mostrar notificaciÃ³n sutil
              showRefreshNotification(casos.length);
              
              // Animar indicador
              if (indicator) {
                indicator.style.opacity = '1';
                setTimeout(() => {
                  indicator.style.opacity = '0.7';
                }, 2000);
              }
            }
          }
        })
        .catch(err => console.error('Error en auto-actualizaciÃ³n:', err));
    }

    function showRefreshNotification(count) {
      // Crear notificaciÃ³n temporal
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #22c55e;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
      `;
      notification.textContent = `âœ“ ${count} casos actualizados`;
      document.body.appendChild(notification);

      // Remover despuÃ©s de 3 segundos
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }

    // Iniciar auto-actualizaciÃ³n cada 30 segundos
    autoRefreshInterval = setInterval(refreshCasesData, 30000);
    console.log('âœ“ Auto-actualizaciÃ³n de casos activada (cada 30 segundos)');

    // Limpiar intervalo al salir de la pÃ¡gina
    window.addEventListener('beforeunload', () => {
      if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    });
  })();

  // =====================
  // Carga de Datos para EstadÃ­sticas (Menu - Estadisticas.html)
  // =====================
  (function loadStatsData() {
    const statTotal = document.getElementById('stat-total');
    const statResolved = document.getElementById('stat-resolved');
    const statPending = document.getElementById('stat-pending');

    if (!statTotal && !statResolved && !statPending) return;

    fetch(getApiUrl() + '?action=get_dashboard_stats')
      .then(res => res.json())
      .then(data => {
        if (statTotal) statTotal.textContent = data.total_casos || 0;
        if (statResolved) statResolved.textContent = data.resueltos || 0;
        if (statPending) statPending.textContent = data.pendientes || 0;
      })
      .catch(err => console.error('Error cargando estadisticas:', err));
  })();

  // =====================
  // Funcionalidad de CreaciÃ³n de Casos
  // =====================
  const btnCrearCaso = document.getElementById('btn-crear-caso');
  const btnGuardarBorrador = document.getElementById('btn-guardar-borrador');
  const btnCancelar = document.getElementById('btn-cancelar');
  const modalExito = document.getElementById('modal-exito');
  const modalCancelar = document.getElementById('modal-cancelar');

  if (btnCrearCaso) {
    btnCrearCaso.addEventListener('click', async () => {
      // Recopilar datos del formulario
      const caseData = {
        cliente: document.getElementById('cliente')?.value || '',
        sede: document.getElementById('sede')?.value || '',
        contacto: document.getElementById('contacto')?.value || '',
        correo: document.getElementById('correo')?.value || '',
        telefono: document.getElementById('telefono')?.value || '',
        contacto2: document.getElementById('contacto2')?.value || '',
        correo2: document.getElementById('correo2')?.value || '',
        telefono2: document.getElementById('telefono2')?.value || '',
        centro_costos: document.getElementById('centro-costos')?.value || '',
        serial: document.getElementById('serial')?.value || '',
        marca: document.getElementById('marca')?.value || '',
        tipo: document.getElementById('tipo')?.value || '',
        categoria: document.getElementById('categoria')?.value || '',
        descripcion: document.getElementById('descripcion')?.value || '',
        asignado: document.getElementById('asignar')?.value || '',
        prioridad: document.getElementById('prioridad')?.value || '',
        estado: 'Activo',
        autor: 'Juan PÃ©rez'
      };

      // Validar campos obligatorios
      if (!caseData.cliente) {
        alert('Por favor ingrese el nombre del cliente');
        document.getElementById('cliente')?.focus();
        return;
      }
      
      if (!caseData.categoria) {
        alert('Por favor seleccione una categorÃ­a');
        document.getElementById('categoria')?.focus();
        return;
      }
      
      if (!caseData.prioridad) {
        alert('Por favor seleccione una prioridad');
        document.getElementById('prioridad')?.focus();
        return;
      }
      
      if (!caseData.descripcion) {
        alert('Por favor ingrese una descripciÃ³n de la falla');
        document.getElementById('descripcion')?.focus();
        return;
      }

      // Deshabilitar botÃ³n mientras se procesa
      btnCrearCaso.disabled = true;
      btnCrearCaso.textContent = 'Guardando...';

      try {
        const response = await fetch(getApiUrl() + '?action=save_case', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(caseData)
        });

        const result = await response.json();

        if (result.success) {
          // Limpiar borrador guardado
          localStorage.removeItem('caso_borrador');
          
          // Mostrar modal de Ã©xito
          if (modalExito) {
            modalExito.style.display = 'flex';
            setTimeout(() => {
              modalExito.style.display = 'none';
              // Redirigir al menÃº principal
              window.location.href = 'Menu principal.html';
            }, 2000);
          } else {
            alert('Caso creado exitosamente');
            window.location.href = 'Menu principal.html';
          }
        } else {
          alert('Error al crear el caso: ' + (result.error || 'Error desconocido'));
          btnCrearCaso.disabled = false;
          btnCrearCaso.textContent = 'Crear Caso';
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error de conexiÃ³n. Por favor intente nuevamente.');
        btnCrearCaso.disabled = false;
        btnCrearCaso.textContent = 'Crear Caso';
      }
    });
  }

  // Funcionalidad del botÃ³n Cancelar
  if (btnCancelar && modalCancelar) {
    btnCancelar.addEventListener('click', () => {
      modalCancelar.style.display = 'flex';
    });

    const cancelYes = document.getElementById('cancel-yes');
    const cancelNo = document.getElementById('cancel-no');

    if (cancelYes) {
      cancelYes.addEventListener('click', () => {
        window.location.href = 'Menu principal.html';
      });
    }

    if (cancelNo) {
      cancelNo.addEventListener('click', () => {
        modalCancelar.style.display = 'none';
      });
    }
  }
  
  // Funcionalidad del botÃ³n Guardar Borrador
  if (btnGuardarBorrador) {
    btnGuardarBorrador.addEventListener('click', () => {
      // Guardar en localStorage como borrador
      const caseData = {
        cliente: document.getElementById('cliente')?.value || '',
        sede: document.getElementById('sede')?.value || '',
        contacto: document.getElementById('contacto')?.value || '',
        correo: document.getElementById('correo')?.value || '',
        telefono: document.getElementById('telefono')?.value || '',
        contacto2: document.getElementById('contacto2')?.value || '',
        correo2: document.getElementById('correo2')?.value || '',
        telefono2: document.getElementById('telefono2')?.value || '',
        centro_costos: document.getElementById('centro-costos')?.value || '',
        serial: document.getElementById('serial')?.value || '',
        marca: document.getElementById('marca')?.value || '',
        tipo: document.getElementById('tipo')?.value || '',
        categoria: document.getElementById('categoria')?.value || '',
        descripcion: document.getElementById('descripcion')?.value || '',
        asignado: document.getElementById('asignar')?.value || '',
        prioridad: document.getElementById('prioridad')?.value || ''
      };
      
      localStorage.setItem('caso_borrador', JSON.stringify(caseData));
      alert('Borrador guardado exitosamente');
    });
  }
  
  // Cargar borrador si existe
  const loadDraft = () => {
    const draft = localStorage.getItem('caso_borrador');
    if (!draft) return;

    const data = JSON.parse(draft);
    if (!confirm('Se encontrÃ³ un borrador guardado. Â¿Desea cargarlo?')) {
      localStorage.removeItem('caso_borrador');
      return;
    }

    Object.keys(data).forEach(key => {
      const elem = document.getElementById(key.replace('_', '-'));
      if (elem && data[key]) {
        elem.value = data[key];
      }
    });
    updateSummary();
  };
  
  // Ejecutar al cargar la pÃ¡gina
  if (btnCrearCaso) {
    loadDraft();
  }

  // Actualizar resumen en tiempo real
  const updateSummary = () => {
    const cliente = document.getElementById('cliente')?.value;
    const categoria = document.getElementById('categoria')?.value;
    const prioridad = document.getElementById('prioridad')?.value;
    const asignado = document.getElementById('asignar')?.value;

    if (cliente) document.getElementById('summary-cliente').textContent = cliente;
    if (categoria) {
      const catSpan = document.getElementById('summary-categoria');
      catSpan.textContent = categoria;
      catSpan.className = 'pill ' + (categoria === 'Hardware' ? 'blue' : categoria === 'Software' ? 'purple' : 'gray');
    }
    if (prioridad) {
      const prioSpan = document.getElementById('summary-prioridad');
      prioSpan.textContent = prioridad;
      const colorMap = { 'Critico': 'red', 'Alta': 'orange', 'Media': 'yellow', 'Baja': 'green' };
      prioSpan.className = 'pill ' + (colorMap[prioridad] || 'gray');
    }
    if (asignado) document.getElementById('summary-tecnicos').textContent = asignado ? '1' : '0';
  };

  // Escuchar cambios en los campos
  ['cliente', 'categoria', 'prioridad', 'asignar'].forEach(id => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.addEventListener('input', updateSummary);
      elem.addEventListener('change', updateSummary);
    }
  });

  // =====================
  // Sistema de Filtros DinÃ¡micos
  // =====================
  (function initFilters() {
    const filterBtn = document.getElementById('btn-filtros');
    const filterModal = document.getElementById('filters-modal-overlay');
    const filterClose = document.getElementById('filters-modal-close');
    const filterResetBtn = document.getElementById('filters-reset-btn');
    const filterApplyBtn = document.getElementById('filters-apply-btn');

    if (!filterBtn || !filterModal) return;

    let activeFilters = {
      estados: [],
      prioridades: [],
      categoria: '',
      tecnico: ''
    };

    // Abrir modal de filtros
    filterBtn.addEventListener('click', () => {
      filterModal.style.display = 'flex';
    });

    // Cerrar modal
    filterClose.addEventListener('click', () => {
      filterModal.style.display = 'none';
    });

    filterModal.addEventListener('click', (e) => {
      if (e.target === filterModal) {
        filterModal.style.display = 'none';
      }
    });

    // Capturar cambios en checkboxes de estado
    document.querySelectorAll('.filter-estado').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        activeFilters.estados = Array.from(document.querySelectorAll('.filter-estado:checked'))
          .map(cb => cb.value);
      });
    });

    // Capturar cambios en checkboxes de prioridad
    document.querySelectorAll('.filter-prioridad').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        activeFilters.prioridades = Array.from(document.querySelectorAll('.filter-prioridad:checked'))
          .map(cb => cb.value);
      });
    });

    // Capturar cambios en selects
    document.getElementById('filter-categoria').addEventListener('change', (e) => {
      activeFilters.categoria = e.target.value;
    });

    document.getElementById('filter-tecnico').addEventListener('change', (e) => {
      activeFilters.tecnico = e.target.value;
    });

    // Limpiar filtros
    filterResetBtn.addEventListener('click', () => {
      document.querySelectorAll('.filter-estado, .filter-prioridad').forEach(cb => cb.checked = false);
      document.getElementById('filter-categoria').value = '';
      document.getElementById('filter-tecnico').value = '';
      activeFilters = { estados: [], prioridades: [], categoria: '', tecnico: '' };
      filterBtn.classList.remove('active-filters');
    });

    // Aplicar filtros
    filterApplyBtn.addEventListener('click', () => {
      applyFiltersToTable(activeFilters);
      filterModal.style.display = 'none';
      
      const hasActiveFilters = activeFilters.estados.length > 0 || 
                               activeFilters.prioridades.length > 0 || 
                               activeFilters.categoria || 
                               activeFilters.tecnico;
      filterBtn.classList.toggle('active-filters', hasActiveFilters);
    });
  })();

  // FunciÃ³n para aplicar filtros a la tabla
  window.applyFiltersToTable = function(filters) {
    const tbody = document.getElementById('cases-table-body');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    let visibleCount = 0;

    rows.forEach(row => {
      let showRow = true;

      // Filtro por estado
      if (filters.estados.length > 0) {
        const estadoCell = row.querySelector('td:nth-child(4)');
        const estadoText = estadoCell?.textContent.trim().toLowerCase() || '';
        const match = filters.estados.some(est => {
          if (est === 'abierto') return estadoText.includes('activo');
          if (est === 'en_progreso') return estadoText.includes('progreso');
          return estadoText.includes(est);
        });

        showRow = showRow && match;
      }

      // Filtro por prioridad
      if (filters.prioridades.length > 0) {
        const prioridadCell = row.querySelector('td:nth-child(6)');
        const prioridadText = prioridadCell?.textContent.trim().toLowerCase() || '';
        const match = filters.prioridades.some(pri => {
          if (pri === 'critica' || pri === 'urgente') return prioridadText.includes('urgente') || prioridadText.includes('crÃ­tica');
          return prioridadText.includes(pri);
        });

        showRow = showRow && match;
      }

      // Filtro por categorÃ­a
      if (filters.categoria) {
        const categoriaCell = row.querySelector('td:nth-child(7)');
        const categoriaText = categoriaCell?.textContent.trim() || '';
        showRow = showRow && categoriaText === filters.categoria;
      }

      // Filtro por tÃ©cnico asignado
      if (filters.tecnico) {
        const tecnicoCell = row.querySelector('td:nth-child(5)');
        const tecnicoText = tecnicoCell?.textContent.trim() || '';
        showRow = showRow && tecnicoText.includes(filters.tecnico);
      }

      row.style.display = showRow ? '' : 'none';
      if (showRow) visibleCount++;
    });

    // Si no hay resultados
    if (visibleCount === 0 && tbody.querySelectorAll('tr[style=""]').length === 0) {
      const noResultsRow = tbody.querySelector('tr[style*="display: none"]');
      if (!noResultsRow || tbody.querySelectorAll('tr').length === 1) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:20px; color:#6b7280;">No hay casos que coincidan con los filtros seleccionados</td></tr>';
      }
    }
  };

});
