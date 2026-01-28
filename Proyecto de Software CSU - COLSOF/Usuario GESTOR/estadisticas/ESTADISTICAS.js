// Dashboard de Estadísticas conectado a la BD
// Requiere: ../../shared/app-init.js (api + utils)

const palette = {
  primary: '#15467b',
  accent: '#0b3a66',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  muted: '#97a0aa'
};

let monthlyChart;
let categoryChart;
let priorityChart;
let hourChart;

const resolvedStatuses = ['Cerrado', 'Resuelto'];

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  setupExportButton();
});

async function loadDashboard() {
  try {
    // Intentar cargar datos desde la API
    const [stats, casos] = await Promise.all([
      api.getEstadisticasCasos(),
      api.getCasos()
    ]);

    console.log('✅ Datos cargados desde la API:', { stats, casos: casos.length });

    const normalized = normalizeStats(stats);

    updateKPIs(normalized, casos);
    renderMonthlyChart(casos);
    renderCategoryChart(casos);
    renderPriorityChart(casos, normalized);
    renderHourChart(casos);
    renderTechTable(casos);
  } catch (error) {
    console.warn('⚠️ Error al cargar estadísticas desde API:', error);
    console.log('➡️ Cargando datos de ejemplo para demostración...');
    
    // Cargar datos de ejemplo cuando hay error de conexión
    const casosEjemplo = generarCasosEjemplo();
    const statsEjemplo = generarEstadisticasEjemplo(casosEjemplo);
    
    const normalized = normalizeStats(statsEjemplo);
    
    updateKPIs(normalized, casosEjemplo);
    renderMonthlyChart(casosEjemplo);
    renderCategoryChart(casosEjemplo);
    renderPriorityChart(casosEjemplo, normalized);
    renderHourChart(casosEjemplo);
    renderTechTable(casosEjemplo);
    
    utils.showToast('📊 Mostrando datos de ejemplo (sin conexión a BD)', false);
  }
}

// Generar casos de ejemplo para demostración
function generarCasosEjemplo() {
  const estados = ['Abierto', 'En Progreso', 'Pausado', 'Resuelto', 'Cerrado'];
  const prioridades = ['Baja', 'Media', 'Alta', 'Urgente', 'Crítica'];
  const categorias = ['Hardware', 'Software', 'Red', 'Seguridad', 'Backup', 'Telefonía'];
  const tecnicos = ['Carlos Méndez', 'Ana López', 'Luis Vargas', 'Diana Ruiz', 'Jorge Parra'];
  
  const casos = [];
  const ahora = new Date();
  
  // Generar 50 casos de ejemplo distribuidos en los últimos 3 meses
  for (let i = 1; i <= 50; i++) {
    const diasAtras = Math.floor(Math.random() * 90); // Últimos 90 días
    const horasAtras = Math.floor(Math.random() * 24);
    const fechaCreacion = new Date(ahora);
    fechaCreacion.setDate(fechaCreacion.getDate() - diasAtras);
    fechaCreacion.setHours(fechaCreacion.getHours() - horasAtras);
    
    const estado = estados[Math.floor(Math.random() * estados.length)];
    const esResuelto = estado === 'Resuelto' || estado === 'Cerrado';
    
    const fechaActualizacion = new Date(fechaCreacion);
    if (esResuelto) {
      fechaActualizacion.setHours(fechaActualizacion.getHours() + Math.floor(Math.random() * 48) + 2);
    }
    
    casos.push({
      id: i,
      estado: estado,
      prioridad: prioridades[Math.floor(Math.random() * prioridades.length)],
      categoria: categorias[Math.floor(Math.random() * categorias.length)],
      asignado_a: tecnicos[Math.floor(Math.random() * tecnicos.length)],
      fecha_creacion: fechaCreacion.toISOString(),
      fecha_actualizacion: fechaActualizacion.toISOString(),
      cliente: `Cliente ${i}`,
      descripcion: `Caso de ejemplo ${i}`
    });
  }
  
  return casos;
}

