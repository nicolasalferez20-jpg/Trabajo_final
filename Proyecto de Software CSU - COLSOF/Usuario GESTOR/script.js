'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // =====================
  // Helpers
  // =====================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Determinar ruta de la API según dónde estemos (Raíz o Subcarpeta)
  const getApiUrl = () => {
    // Si la URL contiene 'Usuario GESTOR', el api.php está en la misma carpeta
    if (window.location.pathname.includes('Usuario GESTOR')) {
      return 'api.php';
    }
    return 'Proyecto de Software CSU - COLSOF/Usuario GESTOR/api.php';
  };

  // =====================
  // Actualizar Badge de Notificaciones
  // =====================
  function updateBadgeWithUnreadUrgent() {
    fetch(getApiUrl() + '?action=get_notifications')
      .then(res => {
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        return res.text().then(text => {
          try {
            return JSON.parse(text);
          } catch (e) {
            return [];
          }
        });
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

  // Actualizar badge al cargar la página
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

  // Interceptar enlaces del menú (excepto Inicio si existe)
  $$('.menu-list a').forEach(a => {
    if (a.id === 'link-inicio' || a.getAttribute('href').includes('Menu principal.html')) return; // dejar navegar

    const inSubfolder = isInSubfolder();

    // Permitir navegación a Notificaciones
    if (a.textContent.includes('Notificaciones') || a.querySelector('.badge')) {
      a.href = inSubfolder ? '../notificaciones/Menu - Notificaciones.html' : 'notificaciones/Menu - Notificaciones.html';
      return;
    }

    // Permitir navegación a Estadísticas
    if (a.textContent.includes('Estadísticas') || a.textContent.includes('Estadisticas')) {
      a.href = inSubfolder ? '../estadisticas/Menu - Estadisticas.html' : 'estadisticas/Menu - Estadisticas.html';
      return;
    }

    // Permitir navegación a Reportes
    if (a.textContent.includes('Reportes')) {
      a.href = inSubfolder ? '../reportes/Menu - Reportes.html' : 'reportes/Menu - Reportes.html';
      return;
    }

    // Permitir navegación a Herramientas
    if (a.textContent.includes('Herramientas')) {
      a.href = inSubfolder ? '../herramientas/Menu - Herramientas.html' : 'herramientas/Menu - Herramientas.html';
      return;
    }

    // Permitir navegación a Configuración
    if (a.textContent.includes('Configuración') || a.textContent.includes('Configuracion')) {
      a.href = inSubfolder ? '../configuracion/Menu - Configuracion.html' : 'configuracion/Menu - Configuracion.html';
      return;
    }
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

  // Importar XLSX (placeholder; sin modal de construcción)
  const btnImportar = document.querySelector('.import-btn');
  if (btnImportar) btnImportar.addEventListener('click', (e) => { e.preventDefault(); });

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

  // =====================
  // Funcionalidad de Creación de Casos
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
        autor: 'Juan Pérez'
      };

      // Validar campos obligatorios
      if (!caseData.cliente || !caseData.categoria || !caseData.prioridad) {
        alert('Por favor complete los campos obligatorios: Cliente, Categoría y Prioridad');
        return;
      }

      // Deshabilitar botón mientras se procesa
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
          // Mostrar modal de éxito
          if (modalExito) {
            modalExito.style.display = 'flex';
            setTimeout(() => {
              modalExito.style.display = 'none';
              // Redirigir al menú principal
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
        alert('Error de conexión. Por favor intente nuevamente.');
        btnCrearCaso.disabled = false;
        btnCrearCaso.textContent = 'Crear Caso';
      }
    });
  }

  // Funcionalidad del botón Cancelar
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
});

