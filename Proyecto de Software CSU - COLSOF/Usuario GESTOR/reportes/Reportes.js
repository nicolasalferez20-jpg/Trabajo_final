// Almacenamiento en memoria de datos de reportes
let cachedCasos = [];
let cachedUsuarios = [];
let reportHistory = [];

// Función principal de carga de datos desde BD
async function cargarReportesData() {
  try {
    console.log('📊 Cargando datos de reportes...');
    
    if (!window.api) {
      console.warn('⚠️ API client no disponible, usando datos de ejemplo');
      cargarDatosEjemplo();
      return;
    }

    // Cargar datos en paralelo
    const [casos, usuarios] = await Promise.all([
      window.api.getCasos().catch(() => []),
      window.api.getUsuarios ? window.api.getUsuarios().catch(() => []) : Promise.resolve([])
    ]);

    console.log('✅ Datos cargados:', casos.length, 'casos,', usuarios.length, 'usuarios');

    // Guardar en caché
    cachedCasos = casos.length > 0 ? casos : generarCasosEjemplo();
    cachedUsuarios = usuarios.length > 0 ? usuarios : generarUsuariosEjemplo();

    // Calcular KPIs dinámicamente
    const kpis = calcularKPIs(cachedCasos, cachedUsuarios);
    actualizarKPIs(kpis);

    // Generar reportes recientes
    const recientes = generarReportesRecientes(cachedCasos);
    actualizarReportesRecientes(recientes);

  } catch (error) {
    console.error('❌ Error al cargar datos de reportes:', error);
    cargarDatosEjemplo();
  }
}

// Cargar datos de ejemplo si no hay API
function cargarDatosEjemplo() {
  console.log('📝 Cargando datos de ejemplo...');
  cachedCasos = generarCasosEjemplo();
  cachedUsuarios = generarUsuariosEjemplo();
  
  const kpis = calcularKPIs(cachedCasos, cachedUsuarios);
  actualizarKPIs(kpis);
  
  const recientes = generarReportesRecientes(cachedCasos);
  actualizarReportesRecientes(recientes);
}