function generarEstadisticasEjemplo(casos) {
  const porEstado = {};
  const porPrioridad = {};
  const porTecnico = {};
  
  casos.forEach(caso => {
    // Contar por estado
    porEstado[caso.estado] = (porEstado[caso.estado] || 0) + 1;
    // Contar por prioridad
    porPrioridad[caso.prioridad] = (porPrioridad[caso.prioridad] || 0) + 1;
    // Contar por técnico
    porTecnico[caso.asignado_a] = (porTecnico[caso.asignado_a] || 0) + 1;
  });
  
  return {
    total: casos.length,
    por_estado: Object.entries(porEstado).map(([estado, count]) => ({ estado, count })),
    por_prioridad: Object.entries(porPrioridad).map(([prioridad, count]) => ({ prioridad, count })),
    por_tecnico: Object.entries(porTecnico).map(([asignado_a, count]) => ({ asignado_a, count }))
  };
}

function normalizeStats(stats) {
  const porEstado = {};
  (stats.por_estado || []).forEach(item => {
    porEstado[item.estado || 'Sin estado'] = Number(item.count) || 0;
  });

  const porPrioridad = {};
  (stats.por_prioridad || []).forEach(item => {
    porPrioridad[item.prioridad || 'Sin prioridad'] = Number(item.count) || 0;
  });

  const porTecnico = {};
  (stats.por_tecnico || []).forEach(item => {
    porTecnico[item.asignado_a || 'Sin asignar'] = Number(item.count) || 0;
  });

  return {
    total: Number(stats.total) || 0,
    porEstado,
    porPrioridad,
    porTecnico
  };
}

function updateKPIs(stats, casos) {
  const totalElement = document.getElementById('kpi-total');
  const resolucionElement = document.getElementById('kpi-resolucion');
  const tiempoElement = document.getElementById('kpi-tiempo');
  const satisfaccionElement = document.getElementById('kpi-satisfaccion');

  const total = stats.total || casos.length;
  const cerrados = resolvedStatuses.reduce((acc, status) => acc + (stats.porEstado[status] || 0), 0);
  const tasaResolucion = total > 0 ? ((cerrados / total) * 100).toFixed(1) : 0;

  const avgHours = calcularTiempoPromedio(casos);
  const satisfaccion = Math.max(80, Math.min(100, Math.round(tasaResolucion || 90))); // proxy al no tener dato real

  // Animación de conteo con colores dinámicos
  if (totalElement) {
    animateValue(totalElement, 0, total, 1200);
    totalElement.closest('.kpi-card')?.classList.add('kpi-loaded');
  }
  if (resolucionElement) {
    animateValue(resolucionElement, 0, tasaResolucion, 1400, '%');
    const card = resolucionElement.closest('.kpi-card');
    card?.classList.add('kpi-loaded');
    if (tasaResolucion >= 80) card?.classList.add('kpi-success');
    else if (tasaResolucion >= 60) card?.classList.add('kpi-warning');
    else card?.classList.add('kpi-danger');
  }
  if (tiempoElement) {
    animateValue(tiempoElement, 0, avgHours, 1600, 'h');
    tiempoElement.closest('.kpi-card')?.classList.add('kpi-loaded');
  }
  if (satisfaccionElement) {
    animateValue(satisfaccionElement, 0, satisfaccion, 1800, '%');
    const card = satisfaccionElement.closest('.kpi-card');
    card?.classList.add('kpi-loaded');
    if (satisfaccion >= 90) card?.classList.add('kpi-success');
    else if (satisfaccion >= 75) card?.classList.add('kpi-warning');
  }

  setTrends();
}

function animateValue(element, start, end, duration, suffix = '') {
  const startTime = Date.now();
  const isDecimal = String(end).includes('.');
  
  function update() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = start + (end - start) * easeOut;
    
    const value = isDecimal ? current.toFixed(1) : Math.round(current);
    element.textContent = value + suffix;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  update();
}

