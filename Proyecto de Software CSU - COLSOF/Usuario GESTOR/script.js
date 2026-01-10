'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // =====================
  // Helpers
  // =====================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const showModal = (id) => { const m = document.getElementById(id); if (m) m.style.display = 'flex'; };
  const hideModal = (id) => { const m = document.getElementById(id); if (m) m.style.display = 'none'; };

  // Determinar ruta de la API según dónde estemos (Raíz o Subcarpeta)
  const getApiUrl = () => {
    // Si la URL contiene 'Usuario GESTOR', el api.php está en la misma carpeta
    if (window.location.pathname.includes('Usuario GESTOR')) {
      return 'api.php';
    }
    return 'Proyecto de Software CSU - COLSOF/Usuario GESTOR/api.php';
  };

  // =====================
  // Modal de "En proceso de construcción"
  // =====================
  const cerrarModalBtn = document.getElementById('cerrar-modal');
  if (cerrarModalBtn) cerrarModalBtn.addEventListener('click', () => hideModal('modal-construccion'));

  // Interceptar enlaces del menú (excepto Inicio si existe)
  $$('.menu-list a').forEach(a => {
    if (a.id === 'link-inicio' || a.getAttribute('href').includes('Menu principal.html')) return; // dejar navegar

    // Permitir navegación a Notificaciones
    if (a.textContent.includes('Notificaciones') || a.querySelector('.badge')) {
      a.href = '../../Menu - Notificaciones.html';
      return;
    }

    // Permitir navegación a Estadísticas
    if (a.textContent.includes('Estadísticas') || a.textContent.includes('Estadisticas')) {
      a.href = '../../Menu - Estadisticas.html';
      return;
    }

    // Permitir navegación a Reportes
    if (a.textContent.includes('Reportes')) {
      a.href = '../../Menu - Reportes.html';
      return;
    }

    // Permitir navegación a Herramientas
    if (a.textContent.includes('Herramientas')) {
      a.href = 'Menu - Herramientas.html';
      return;
    }

    // Permitir navegación a Configuración
    if (a.textContent.includes('Configuración') || a.textContent.includes('Configuracion')) {
      a.href = '../../Menu - Configuracion.html';
      return;
    }

    // Permitir navegación a Crear Usuario
    if (a.textContent.includes('Crear Usuario')) {
      a.href = '../Usuario ADMINISTRDOR/Creacion de usuarios.html';
      return;
    }

    a.addEventListener('click', (e) => {
      e.preventDefault();
      showModal('modal-construccion');
    });
  });
  // Submenús
  $$('.sub-list a').forEach(a => {
    a.addEventListener('click', (e) => { e.preventDefault(); showModal('modal-construccion'); });
  });
  // Botones de filtros (si existen)
  $$('.filters-btn').forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); showModal('modal-construccion'); });
  });

  // =====================
  // Menú de perfil
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
  // Página: Menú principal
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
  // Página: Creación de Casos (handlers condicionales)
  // =====================
  const btnCrear = document.getElementById('btn-crear-caso');
  const btnBorrador = document.getElementById('btn-guardar-borrador');
  const btnCancelar = document.getElementById('btn-cancelar');

  // Guardar borrador -> modal construcción
  if (btnBorrador) btnBorrador.addEventListener('click', (e) => { e.preventDefault(); showModal('modal-construccion'); });

  // Importar XLSX -> modal construcción
  const btnImportar = document.querySelector('.import-btn');
  if (btnImportar) btnImportar.addEventListener('click', (e) => { e.preventDefault(); showModal('modal-construccion'); });

  // Crear Caso -> modal éxito + redirección
  if (btnCrear) {
    btnCrear.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Recopilar datos del formulario (ajusta los IDs según tu HTML real de creación)
      const data = {
        cliente: document.getElementById('cliente')?.value,
        categoria: document.getElementById('categoria')?.value,
        prioridad: document.getElementById('prioridad')?.value,
        descripcion: document.getElementById('descripcion')?.value, // Asumiendo que existe este campo
        asignado: document.getElementById('asignar')?.value
      };

      fetch(getApiUrl() + '?action=save_case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(response => {
        if (response.success) {
          const exito = document.getElementById('modal-exito');
          if (exito) {
            exito.style.display = 'flex';
            setTimeout(() => { window.location.href = 'Menu principal.html'; }, 1500);
          } else {
            window.location.href = 'Menu principal.html';
          }
        } else {
          alert('Error al guardar: ' + response.error);
        }
      })
      .catch(err => console.error('Error:', err));
    });
  }
  const cerrarExito = document.getElementById('cerrar-exito');
  if (cerrarExito) cerrarExito.addEventListener('click', () => { window.location.href = 'Menu principal.html'; });

  // Cancelar -> confirmar
  if (btnCancelar) {
    const modalCancelar = document.getElementById('modal-cancelar');
    const cancelSi = document.getElementById('cancel-si');
    const cancelNo = document.getElementById('cancel-no');
    btnCancelar.addEventListener('click', (e) => { e.preventDefault(); if (modalCancelar) modalCancelar.style.display = 'flex'; });
    if (cancelNo && modalCancelar) cancelNo.addEventListener('click', () => { modalCancelar.style.display = 'none'; });
    if (cancelSi) cancelSi.addEventListener('click', () => { window.location.href = 'Menu principal.html'; });
  }

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
    caret.textContent = '▾';

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
  // Resumen dinámico + ID
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

    const updateCliente = () => { if (sCliente) sCliente.textContent = inputCliente && inputCliente.value ? inputCliente.value : '—'; };
    const updateCategoria = () => {
      if (!sCategoria) return;
      const opt = selectCategoria && selectCategoria.selectedOptions && selectCategoria.selectedOptions[0];
      sCategoria.textContent = opt ? opt.textContent.toUpperCase() : '—';
    };
    const updatePrioridad = () => {
      if (!sPrioridad) return;
      const val = selectPrioridad ? (selectPrioridad.value || selectPrioridad.options[selectPrioridad.selectedIndex]?.text) : '—';
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
  // Carga de Datos para Reportes (Si estamos en la página de reportes)
  // =====================
  (function loadReportsData() {
    const kpiGenerados = document.getElementById('kpi-generados');
    const kpiUsuarios = document.getElementById('kpi-usuarios');
    const listRecent = document.getElementById('recentReports');

    // Si no existen estos elementos, no estamos en la página de reportes
    if (!kpiGenerados && !listRecent) return;

    // Cargar Estadísticas
    fetch(getApiUrl() + '?action=get_dashboard_stats')
      .then(res => res.json())
      .then(data => {
        if (kpiGenerados) kpiGenerados.innerHTML = `<strong>${data.reportes_generados || 0}</strong>`;
        if (kpiUsuarios) kpiUsuarios.innerHTML = `<strong>${data.usuarios_activos || 0}</strong>`;
        // Puedes agregar más KPIs aquí
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
                <div class="r-icon">📄</div>
                <div class="r-info">
                  <div class="r-title">Caso #${rep.id} - ${rep.cliente}</div>
                  <div class="r-meta">${rep.fecha_creacion} • ${rep.categoria}</div>
                </div>
              </div>
              <div class="r-actions">🔽</div>
            `;
            listRecent.appendChild(li);
          });
        });
    }
  })();

  // =====================
  // Carga de Tabla de Casos (Menu principal.html)
  // =====================
  (function loadCasesTable() {
    const tbody = document.getElementById('cases-table-body');
    if (!tbody) return;

    fetch(getApiUrl() + '?action=get_cases_list')
      .then(res => res.json())
      .then(data => {
        tbody.innerHTML = ''; // Limpiar contenido previo
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:20px;">No hay casos registrados</td></tr>';
            return;
        }

        data.forEach(c => {
            const tr = document.createElement('tr');
            // Ajusta los campos según tu base de datos real
            tr.innerHTML = `
              <td class="td-check"><input type="checkbox"></td>
              <td>#${c.id}</td>
              <td>${c.fecha_creacion}</td>
              <td><span class="status activo"><span class="checkdot"></span>Activo</span></td>
              <td>
                <div class="assignee">
                  <span class="ava" style="background:#ccc">${(c.asignado_a || 'U').charAt(0)}</span>
                  <div>${c.asignado_a || 'Sin asignar'}</div>
                </div>
              </td>
              <td><span class="priority ${c.prioridad ? c.prioridad.toLowerCase() : 'media'}">${c.prioridad || 'Media'}</span></td>
              <td>${c.categoria || 'General'}</td>
              <td>${c.cliente || 'N/A'}</td>
              <td>Sistema</td>
              <td class="ellipsis">···</td>
            `;
            tbody.appendChild(tr);
        });
      })
      .catch(err => console.error('Error cargando tabla:', err));
  })();

  // =====================
  // Carga de Datos para Estadísticas (Menu - Estadisticas.html)
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
});