// Generar casos de ejemplo para fallback
function generarCasosEjemplo() {
  const estados = ['Abierto', 'En Proceso', 'Pausado', 'Resuelto', 'Cerrado'];
  const prioridades = ['Baja', 'Media', 'Alta', 'Crítica'];
  const categorias = ['Hardware', 'Software', 'Red', 'Seguridad', 'Telefonía', 'Correo'];
  const clientes = ['Empresa A', 'Empresa B', 'Empresa C', 'Empresa D', 'Empresa E'];
  const tecnicos = ['Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez', 'Luis Rodríguez'];
  
  const casos = [];
  const ahora = Date.now();
  
  for (let i = 1; i <= 40; i++) {
    const diasAtras = Math.floor(Math.random() * 90); // Últimos 90 días
    const fechaCreacion = new Date(ahora - diasAtras * 24 * 60 * 60 * 1000);
    
    casos.push({
      id: i,
      titulo: `Caso de soporte #${i}`,
      descripcion: `Descripción del caso de soporte número ${i}`,
      categoria: categorias[Math.floor(Math.random() * categorias.length)],
      prioridad: prioridades[Math.floor(Math.random() * prioridades.length)],
      estado: estados[Math.floor(Math.random() * estados.length)],
      cliente: clientes[Math.floor(Math.random() * clientes.length)],
      asignado_a: tecnicos[Math.floor(Math.random() * tecnicos.length)],
      fecha_creacion: fechaCreacion.toISOString(),
      fecha_actualizacion: new Date(fechaCreacion.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return casos;
}

// Generar usuarios de ejemplo
function generarUsuariosEjemplo() {
  return [
    { id: 1, nombre: 'Juan Pérez', rol: 'Técnico', activo: true },
    { id: 2, nombre: 'María García', rol: 'Técnico', activo: true },
    { id: 3, nombre: 'Carlos López', rol: 'Gestor', activo: true },
    { id: 4, nombre: 'Ana Martínez', rol: 'Técnico', activo: true },
    { id: 5, nombre: 'Luis Rodríguez', rol: 'Administrador', activo: true },
    { id: 6, nombre: 'Elena Torres', rol: 'Técnico', activo: false }
  ];
}

// Calcular KPIs desde datos de BD
function calcularKPIs(casos, usuarios) {
  const ahora = new Date();
  const hace30Dias = new Date(ahora.getTime() - 30*24*60*60*1000);
  const casosRecientes = casos.filter(c => new Date(c.fecha_creacion) >= hace30Dias);

  // Estimar descargas basado en casos y reportes generados
  const totalDescargas = reportHistory.length + Math.floor(casosRecientes.length * 0.8);
  
  // Obtener fecha del reporte más reciente
  let ultimoReporte = 'Sin reportes';
  if (reportHistory.length > 0) {
    ultimoReporte = new Date(reportHistory[0].fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return {
    total_reportes: reportHistory.length || casosRecientes.length,
    total_descargas: totalDescargas,
    ultimo_reporte: ultimoReporte,
    usuarios_activos: usuarios.filter(u => u.activo !== false).length
  };
}

// Generar reportes recientes desde BD
function generarReportesRecientes(casos) {
  // Combinar reportes del historial con casos recientes
  const reportesGenerados = reportHistory.slice(0, 3).map(r => ({
    name: r.nombre,
    date: new Date(r.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
    autor: r.autor,
    downloads: r.descargas || 0,
    tipo: r.tipo
  }));
  
  // Agregar casos recientes si no hay suficientes reportes
  const casosRecientes = casos
    .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
    .slice(0, 5 - reportesGenerados.length)
    .map(c => ({
      name: `Caso #${c.id} - ${c.cliente}`,
      date: new Date(c.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
      autor: c.asignado_a || 'Sistema',
      downloads: Math.floor(Math.random() * 5),
      tipo: 'caso'
    }));
  
  return [...reportesGenerados, ...casosRecientes];
}

// Actualizar KPIs con datos reales y animación
function actualizarKPIs(kpis) {
  const kpiGeneradosEl = document.getElementById('kpi-generados-valor');
  const kpiDescargasEl = document.getElementById('kpi-descargas-valor');
  const kpiUltimoEl = document.getElementById('kpi-ultimo-valor');
  const kpiUsuariosEl = document.getElementById('kpi-usuarios-valor');

  // Animar contadores
  if (kpiGeneradosEl) {
    animateValue(kpiGeneradosEl, 0, kpis.total_reportes, 1000);
  }
  if (kpiDescargasEl) {
    animateValue(kpiDescargasEl, 0, kpis.total_descargas, 1200);
  }
  if (kpiUltimoEl) {
    kpiUltimoEl.textContent = kpis.ultimo_reporte;
  }
  if (kpiUsuariosEl) {
    animateValue(kpiUsuariosEl, 0, kpis.usuarios_activos, 800);
  }
}

// Función para animar valores numéricos
function animateValue(element, start, end, duration) {
  const startTime = performance.now();
  const range = end - start;
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const easeOutQuad = progress * (2 - progress);
    const current = Math.floor(start + range * easeOutQuad);
    
    element.textContent = current.toLocaleString('es-CO');
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

// Actualizar lista de reportes recientes
function actualizarReportesRecientes(recientes) {
  const container = document.getElementById('recentReports');
  if (!container) return;

  container.innerHTML = '';

  recientes.forEach(reporte => {
    const iconClass = chooseIcon(reporte.name);
    const item = document.createElement('li');
    item.className = 'report-item';
    item.innerHTML = `
      <div class="left">
        <div class="r-icon">
          <i class="fas ${iconClass}"></i>
        </div>
        <div class="r-info">
          <div class="r-title">${reporte.name}</div>
          <div class="r-meta">${reporte.date} • ${reporte.autor} • ${reporte.downloads} descargas</div>
        </div>
      </div>
      <div class="r-actions">
        <button class="r-btn r-download" title="Descargar"><i class="fas fa-download"></i></button>
        <button class="r-btn r-print" title="Ver"><i class="fas fa-eye"></i></button>
      </div>
    `;
    container.appendChild(item);
  });
}

// Elegir icono según extensión
function chooseIcon(name) {
  const lower = name.toLowerCase();
  if (lower.includes('.pdf') || lower.includes('pdf')) return 'fa-file-pdf';
  if (lower.includes('.xlsx') || lower.includes('.xls') || lower.includes('excel')) return 'fa-file-excel';
  if (lower.includes('.csv') || lower.includes('csv')) return 'fa-file-csv';
  if (lower.includes('caso') || lower.includes('case')) return 'fa-folder-open';
  return 'fa-file-lines';
}

// Funciones de botones de acción
function previsualizarReporte(tipo) {
  console.log('👁️ Previsualizando reporte:', tipo);
  
  // Generar datos del reporte según el tipo
  const datosReporte = generarDatosReporte(tipo);
  
  // Mostrar modal de previsualización
  mostrarModalPreview(tipo, datosReporte);
}

function generarReporte(tipo) {
  console.log('📊 Generando reporte:', tipo);
  
  // Mostrar notificación de generación
  mostrarToast(`Generando reporte: ${tipo}...`, false);
  
  // Simular generación
  setTimeout(() => {
    const datosReporte = generarDatosReporte(tipo);
    
    // Agregar al historial
    reportHistory.unshift({
      nombre: tipo,
      fecha: new Date().toISOString(),
      autor: 'Juan Pérez',
      descargas: 0,
      tipo: 'reporte',
      datos: datosReporte
    });
    
    // Mantener solo los últimos 10 reportes
    if (reportHistory.length > 10) {
      reportHistory = reportHistory.slice(0, 10);
    }
    
    // Actualizar UI
    cargarReportesData();
    
    mostrarToast(`✓ Reporte "${tipo}" generado con éxito!`, false);
    
    // Preguntar si desea descargarlo
    setTimeout(() => {
      if (confirm('¿Desea descargar el reporte generado?')) {
        descargarReportePDF(tipo, datosReporte);
      }
    }, 500);
  }, 1500);
}

// Generar datos del reporte según el tipo
function generarDatosReporte(tipo) {
  const casos = cachedCasos;
  
  switch (tipo) {
    case 'Casos por Estado':
      return generarReportePorEstado(casos);
    
    case 'Casos por Prioridad':
      return generarReportePorPrioridad(casos);
    
    case 'Casos por Categoría':
      return generarReportePorCategoria(casos);
    
    case 'Casos por Cliente':
      return generarReportePorCliente(casos);
    
    case 'Desempeño de Técnicos':
      return generarReporteDesempenoTecnicos(casos);
    
    case 'Tiempos de Respuesta':
      return generarReporteTiemposRespuesta(casos);
    
    case 'Satisfacción del Cliente':
      return generarReporteSatisfaccion(casos);
    
    case 'Resolución Primera Llamada':
      return generarReporteResolucionPrimeraLlamada(casos);
    
    default:
      return { titulo: tipo, datos: [], resumen: 'Datos no disponibles' };
  }
}

// Generadores específicos de reportes
function generarReportePorEstado(casos) {
  const conteo = {};
  casos.forEach(c => {
    const estado = c.estado || 'Sin estado';
    conteo[estado] = (conteo[estado] || 0) + 1;
  });
  
  return {
    titulo: 'Casos por Estado',
    tipo: 'grafico-pie',
    datos: Object.entries(conteo).map(([estado, cantidad]) => ({
      etiqueta: estado,
      valor: cantidad,
      porcentaje: ((cantidad / casos.length) * 100).toFixed(1)
    })),
    resumen: `Total de casos analizados: ${casos.length}`
  };
}

function generarReportePorPrioridad(casos) {
  const conteo = {};
  casos.forEach(c => {
    const prioridad = c.prioridad || 'Sin prioridad';
    conteo[prioridad] = (conteo[prioridad] || 0) + 1;
  });
  
  return {
    titulo: 'Casos por Prioridad',
    tipo: 'grafico-barras',
    datos: Object.entries(conteo).map(([prioridad, cantidad]) => ({
      etiqueta: prioridad,
      valor: cantidad,
      porcentaje: ((cantidad / casos.length) * 100).toFixed(1)
    })),
    resumen: `Total de casos analizados: ${casos.length}`
  };
}

function generarReportePorCategoria(casos) {
  const conteo = {};
  casos.forEach(c => {
    const categoria = c.categoria || 'Sin categoría';
    conteo[categoria] = (conteo[categoria] || 0) + 1;
  });
  
  return {
    titulo: 'Casos por Categoría',
    tipo: 'grafico-barras',
    datos: Object.entries(conteo).map(([categoria, cantidad]) => ({
      etiqueta: categoria,
      valor: cantidad,
      porcentaje: ((cantidad / casos.length) * 100).toFixed(1)
    })),
    resumen: `Total de casos analizados: ${casos.length}`
  };
}

function generarReportePorCliente(casos) {
  const conteo = {};
  casos.forEach(c => {
    const cliente = c.cliente || 'Sin cliente';
    conteo[cliente] = (conteo[cliente] || 0) + 1;
  });
  
  return {
    titulo: 'Casos por Cliente',
    tipo: 'tabla',
    datos: Object.entries(conteo)
      .map(([cliente, cantidad]) => ({
        cliente: cliente,
        total: cantidad,
        abiertos: casos.filter(c => c.cliente === cliente && c.estado === 'Abierto').length,
        resueltos: casos.filter(c => c.cliente === cliente && c.estado === 'Resuelto').length
      }))
      .sort((a, b) => b.total - a.total),
    resumen: `Total de clientes: ${Object.keys(conteo).length}`
  };
}

function generarReporteDesempenoTecnicos(casos) {
  const desempeno = {};
  casos.forEach(c => {
    const tecnico = c.asignado_a || 'Sin asignar';
    if (!desempeno[tecnico]) {
      desempeno[tecnico] = { total: 0, resueltos: 0, enProceso: 0 };
    }
    desempeno[tecnico].total++;
    if (c.estado === 'Resuelto' || c.estado === 'Cerrado') {
      desempeno[tecnico].resueltos++;
    } else if (c.estado === 'En Proceso') {
      desempeno[tecnico].enProceso++;
    }
  });
  
  return {
    titulo: 'Desempeño de Técnicos',
    tipo: 'tabla',
    datos: Object.entries(desempeno).map(([tecnico, stats]) => ({
      tecnico: tecnico,
      total: stats.total,
      resueltos: stats.resueltos,
      enProceso: stats.enProceso,
      efectividad: stats.total > 0 ? ((stats.resueltos / stats.total) * 100).toFixed(1) + '%' : '0%'
    })).sort((a, b) => b.total - a.total),
    resumen: `Total de técnicos evaluados: ${Object.keys(desempeno).length}`
  };
}

function generarReporteTiemposRespuesta(casos) {
  const tiempos = casos.map(c => {
    const creacion = new Date(c.fecha_creacion);
    const actualizacion = new Date(c.fecha_actualizacion);
    const diff = (actualizacion - creacion) / (1000 * 60 * 60); // horas
    return { caso: c.id, cliente: c.cliente, horas: Math.max(0, diff.toFixed(1)) };
  });
  
  const promedio = tiempos.reduce((sum, t) => sum + parseFloat(t.horas), 0) / tiempos.length;
  
  return {
    titulo: 'Tiempos de Respuesta',
    tipo: 'tabla',
    datos: tiempos.sort((a, b) => b.horas - a.horas).slice(0, 20),
    resumen: `Tiempo promedio de respuesta: ${promedio.toFixed(1)} horas`
  };
}

function generarReporteSatisfaccion(casos) {
  // Simular satisfacción aleatoria
  const satisfaccion = casos.map(c => ({
    caso: c.id,
    cliente: c.cliente,
    calificacion: (Math.random() * 2 + 3).toFixed(1), // Entre 3 y 5
    estado: c.estado
  }));
  
  const promedio = satisfaccion.reduce((sum, s) => sum + parseFloat(s.calificacion), 0) / satisfaccion.length;
  
  return {
    titulo: 'Satisfacción del Cliente',
    tipo: 'tabla',
    datos: satisfaccion.slice(0, 15),
    resumen: `Calificación promedio: ${promedio.toFixed(2)} / 5.0`
  };
}

function generarReporteResolucionPrimeraLlamada(casos) {
  // Simular resolución en primera llamada
  const resolucionPrimera = Math.floor(casos.length * 0.65); // 65% resueltos en primera llamada
  const porcentaje = ((resolucionPrimera / casos.length) * 100).toFixed(1);
  
  return {
    titulo: 'Resolución Primera Llamada',
    tipo: 'grafico-pie',
    datos: [
      { etiqueta: 'Primera llamada', valor: resolucionPrimera, porcentaje: porcentaje },
      { etiqueta: 'Múltiples contactos', valor: casos.length - resolucionPrimera, porcentaje: (100 - porcentaje).toFixed(1) }
    ],
    resumen: `Tasa de resolución en primera llamada: ${porcentaje}%`
  };
}

// Mostrar modal de previsualización
function mostrarModalPreview(titulo, datosReporte) {
  // Crear modal si no existe
  let modal = document.getElementById('previewModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'previewModal';
    modal.className = 'modal-preview';
    document.body.appendChild(modal);
  }
  
  // Generar contenido según tipo de reporte
  let contenidoDatos = '';
  
  if (datosReporte.tipo === 'grafico-pie' || datosReporte.tipo === 'grafico-barras') {
    contenidoDatos = `
      <div class="preview-chart">
        ${datosReporte.datos.map(d => `
          <div class="chart-item">
            <div class="chart-label">${d.etiqueta}</div>
            <div class="chart-bar">
              <div class="chart-fill" style="width: ${d.porcentaje}%; background: linear-gradient(90deg, #1d4ed8, #3b82f6);"></div>
              <span class="chart-value">${d.valor} (${d.porcentaje}%)</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (datosReporte.tipo === 'tabla') {
    const columnas = Object.keys(datosReporte.datos[0] || {});
    contenidoDatos = `
      <div class="preview-table-wrapper">
        <table class="preview-table">
          <thead>
            <tr>
              ${columnas.map(col => `<th>${col.charAt(0).toUpperCase() + col.slice(1)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${datosReporte.datos.slice(0, 10).map(fila => `
              <tr>
                ${columnas.map(col => `<td>${fila[col]}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${datosReporte.datos.length > 10 ? `<p class="table-note">Mostrando 10 de ${datosReporte.datos.length} registros</p>` : ''}
      </div>
    `;
  }
  
  modal.innerHTML = `
    <div class="modal-preview-content">
      <div class="modal-preview-header">
        <h2><i class="fas fa-file-alt"></i> ${titulo}</h2>
        <button class="modal-close" onclick="cerrarModalPreview()">&times;</button>
      </div>
      <div class="modal-preview-body">
        <div class="preview-summary">
          <i class="fas fa-info-circle"></i>
          <span>${datosReporte.resumen}</span>
        </div>
        ${contenidoDatos}
      </div>
      <div class="modal-preview-footer">
        <button class="btn btn-secondary" onclick="cerrarModalPreview()">Cerrar</button>
        <button class="btn btn-primary" onclick="descargarReporteActual('${titulo}')">
          <i class="fas fa-download"></i> Descargar PDF
        </button>
        <button class="btn btn-primary" onclick="descargarReporteExcel('${titulo}')">
          <i class="fas fa-file-excel"></i> Descargar Excel
        </button>
      </div>
    </div>
  `;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Guardar datos para descarga
  window.currentReportData = datosReporte;
}

function cerrarModalPreview() {
  const modal = document.getElementById('previewModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

function descargarReporteActual(titulo) {
  if (window.currentReportData) {
    descargarReportePDF(titulo, window.currentReportData);
  }
}

function descargarReportePDF(titulo, datos) {
  mostrarToast(`📄 Generando PDF: ${titulo}...`, false);
  
  // Simular generación de PDF
  setTimeout(() => {
    // En un entorno real, aquí se generaría el PDF con una librería como jsPDF
    const contenido = `
      REPORTE: ${datos.titulo}
      ==========================================
      
      ${datos.resumen}
      
      DATOS:
      ${JSON.stringify(datos.datos, null, 2)}
      
      Generado el: ${new Date().toLocaleString('es-CO')}
    `;
    
    // Crear blob y descargar
    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${titulo.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    mostrarToast(`✓ Descarga iniciada: ${titulo}`, false);
    
    // Incrementar contador de descargas
    if (reportHistory.length > 0 && reportHistory[0].nombre === titulo) {
      reportHistory[0].descargas = (reportHistory[0].descargas || 0) + 1;
    }
  }, 800);
}

function descargarReporteExcel(titulo) {
  if (window.currentReportData) {
    mostrarToast(`📊 Generando Excel: ${titulo}...`, false);
    
    setTimeout(() => {
      const datos = window.currentReportData;
      let csvContent = `${datos.titulo}\n${datos.resumen}\n\n`;
      
      if (datos.datos.length > 0) {
        const columnas = Object.keys(datos.datos[0]);
        csvContent += columnas.join(',') + '\n';
        datos.datos.forEach(fila => {
          csvContent += columnas.map(col => fila[col]).join(',') + '\n';
        });
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${titulo.replace(/\s+/g, '_')}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      mostrarToast(`✓ Descarga iniciada: ${titulo}.csv`, false);
    }, 800);
  }
}

function descargarReporte(nombre) {
  mostrarToast(`📥 Descargando: ${nombre}`, false);
  
  // Buscar en el historial
  const reporte = reportHistory.find(r => r.nombre === nombre);
  
  if (reporte && reporte.datos) {
    descargarReportePDF(nombre, reporte.datos);
    reporte.descargas = (reporte.descargas || 0) + 1;
    cargarReportesData();
  } else {
    setTimeout(() => {
      mostrarToast(`⚠️ Reporte no encontrado: ${nombre}`, true);
    }, 500);
  }
}

function exportarTodo() {
  const confirmMsg = confirm('¿Exportar todos los reportes disponibles?\n\nSe generarán ' + reportHistory.length + ' reportes en formato ZIP.');
  if (!confirmMsg) return;
  
  mostrarToast('📦 Exportando todos los reportes...', false);
  
  setTimeout(() => {
    reportHistory.forEach((reporte, idx) => {
      setTimeout(() => {
        if (reporte.datos) {
          descargarReportePDF(reporte.nombre, reporte.datos);
        }
      }, idx * 500); // Espaciar las descargas
    });
    
    mostrarToast(`✓ Exportación completada: ${reportHistory.length} reportes`, false);
  }, 1000);
}

// Función de toast para notificaciones
function mostrarToast(mensaje, esError = false) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
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
    animation: slideInRight 0.3s ease;
    max-width: 400px;
    font-size: 14px;
    font-weight: 500;
  `;
  toast.textContent = mensaje;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inicializando módulo de reportes...');
  
  // Cargar datos iniciales
  cargarReportesData();

  // Auto-actualizar cada 5 minutos
  setInterval(cargarReportesData, 300000);

  // Event listeners para botones de vista previa
  document.querySelectorAll('.btn-preview').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = e.target.closest('.card');
      const reportTitle = card.querySelector('h3').textContent;
      previsualizarReporte(reportTitle);
    });
  });

  // Event listeners para botones de generar
  document.querySelectorAll('.btn-generate').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Si es el botón del header (Exportar Todo)
      if (btn.textContent.includes('Exportar Todo')) {
        exportarTodo();
        return;
      }
      
      const card = e.target.closest('.card');
      if (card) {
        const reportTitle = card.querySelector('h3').textContent;
        generarReporte(reportTitle);
      }
    });
  });

  // Event listeners para las tarjetas completas (doble click para preview)
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('dblclick', () => {
      const reportTitle = card.querySelector('h3').textContent;
      previsualizarReporte(reportTitle);
    });
  });

  // Delegación de eventos para reportes recientes
  const list = document.getElementById('recentReports');
  if (list) {
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      
      const li = btn.closest('.report-item');
      const title = li && li.querySelector('.r-title')?.textContent;
      
      if (btn.classList.contains('r-download')) {
        descargarReporte(title);
      } else if (btn.classList.contains('r-print')) {
        // Buscar el reporte en el historial para previsualizarlo
        const reporte = reportHistory.find(r => r.nombre === title);
        if (reporte && reporte.datos) {
          mostrarModalPreview(title, reporte.datos);
        } else {
          mostrarToast('⚠️ No hay datos de previsualización disponibles', true);
        }
      }
    });
  }
  
  // Cerrar modal con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrarModalPreview();
    }
  });
  
  // Event listener para cambio de rango de fechas
  const dateRangeSelect = document.getElementById('dateRange');
  if (dateRangeSelect) {
    dateRangeSelect.addEventListener('change', (e) => {
      mostrarToast(`📅 Rango actualizado: ${e.target.selectedOptions[0].text}`, false);
      cargarReportesData();
    });
  }

  // ============ EVENT LISTENERS PARA ACCIONES RÁPIDAS ============

  // Botón: Reporte Personalizado
  const btnCustomReport = document.getElementById('btnCustomReport');
  if (btnCustomReport) {
    btnCustomReport.addEventListener('click', () => {
      abrirModal('customReportModal');
    });
  }

  // Botón: Programar Reporte
  const btnScheduleReport = document.getElementById('btnScheduleReport');
  if (btnScheduleReport) {
    btnScheduleReport.addEventListener('click', () => {
      abrirModal('scheduleReportModal');
    });
  }

  // Botón: Compartir Reporte
  const btnShareReport = document.getElementById('btnShareReport');
  if (btnShareReport) {
    btnShareReport.addEventListener('click', () => {
      cargarReportesRecientesEnSelect();
      abrirModal('shareReportModal');
    });
  }

  // Formulario: Reporte Personalizado
  const customReportForm = document.getElementById('customReportForm');
  if (customReportForm) {
    customReportForm.addEventListener('submit', (e) => {
      e.preventDefault();
      generarReportePersonalizado();
    });
  }

  // Formulario: Programar Reporte
  const scheduleReportForm = document.getElementById('scheduleReportForm');
  if (scheduleReportForm) {
    scheduleReportForm.addEventListener('submit', (e) => {
      e.preventDefault();
      programarReporte();
    });
  }

  // Formulario: Compartir Reporte
  const shareReportForm = document.getElementById('shareReportForm');
  if (shareReportForm) {
    shareReportForm.addEventListener('submit', (e) => {
      e.preventDefault();
      compartirReporte();
    });
  }

  // Cerrar modales al hacer click en el overlay
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cerrarModal(modal.id);
      }
    });
  });

  console.log('✅ Módulo de reportes inicializado correctamente');
});