function setTrends() {
  const trendTotal = document.getElementById('kpi-total-trend');
  const trendRes = document.getElementById('kpi-resolucion-trend');
  const trendTiempo = document.getElementById('kpi-tiempo-trend');
  const trendSat = document.getElementById('kpi-satisfaccion-trend');

  if (trendTotal) trendTotal.innerHTML = '<span class="positive">▴ <small>vs. mes previo</small></span>';
  if (trendRes) trendRes.innerHTML = '<span class="positive">▴ <small>Mejora</small></span>';
  if (trendTiempo) trendTiempo.innerHTML = '<span class="neutral">— <small>Estable</small></span>';
  if (trendSat) trendSat.innerHTML = '<span class="positive">▴ <small>Meta 90%</small></span>';
}

function setFallbackKPIs() {
  ['kpi-total', 'kpi-resolucion', 'kpi-tiempo', 'kpi-satisfaccion'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '—';
  });
}

function calcularTiempoPromedio(casos) {
  const completados = casos.filter(c => resolvedStatuses.includes(c.estado));
  if (completados.length === 0) return 0;

  const totalHoras = completados.reduce((sum, caso) => {
    const inicio = new Date(caso.fecha_creacion).getTime();
    const fin = new Date(caso.fecha_actualizacion || caso.fecha_creacion).getTime();
    const horas = Math.max(0, (fin - inicio) / 3600000);
    return sum + horas;
  }, 0);

  return Math.round(totalHoras / completados.length);
}

function renderMonthlyChart(casos) {
  const ctx = document.getElementById('monthlyChart');
  if (!ctx) return;

  const byMonth = new Map();
  casos.forEach(caso => {
    const fecha = new Date(caso.fecha_creacion);
    if (Number.isNaN(fecha.getTime())) return;
    const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const label = fecha.toLocaleString('es-CO', { month: 'short' });
    if (!byMonth.has(key)) {
      byMonth.set(key, { label, total: 0, resueltos: 0 });
    }
    const item = byMonth.get(key);
    item.total += 1;
    if (resolvedStatuses.includes(caso.estado)) item.resueltos += 1;
  });

  const labels = Array.from(byMonth.keys()).sort().map(key => byMonth.get(key).label);
  const totals = Array.from(byMonth.keys()).sort().map(key => byMonth.get(key).total);
  const solved = Array.from(byMonth.keys()).sort().map(key => byMonth.get(key).resueltos);

  if (monthlyChart) monthlyChart.destroy();

  monthlyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Creados',
          data: totals,
          borderWidth: 3,
          borderColor: '#1d4ed8',
          backgroundColor: 'rgba(29,78,216,0.12)',
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#1d4ed8',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          fill: true
        },
        {
          label: 'Resueltos',
          data: solved,
          borderWidth: 3,
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22,163,74,0.12)',
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#16a34a',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1500,
        easing: 'easeInOutQuart'
      },
      plugins: { 
        legend: { 
          position: 'top',
          labels: {
            padding: 15,
            font: { size: 13, weight: '600' },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 12,
          cornerRadius: 8,
          titleFont: { size: 14, weight: '600' },
          bodyFont: { size: 13 }
        }
      },
      scales: {
        x: { 
          ticks: { color: palette.muted, font: { size: 12 } }, 
          grid: { display: false },
          border: { display: false }
        },
        y: { 
          ticks: { color: palette.muted, font: { size: 12 } }, 
          grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
          border: { display: false }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  });
}

