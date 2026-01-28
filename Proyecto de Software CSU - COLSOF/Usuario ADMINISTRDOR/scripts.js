// scripts.js - lógica unificada para el dashboard y creación de usuarios

(function(){
  // =====================
  // Autenticación y Usuario
  // =====================
  
  // Verificar si hay un usuario autenticado
  const usuarioData = localStorage.getItem('usuario');
  if (!usuarioData) {
    // Si no hay usuario, redirigir al login
    const loginPath = resolveLoginPath();
    window.location.href = loginPath;
    return;
  }

  // Parsear datos del usuario
  let usuario;
  try {
    usuario = JSON.parse(usuarioData);
  } catch (e) {
    console.error('Error al parsear datos del usuario:', e);
    localStorage.removeItem('usuario');
    window.location.href = resolveLoginPath();
    return;
  }

  // Verificar que el usuario tenga el rol correcto (Administrador o Técnico)
  if (usuario.rol && !['administrador', 'tecnico'].includes(usuario.rol.toLowerCase())) {
    alert('No tienes permisos para acceder a esta página.');
    window.location.href = resolveLoginPath();
    return;
  }

  // Actualizar la información del perfil en la interfaz cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', function() {
    const profileName = document.querySelector('.profile-name');
    const profileEmail = document.querySelector('.profile-email');
    
    if (profileName) {
      profileName.textContent = `${usuario.nombre} ${usuario.apellido}`;
    }
    
    if (profileEmail) {
      profileEmail.textContent = usuario.email;
    }
  });

  // Utilidades
  function qs(sel, ctx=document){ return ctx.querySelector(sel); }
  function qsa(sel, ctx=document){ return Array.from(ctx.querySelectorAll(sel)); }

  // Configuración de API
  const API_URL = 'http://localhost:3001/api';
  let refreshInterval = null;
  let currentTimeRange = '12'; // meses por defecto

  // Perfil: abrir/cerrar menú y cerrar sesión
  (function(){
    const btn = qs('#btnProfile') || qs('.profile-menu-btn');
    const menu = qs('#menuProfile') || qs('.profile-menu');
    if (btn && menu) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
      });
      document.addEventListener('click', () => menu.classList.remove('show'));
    }
    const resolveLoginPath = () => {
      const href = window.location.href;
      const encodedMarker = 'Proyecto%20de%20Software%20CSU%20-%20COLSOF';
      if (href.includes(encodedMarker)) return href.split(encodedMarker)[0] + `${encodedMarker}/index.html`;

      const plainMarker = 'Proyecto de Software CSU - COLSOF';
      if (href.includes(plainMarker)) return href.split(plainMarker)[0] + `${plainMarker}/index.html`;

      return '/index.html';
    };

    /* LOGOUT DESCONECTADO - REQUIERE LOGIN
    const loginPath = resolveLoginPath();
    qsa('.logout-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        alert('Sesión cerrada.');
        window.location.href = loginPath;
      });
    });
    */

    // Botón de logout en modo standalone
    qsa('.logout-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        alert('Modo standalone - La funcionalidad de logout está desconectada del login.');
      });
    });
  })();

  // Modal de construcción (compatibilidad con ambos ids)
  (function(){
    const modal = qs('#mdlConstruccion') || qs('#modal-construccion');
    const cerrar = qs('#btnCerrarModal') || qs('#cerrar-modal');
    if (!modal) return;
    qsa('.open-modal').forEach(a => a.addEventListener('click', (e) => { e.preventDefault(); modal.classList.add('active'); modal.style.display = 'flex'; }));
    if (cerrar) cerrar.addEventListener('click', () => { modal.classList.remove('active'); modal.style.display = 'none'; });
    modal.addEventListener('click', (e) => { if (e.target === modal) { modal.classList.remove('active'); modal.style.display = 'none'; } });
  })();

  // =====================
  // CARGAR ESTADÍSTICAS DINÁMICAS
  // =====================
  async function loadDashboardStats() {
    try {
      // Cargar estadísticas de casos
      const response = await fetch(`${API_URL}?action=get_casos_simple`);
      if (!response.ok) throw new Error('Error al cargar estadísticas');
      
      const casos = await response.json();
      
      // Obtener fecha actual y mes anterior
      const ahora = new Date();
      const mesActual = ahora.getMonth();
      const anoActual = ahora.getFullYear();
      
      const mesPasado = mesActual === 0 ? 11 : mesActual - 1;
      const anoPasado = mesActual === 0 ? anoActual - 1 : anoActual;
      
      // Separar casos por mes
      const casosActuales = casos.filter(c => {
        if (!c.fecha_creacion) return false;
        const fecha = new Date(c.fecha_creacion);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === anoActual;
      });
      
      const casosPasados = casos.filter(c => {
        if (!c.fecha_creacion) return false;
        const fecha = new Date(c.fecha_creacion);
        return fecha.getMonth() === mesPasado && fecha.getFullYear() === anoPasado;
      });
      
      // Calcular estadísticas del mes actual
      const solucionadosActuales = casosActuales.filter(c => c.estado?.toLowerCase() === 'resuelto').length;
      const creadosActuales = casosActuales.length;
      const pausadosActuales = casosActuales.filter(c => c.estado?.toLowerCase() === 'pausado').length;
      const cerradosActuales = casosActuales.filter(c => c.estado?.toLowerCase() === 'cerrado').length;
      
      // Calcular estadísticas del mes pasado
      const solucionadosPasados = casosPasados.filter(c => c.estado?.toLowerCase() === 'resuelto').length || 1;
      const creadosPasados = casosPasados.length || 1;
      const pausadosPasados = casosPasados.filter(c => c.estado?.toLowerCase() === 'pausado').length || 1;
      const cerradosPasados = casosPasados.filter(c => c.estado?.toLowerCase() === 'cerrado').length || 1;
      
      // Calcular tendencias reales
      const tendenciaSolucionados = calcularTendencia(solucionadosActuales, solucionadosPasados);
      const tendenciaCreados = calcularTendencia(creadosActuales, creadosPasados);
      const tendenciaPausados = calcularTendencia(pausadosActuales, pausadosPasados);
      const tendenciaCerrados = calcularTendencia(cerradosActuales, cerradosPasados);
      
      // Actualizar las tarjetas de estadísticas
      const statCards = qsa('.stat-card');
      if (statCards.length >= 4) {
        updateStatCard(statCards[0], 'Solucionados', solucionadosActuales, tendenciaSolucionados);
        updateStatCard(statCards[1], 'Creados', creadosActuales, tendenciaCreados);
        updateStatCard(statCards[2], 'En Pausa', pausadosActuales, tendenciaPausados);
        updateStatCard(statCards[3], 'Cerrados', cerradosActuales, tendenciaCerrados);
      }
      
      // Actualizar flujo de casos (con todos los casos)
      updateFlujoCasos(casos);
      
      // Actualizar gráfico
      generateDynamicChart(casos, currentTimeRange);
      
      console.log('✓ Estadísticas actualizadas:', { solucionadosActuales, creadosActuales, pausadosActuales, cerradosActuales });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }

  function calcularTendencia(actual, anterior) {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    const porcentaje = ((actual - anterior) / anterior) * 100;
    return Math.round(porcentaje);
  }

  function updateStatCard(card, title, value, trend) {
    const valueEl = card.querySelector('.stat-value');
    const trendEl = card.querySelector('.stat-change');
    
    if (valueEl) {
      // Animación de conteo
      const currentValue = parseInt(valueEl.textContent.replace(/,/g, '')) || 0;
      animateValue(valueEl, currentValue, value, 800);
    }
    
    if (trendEl && trend !== undefined) {
      const isPositive = trend >= 0;
      trendEl.textContent = `${isPositive ? '+' : ''}${trend}% ${isPositive ? '↑' : '↓'}`;
      
      // Cambiar clase: verde si positivo, rojo si negativo
      trendEl.className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
      
      // Aplicar estilos dinámicos
      if (isPositive) {
        trendEl.style.color = 'var(--col-good)';
      } else {
        trendEl.style.color = 'var(--col-bad)';
      }
    }
  }

  function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        current = end;
        clearInterval(timer);
      }
      element.textContent = Math.floor(current).toLocaleString('es-CO');
    }, 16);
  }

  function updateFlujoCasos(casos) {
    const resueltos = casos.filter(c => c.estado?.toLowerCase() === 'resuelto').length;
    const enCurso = casos.filter(c => ['abierto', 'en progreso', 'activo'].includes(c.estado?.toLowerCase())).length;
    const pausados = casos.filter(c => c.estado?.toLowerCase() === 'pausado').length;
    const cancelados = casos.filter(c => c.estado?.toLowerCase() === 'cancelado').length;
    
    const total = casos.length || 1;
    
    const progressRows = qsa('.progress-row');
    if (progressRows.length >= 4) {
      updateProgressRow(progressRows[0], 'Resueltos', resueltos, (resueltos / total) * 100);
      updateProgressRow(progressRows[1], 'En Curso', enCurso, (enCurso / total) * 100);
      updateProgressRow(progressRows[2], 'Pausados', pausados, (pausados / total) * 100);
      updateProgressRow(progressRows[3], 'Cancelados', cancelados, (cancelados / total) * 100);
    }
  }

  function updateProgressRow(row, name, value, percentage) {
    const valueEl = row.querySelector('.value');
    const barEl = row.querySelector('.bar');
    
    if (valueEl) valueEl.textContent = value.toLocaleString('es-CO');
    if (barEl) {
      barEl.style.width = `${Math.min(percentage, 100)}%`;
      barEl.className = `bar w-${Math.min(Math.round(percentage), 100)}`;
    }
  }

  function updateChart(casos) {
    // Agrupar casos por mes
    const casosPorMes = {};
    casos.forEach(caso => {
      if (caso.fecha_creacion) {
        const fecha = new Date(caso.fecha_creacion);
        const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        casosPorMes[mesKey] = (casosPorMes[mesKey] || 0) + 1;
      }
    });
    
    // Los últimos 12 meses
    const meses = Object.keys(casosPorMes).sort().slice(-12);
    console.log('✓ Gráfico actualizado con datos de', meses.length, 'meses');
  }

  // =====================
  // CARGAR LISTA DE USUARIOS
  // =====================
  async function loadUsuarios() {
    try {
      const response = await fetch(`${API_URL}?action=get_casos_simple`);
      if (!response.ok) throw new Error('Error al cargar datos');
      
      const casos = await response.json();
      
      // Extraer usuarios únicos de los casos
      const usuariosMap = new Map();
      casos.forEach(caso => {
        if (caso.asignado_a && caso.asignado_a !== 'Sin asignar') {
          if (!usuariosMap.has(caso.asignado_a)) {
            usuariosMap.set(caso.asignado_a, {
              nombre: caso.asignado_a,
              casos: 0,
              email: `${caso.asignado_a.toLowerCase().replace(/\s+/g, '.')}@colsof.com.co`,
              estado: 'Activo',
              rol: caso.asignado_a.includes('Técnico') ? 'Técnico' : 'Gestor'
            });
          }
          usuariosMap.get(caso.asignado_a).casos++;
        }
      });
      
      const usuarios = Array.from(usuariosMap.values());
      
      // Actualizar lista de usuarios
      const listContainer = qs('.list');
      if (listContainer && usuarios.length > 0) {
        const usuariosMostrar = usuarios.slice(0, 4);
        listContainer.innerHTML = usuariosMostrar.map((user, idx) => `
          <div class="list-row" role="row">
            <div class="list-id" role="cell">${18000 + idx}</div>
            <div role="cell">
              <div class="list-name">${user.nombre}</div>
              <div class="list-email">${user.email}</div>
            </div>
            <div class="status" role="cell"><span class="dot green"></span> ${user.estado}</div>
            <div class="role" role="cell">${user.rol}</div>
            <div role="cell"><button class="btn-icon" aria-label="Más opciones">⋯</button></div>
          </div>
        `).join('');
      }
      
      // Actualizar usuarios activos
      const miniList = qs('.mini-list');
      if (miniList && usuarios.length > 0) {
        const topUsuarios = usuarios.sort((a, b) => b.casos - a.casos).slice(0, 4);
        const miniItems = topUsuarios.map((user, idx) => `
          <div class="mini-item">
            <div class="mini-left">
              <span class="mini-avatar"><img src="https://i.pravatar.cc/36?img=${idx + 10}" alt="${user.nombre}"></span>
              <div class="mini-info">
                <div class="name">${user.nombre}</div>
                <div class="email">${user.email}</div>
              </div>
            </div>
            <div class="mini-right"><div><strong>${user.casos}</strong></div><div>Casos</div></div>
          </div>
        `).join('');
        
        miniList.innerHTML = miniItems + '<div class="text-center-margin"><a class="card-action-link" href="Usuarios/Lista/Lista.html">Ver más</a></div>';
      }
      
      console.log('✓ Usuarios actualizados:', usuarios.length, 'usuarios encontrados');
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  }

  // Exportar CSV (dashboard)
  (function(){
    const btnCSV = qs('#btnCSV');
    if (!btnCSV) return;
    btnCSV.addEventListener('click', async () => {
      try {
        const response = await fetch(`${API_URL}?action=get_casos_simple`);
        if (!response.ok) throw new Error('Error al cargar datos');
        
        const casos = await response.json();
        
        // Crear CSV con datos reales
        const headers = ['ID', 'Cliente', 'Estado', 'Prioridad', 'Categoría', 'Asignado', 'Fecha Creación'];
        const filas = [headers];
        
        casos.forEach(caso => {
          filas.push([
            caso.id || '',
            caso.cliente || '',
            caso.estado || '',
            caso.prioridad || '',
            caso.categoria || '',
            caso.asignado_a || '',
            caso.fecha_creacion || ''
          ]);
        });
        
        const csv = filas.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const fecha = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `reporte_casos_${fecha}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        // Mostrar notificación
        showNotification('✓ CSV exportado exitosamente', 'success');
      } catch (error) {
        console.error('Error al exportar CSV:', error);
        showNotification('✗ Error al exportar CSV', 'error');
      }
    });
  })();

  // =====================
  // FILTROS DE RANGO DE TIEMPO
  // =====================
  (function(){
    const buttons = qsa('.btn-group button:not(#btnCSV)');
    buttons.forEach(btn => {
      btn.addEventListener('click', function() {
        // Remover active de todos
        buttons.forEach(b => b.classList.remove('active'));
        // Agregar active al clickeado
        this.classList.add('active');
        
        // Extraer rango
        const text = this.textContent.trim();
        if (text.includes('12 Meses')) currentTimeRange = '12';
        else if (text.includes('6 Meses')) currentTimeRange = '6';
        else if (text.includes('30 Días')) currentTimeRange = '30';
        else if (text.includes('7 Días')) currentTimeRange = '7';
        
        // Recargar datos con el nuevo filtro y actualizar gráfico
        loadDashboardStats();
        fetch(`${API_URL}?action=get_casos_simple`)
          .then(r => r.json())
          .then(casos => generateDynamicChart(casos, currentTimeRange))
          .catch(e => console.error('Error al actualizar gráfico:', e));
        showNotification(`Filtro aplicado: ${text}`, 'info');
      });
    });
    
    // Marcar el primero como activo por defecto
    if (buttons.length > 0) {
      buttons[0].classList.add('active');
    }
  })();

  // =====================
  // GENERAR GRÁFICO DINÁMICO
  // =====================
  function generateDynamicChart(casos, timeRange) {
    const chartWrap = qs('.chart-wrap');
    if (!chartWrap) return;

    let datos = {};
    let labels = [];

    if (timeRange === '7') {
      datos = agruparPorDia(casos, 7);
      labels = generarEtiquetasDias(7);
    } else if (timeRange === '30') {
      datos = agruparPorDia(casos, 30);
      labels = generarEtiquetasDias(30);
    } else if (timeRange === '6') {
      datos = agruparPorMes(casos, 6);
      labels = generarEtiquetasMeses(6);
    } else {
      datos = agruparPorMes(casos, 12);
      labels = generarEtiquetasMeses(12);
    }

    const puntos = Object.values(datos);
    if (puntos.length === 0) return;

    const maxValor = Math.max(...puntos, 10);
    const svg = crearSVGGrafico(puntos, maxValor);
    
    chartWrap.innerHTML = '';
    chartWrap.appendChild(svg);
  }

  function agruparPorDia(casos, dias) {
    const datos = {};
    const hoy = new Date();

    for (let i = dias - 1; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      const key = fecha.toISOString().split('T')[0];
      datos[key] = 0;
    }

    casos.forEach(caso => {
      if (caso.fecha_creacion) {
        const fecha = new Date(caso.fecha_creacion);
        const key = fecha.toISOString().split('T')[0];
        if (datos.hasOwnProperty(key)) {
          datos[key]++;
        }
      }
    });

    return datos;
  }

  function agruparPorMes(casos, meses) {
    const datos = {};
    const hoy = new Date();

    for (let i = meses - 1; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      datos[key] = 0;
    }

    casos.forEach(caso => {
      if (caso.fecha_creacion) {
        const fecha = new Date(caso.fecha_creacion);
        const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        if (datos.hasOwnProperty(key)) {
          datos[key]++;
        }
      }
    });

    return datos;
  }

  function generarEtiquetasDias(dias) {
    const etiquetas = [];
    const hoy = new Date();

    for (let i = dias - 1; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      etiquetas.push(String(fecha.getDate()).padStart(2, '0'));
    }

    return etiquetas;
  }

  function generarEtiquetasMeses(meses) {
    const etiquetas = [];
    const hoy = new Date();
    const mesesNombre = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    for (let i = meses - 1; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      etiquetas.push(mesesNombre[fecha.getMonth()]);
    }

    return etiquetas;
  }

  function crearSVGGrafico(datos, max) {
    const ancho = 600;
    const alto = 260;
    const padding = 40;
    const graphWidth = ancho - padding * 2;
    const graphHeight = alto - padding * 2;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Gráfico de casos por período');
    svg.style.width = '100%';
    svg.style.height = '100%';

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', ancho);
    rect.setAttribute('height', alto);
    rect.setAttribute('fill', '#fff');
    svg.appendChild(rect);

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const grad1 = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad1.setAttribute('id', 'g1');
    grad1.setAttribute('x1', '0');
    grad1.setAttribute('x2', '0');
    grad1.setAttribute('y1', '0');
    grad1.setAttribute('y2', '1');
    grad1.innerHTML = '<stop offset="0%" stop-color="#7d88ff" stop-opacity="0.25" /><stop offset="100%" stop-color="#7d88ff" stop-opacity="0" />';
    defs.appendChild(grad1);

    const grad2 = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad2.setAttribute('id', 'g2');
    grad2.setAttribute('x1', '0');
    grad2.setAttribute('x2', '0');
    grad2.setAttribute('y1', '0');
    grad2.setAttribute('y2', '1');
    grad2.innerHTML = '<stop offset="0%" stop-color="#5b6bff" stop-opacity="0.25" /><stop offset="100%" stop-color="#5b6bff" stop-opacity="0" />';
    defs.appendChild(grad2);
    svg.appendChild(defs);

    const puntos1 = datos.map((valor, i) => {
      const x = padding + (i / (datos.length - 1 || 1)) * graphWidth;
      const y = alto - padding - (valor / max) * graphHeight;
      return [x, y];
    });

    const puntos2 = datos.map((valor, i) => {
      const x = padding + (i / (datos.length - 1 || 1)) * graphWidth;
      const y = alto - padding - ((valor * 0.7) / max) * graphHeight;
      return [x, y];
    });

    const pathArea1 = generarPath(puntos1, 'area', alto - padding);
    pathArea1.setAttribute('fill', 'url(#g1)');
    svg.appendChild(pathArea1);

    const pathArea2 = generarPath(puntos2, 'area', alto - padding);
    pathArea2.setAttribute('fill', 'url(#g2)');
    svg.appendChild(pathArea2);

    const path1 = generarPath(puntos1, 'line');
    path1.setAttribute('stroke', '#7d88ff');
    path1.setAttribute('stroke-width', '3');
    path1.setAttribute('fill', 'none');
    path1.setAttribute('class', 'chart-line');
    svg.appendChild(path1);

    const path2 = generarPath(puntos2, 'line');
    path2.setAttribute('stroke', '#5b6bff');
    path2.setAttribute('stroke-width', '3');
    path2.setAttribute('fill', 'none');
    path2.setAttribute('class', 'chart-line');
    svg.appendChild(path2);

    return svg;
  }

  function generarPath(puntos, tipo, altofondo) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    if (tipo === 'line') {
      const d = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
      path.setAttribute('d', d);
    } else if (tipo === 'area') {
      let d = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
      d += ` L ${puntos[puntos.length - 1][0]} ${altofondo} L ${puntos[0][0]} ${altofondo} Z`;
      path.setAttribute('d', d);
    }

    return path;
  }

  // =====================
  // SISTEMA DE NOTIFICACIONES
  // =====================
  function showNotification(message, type = 'info') {
    const notif = document.createElement('div');
    notif.className = `notification notification-${type}`;
    notif.textContent = message;
    notif.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 10px;
      background: ${type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#2563eb'};
      color: white;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
      notif.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => notif.remove(), 300);
    }, 3000);
  }

  // Agregar estilos de animación
  if (!qs('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
      .btn-group button.active {
        background: #15467b;
        color: white;
        font-weight: 700;
      }
    `;
    document.head.appendChild(style);
  }

  // =====================
  // AUTO-REFRESH
  // =====================
  function startAutoRefresh() {
    // Cargar datos inicialmente
    loadDashboardStats();
    loadUsuarios();
    
    // Actualizar cada 30 segundos
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
      loadDashboardStats();
      loadUsuarios();
      console.log('🔄 Dashboard actualizado automáticamente');
    }, 30000);
  }

  // Iniciar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAutoRefresh);
  } else {
    startAutoRefresh();
  }

  // Generar contraseña segura (form usuarios)
  (function(){
    const btnGen = qs('.gen-pass-btn');
    const input = qs('#contrasena');
    if (!btnGen || !input) return;
    function generarContrasena(longitud = 12) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?';
      let pass = '';
      for (let i = 0; i < longitud; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
      return pass;
    }
    btnGen.addEventListener('click', (e) => {
      e.preventDefault();
      input.value = generarContrasena();
    });
  })();

  // Envío del formulario de creación: validar, mostrar éxito/error y redirigir
  (function(){
    const form = qs('.user-form');
    if (!form) return;
    const modalExito = qs('#modal-exito');
    const modalError = qs('#modal-error');
    const cerrarError = qs('#cerrar-modal-error');
    const goToMenu = () => { window.location.href = 'Menu principal Admin.html'; };

    if (cerrarError && modalError) cerrarError.onclick = () => { modalError.style.display = 'none'; };

    form.addEventListener('submit', function(e){
      e.preventDefault();
      if (form.checkValidity()) {
        if (modalExito) {
          modalExito.style.display = 'flex';
          // Redirección automática
          setTimeout(goToMenu, 1400);
          // Si existe botón de cierre, también redirige
          const cerrarExito = qs('#cerrar-modal-exito');
          if (cerrarExito) cerrarExito.onclick = goToMenu;
        } else {
          goToMenu();
        }
      } else {
        form.reportValidity();
        if (modalError) modalError.style.display = 'flex';
      }
    });
  })();
})();