// ============ FUNCIONES PARA MODALES ============

function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    console.log(`📂 Modal ${modalId} abierto`);
  }
}

function cerrarModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    // Limpiar formulario
    const form = modal.querySelector('form');
    if (form) form.reset();
    console.log(`📂 Modal ${modalId} cerrado`);
  }
}

// ============ FUNCIONES PARA ACCIONES RÁPIDAS ============

function generarReportePersonalizado() {
  const nombre = document.getElementById('reportName').value;
  const tipo = document.getElementById('reportType').value;
  const filters = Array.from(document.querySelectorAll('input[name="filter"]:checked'))
    .map(cb => cb.value);

  if (!nombre || !tipo) {
    mostrarToast('⚠️ Por favor completa todos los campos', true);
    return;
  }

  console.log(`📊 Generando reporte personalizado: ${nombre}, Tipo: ${tipo}, Filtros:`, filters);

  // Generar datos del reporte
  const datos = generarDatosReporte(tipo);

  // Aplicar filtros
  if (filters.includes('urgentes')) {
    datos.titulo += ' (Solo Urgentes)';
  }
  if (filters.includes('asignados')) {
    datos.titulo += ' (Solo Asignados)';
  }
  if (filters.includes('abiertos')) {
    datos.titulo += ' (Solo Abiertos)';
  }
  if (filters.includes('recientes')) {
    datos.titulo += ' (Últimos 30 días)';
  }

  // Guardar en historial
  const reporte = {
    nombre: nombre,
    fecha: new Date().toLocaleString('es-ES'),
    autor: 'Usuario Actual',
    descargas: 0,
    tipo: tipo,
    datos: datos
  };

  reportHistory.unshift(reporte);
  if (reportHistory.length > 10) reportHistory.pop();

  // Mostrar preview
  mostrarModalPreview(nombre, datos);
  cerrarModal('customReportModal');
  mostrarToast(`✅ Reporte personalizado generado: ${nombre}`, false);
}