// Actualizar gráfico de categoría
function renderCategoryChart(casos) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;

  const counts = casos.reduce((acc, caso) => {
    const key = caso.categoria || 'Sin categoría';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const labels = Object.keys(counts);
  const valores = Object.values(counts);

  if (categoryChart) categoryChart.destroy();

  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: valores,
        backgroundColor: [
          '#1d4ed8', // Azul primary
          '#2563eb', // Azul medium
          '#60a5fa', // Azul claro
          '#7c3aed', // Violeta
          '#a855f7', // Violeta claro
          '#06b6d4', // Cyan
          '#14b8a6', // Teal
          '#f59e0b'  // Amber
        ],
        borderWidth: 3,
        borderColor: '#fff',
        hoverOffset: 15,
        hoverBorderColor: '#fff',
        hoverBorderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1500,
        easing: 'easeInOutQuart'
      },
      plugins: { 
        legend: { 
          position: 'bottom',
          labels: {
            padding: 12,
            font: { size: 12, weight: '500' },
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 10
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 12,
          cornerRadius: 8,
          titleFont: { size: 14, weight: '600' },
          bodyFont: { size: 13 },
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      cutout: '65%'
    }
  });
}

function renderPriorityChart(casos, stats) {
  const ctx = document.getElementById('priorityChart');
  if (!ctx) return;

  const orden = ['Crítica', 'Urgente', 'Alta', 'Media', 'Baja'];
  const counts = orden.map(p => stats.porPrioridad[p] || stats.porPrioridad[p?.toLowerCase()] || 0);

  if (priorityChart) priorityChart.destroy();

  priorityChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: orden,
      datasets: [{
        data: counts,
        backgroundColor: [
          '#ef4444', // Crítica - Rojo
          '#f97316', // Urgente - Naranja oscuro
          '#f59e0b', // Alta - Naranja
          '#3b82f6', // Media - Azul
          '#10b981'  // Baja - Verde
        ],
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: [
          '#dc2626',
          '#ea580c',
          '#d97706',
          '#2563eb',
          '#059669'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1500,
        easing: 'easeInOutQuart'
      },
      plugins: { 
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 12,
          cornerRadius: 8,
          titleFont: { size: 14, weight: '600' },
          bodyFont: { size: 13 },
          callbacks: {
            title: function(context) {
              return `Prioridad ${context[0].label}`;
            },
            label: function(context) {
              return `Casos: ${context.parsed.y}`;
            }
          }
        }
      },
      scales: {
        x: { 
          ticks: { color: palette.muted, font: { size: 12, weight: '600' } },
          grid: { display: false },
          border: { display: false }
        },
        y: { 
          ticks: { color: palette.muted, font: { size: 12 } }, 
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
          border: { display: false }
        }
      }
    }
  });
}

function renderHourChart(casos) {
  const ctx = document.getElementById('hourChart');
  if (!ctx) return;

  const counts = Array.from({ length: 24 }, () => 0);
  casos.forEach(caso => {
    const fecha = new Date(caso.fecha_creacion);
    if (Number.isNaN(fecha.getTime())) return;
    const h = fecha.getHours();
    counts[h] += 1;
  });

  const horasLaborales = [8, 10, 12, 14, 16, 18];
  const labels = horasLaborales.map(h => `${h}:00`);
  const valoresLaborales = horasLaborales.map(h => counts[h]);

  if (hourChart) hourChart.destroy();

  // Colores más vibrantes para horas pico
  const maxValue = Math.max(...valoresLaborales);
  const backgroundColors = valoresLaborales.map(val => {
    const intensity = val / maxValue;
    if (intensity > 0.7) return '#1d4ed8'; // Azul oscuro para pico
    if (intensity > 0.4) return '#3b82f6'; // Azul medio
    return '#93c5fd'; // Azul claro para bajo volumen
  });

  hourChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: valoresLaborales,
        backgroundColor: backgroundColors,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: '#2563eb'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1500,
        easing: 'easeInOutQuart'
      },
      plugins: { 
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 12,
          cornerRadius: 8,
          titleFont: { size: 14, weight: '600' },
          bodyFont: { size: 13 },
          callbacks: {
            title: function(context) {
              return `Hora: ${context[0].label}`;
            },
            label: function(context) {
              return `Casos creados: ${context.parsed.y}`;
            }
          }
        }
      },
      scales: {
        x: { 
          ticks: { color: palette.muted, font: { size: 12, weight: '600' } },
          grid: { display: false },
          border: { display: false }
        },
        y: { 
          ticks: { color: palette.muted, font: { size: 12 } }, 
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
          border: { display: false }
        }
      }
    }
  });
}