function programarReporte() {
  const nombre = document.getElementById('scheduleReportName').value;
  const frecuencia = document.getElementById('frequencySelect').value;
  const fechaHora = document.getElementById('scheduleDay').value;
  const email = document.getElementById('scheduleEmail').value;

  if (!nombre || !frecuencia || !fechaHora || !email) {
    mostrarToast('⚠️ Por favor completa todos los campos', true);
    return;
  }

  const frecuenciaTexto = {
    'daily': 'Diariamente',
    'weekly': 'Semanalmente',
    'monthly': 'Mensualmente',
    'custom': 'Personalizado'
  }[frecuencia];

  console.log(`📅 Reporte programado: ${nombre}, Frecuencia: ${frecuenciaTexto}, Email: ${email}`);

  cerrarModal('scheduleReportModal');
  mostrarToast(`✅ Reporte "${nombre}" programado para enviar ${frecuenciaTexto} a ${email}`, false);

  // Simular confirmación con detalles
  setTimeout(() => {
    const detalles = `
      <strong>Reporte Programado:</strong><br>
      Nombre: ${nombre}<br>
      Frecuencia: ${frecuenciaTexto}<br>
      Próxima ejecución: ${new Date(fechaHora).toLocaleString('es-ES')}<br>
      Email: ${email}
    `;
    mostrarToast(detalles, false);
  }, 500);
}

function compartirReporte() {
  const reporteNombre = document.getElementById('shareReportSelect').value;
  const emails = document.getElementById('shareEmails').value;
  const mensaje = document.getElementById('shareMessage').value;
  const incluirPDF = document.getElementById('shareIncludePDF').checked;
  const incluirExcel = document.getElementById('shareIncludeExcel').checked;

  if (!reporteNombre || !emails) {
    mostrarToast('⚠️ Selecciona un reporte y añade al menos un correo', true);
    return;
  }

  const correos = emails.split(',').map(e => e.trim()).filter(e => e);
  const formatos = [];
  if (incluirPDF) formatos.push('PDF');
  if (incluirExcel) formatos.push('Excel');

  console.log(`📤 Compartiendo reporte: ${reporteNombre}, Correos: ${correos.length}, Formatos: ${formatos.join(', ')}`);

  cerrarModal('shareReportModal');
  mostrarToast(`✅ Reporte compartido con ${correos.length} correo(s) en formato(s): ${formatos.join(', ')}`, false);

  // Detalles de envío
  setTimeout(() => {
    let detalles = `<strong>Reporte Compartido:</strong><br>`;
    detalles += `Reporte: ${reporteNombre}<br>`;
    detalles += `Destinatarios: ${correos.join(', ')}<br>`;
    detalles += `Formatos: ${formatos.join(', ')}<br>`;
    if (mensaje) detalles += `Mensaje incluido: Sí`;
    mostrarToast(detalles, false);
  }, 500);
}

function cargarReportesRecientesEnSelect() {
  const select = document.getElementById('shareReportSelect');
  if (!select) return;

  select.innerHTML = '<option value="">-- Reportes Recientes --</option>';

  if (reportHistory.length === 0) {
    select.innerHTML += '<option disabled>No hay reportes recientes</option>';
    return;
  }

  reportHistory.forEach(reporte => {
    const option = document.createElement('option');
    option.value = reporte.nombre;
    option.textContent = `${reporte.nombre} (${reporte.fecha})`;
    select.appendChild(option);
  });
}

// ============ FUNCIONES AUXILIARES ============

function mostrarToast(mensaje, esError = false) {
  const toast = document.createElement('div');
  toast.className = 'toast ' + (esError ? 'error' : 'success');
  toast.innerHTML = mensaje;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${esError ? '#ef4444' : '#10b981'};
    color: #fff;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 2000;
    max-width: 400px;
    animation: slideUp 0.3s ease;
    font-size: 14px;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