function renderTechTable(casos) {
  const tbody = document.getElementById('techTable');
  if (!tbody) return;

  const techData = buildTechData(casos);
  tbody.innerHTML = '';

  const gradients = [
    'linear-gradient(135deg,#6366f1,#60a5fa)',
    'linear-gradient(135deg,#7c3aed,#a78bfa)',
    'linear-gradient(135deg,#06b6d4,#60a5fa)',
    'linear-gradient(135deg,#f97316,#fb923c)',
    'linear-gradient(135deg,#ef4444,#f97316)'
  ];

  techData.forEach((t, idx) => {
    const tr = document.createElement('tr');
    const color = gradients[idx % gradients.length];
    const initials = (t.nombre || 'SA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const trendClass = t.trend >= 0 ? 'trend-up' : 'trend-down';
    const trendSymbol = t.trend >= 0 ? '▴' : '▾';

    tr.innerHTML = `
      <td class="tech-cell">
        <div class="tech-left">
          <div class="avatar-circle" style="background:${color}">${initials}</div>
          <div class="tech-name">${t.nombre}</div>
        </div>
      </td>
      <td class="solved"><strong>${t.resueltos}</strong></td>
      <td class="avg">${t.tiempo_promedio}h</td>
      <td class="sat">
        <div class="sat-row">
          <div class="sat-bar"><div class="sat-fill" style="width:${t.satisfaccion}%"></div></div>
          <span class="sat-percent">${t.satisfaccion}%</span>
        </div>
      </td>
      <td class="trend"><span class="${trendClass}">${trendSymbol} <small>${Math.abs(t.trend)}%</small></span></td>
    `;
    tbody.appendChild(tr);
  });
}

function buildTechData(casos) {
  const map = new Map();

  casos.forEach(caso => {
    const tecnico = caso.asignado_a || 'Sin asignar';
    if (!map.has(tecnico)) {
      map.set(tecnico, {
        nombre: tecnico,
        resueltos: 0,
        total: 0,
        horas: [],
        satisfaccion: 90
      });
    }
    const item = map.get(tecnico);
    item.total += 1;
    if (resolvedStatuses.includes(caso.estado)) {
      item.resueltos += 1;
      const inicio = new Date(caso.fecha_creacion).getTime();
      const fin = new Date(caso.fecha_actualizacion || caso.fecha_creacion).getTime();
      const horas = Math.max(0, (fin - inicio) / 3600000);
      if (!Number.isNaN(horas)) item.horas.push(horas);
    }
  });

  const data = Array.from(map.values()).map(item => {
    const avgHoras = item.horas.length ? Math.round(item.horas.reduce((a, b) => a + b, 0) / item.horas.length) : 0;
    const trend = item.total > 0 ? Math.round((item.resueltos / item.total) * 100) - 50 : 0;
    const sat = Math.max(75, Math.min(100, Math.round(item.resueltos && item.total ? (item.resueltos / item.total) * 100 : 80)));

    return {
      nombre: item.nombre,
      resueltos: item.resueltos,
      tiempo_promedio: avgHoras,
      satisfaccion: sat,
      trend
    };
  }).sort((a, b) => b.resueltos - a.resueltos);

  return data;
}

function setupExportButton() {
  const exportBtn = document.getElementById('exportBtn');
  if (!exportBtn) return;

  exportBtn.addEventListener('click', () => {
    const rows = Array.from(document.querySelectorAll('#techTable tr')).map(tr =>
      Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim())
    );

    const headers = ['Técnico', 'Casos Resueltos', 'Tiempo Promedio (hrs)', 'Satisfacción', 'Tendencia'];
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte_tecnicos.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}


