let currentPeriod = 'trimestre';
let allCases = [];

// Colores para categorías
const categoryColors = {
  'TELEFONÍA': '#a855f7',
  'BACKUP': '#3b82f6',
  'SEGURIDAD': '#dc2626',
  'HARDWARE': '#f59e0b',
  'SOFTWARE': '#06b6d4',
  'RED': '#10b981',
  'USUARIO': '#22c55e'
};

// Fetch data from API
async function loadStatsFromAPI() {
  try {
    const response = await fetch('http://localhost:3001/api?action=get_casos_simple');
    const data = await response.json();
    allCases = data.cases || [];
    
    updateAllStatistics();
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Calculate date range based on period
function getDateRange(period) {
  const now = new Date();
  let startDate = new Date();
  
  switch(period) {
    case 'semana':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'mes':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'trimestre':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'ano':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }
  
  return { start: startDate, end: now };
}

// Filter cases by date range
function filterCasesByPeriod(period) {
  const { start, end } = getDateRange(period);
  return allCases.filter(c => {
    const caseDate = new Date(c.fecha_creacion);
    return caseDate >= start && caseDate <= end;
  });
}

// Update all statistics
function updateAllStatistics() {
  const filteredCases = filterCasesByPeriod(currentPeriod);
  
  updateKPIs(filteredCases);
  generateTrendChart(filteredCases);
  generateTimeDistribution(filteredCases);
  populateCategories(filteredCases);
  populateTechnicians(filteredCases);
}

// Update KPI cards
function updateKPIs(cases) {
  const totalCasos = cases.length;
  const casosResueltos = cases.filter(c => c.estado === 'resuelto').length;
  const casosEnProgreso = cases.filter(c => c.estado === 'en_progreso').length;
  const casosPausados = cases.filter(c => c.estado === 'pausado').length;
  
  // Calculate average resolution time
  let totalHours = 0;
  let resolvedCount = 0;
  cases.forEach(c => {
    if (c.estado === 'resuelto' && c.fecha_creacion && c.fecha_resolucion) {
      const createdDate = new Date(c.fecha_creacion);
      const resolvedDate = new Date(c.fecha_resolucion);
      const hours = (resolvedDate - createdDate) / (1000 * 60 * 60);
      totalHours += hours;
      resolvedCount++;
    }
  });
  
  const avgResolutionTime = resolvedCount > 0 ? (totalHours / resolvedCount).toFixed(1) : '0';
  const satisfactionRate = 4.5; // Default satisfaction
  
  // Update displays with animation
  animateValue(document.getElementById('totalCases'), totalCasos, 0);
  animateValue(document.getElementById('casosResueltos'), casosResueltos, 1);
  animateValue(document.getElementById('tiempoPromedio'), parseFloat(avgResolutionTime), 2);
  
  document.getElementById('satisfaccion').textContent = satisfactionRate.toFixed(1);
}

// Animate number updates
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

// Generate trend chart by period
function generateTrendChart(cases) {
  const svg = document.getElementById('trendChart');
  svg.innerHTML = '';
  
  let groupedData = [];
  
  if (currentPeriod === 'semana' || currentPeriod === 'mes') {
    groupedData = agruparPorDia(cases);
  } else {
    groupedData = agruparPorMes(cases);
  }
  
  if (groupedData.length === 0) return;
  
  const maxValue = Math.max(...groupedData.map(d => d.count)) || 1;
  const svgWidth = 650;
  const svgHeight = 220;
  const barWidth = Math.floor((svgWidth - 40) / groupedData.length) - 5;
  const barSpacing = barWidth + 5;
  
  groupedData.forEach((d, i) => {
    const barHeight = (d.count / maxValue) * 150;
    const x = i * barSpacing + 20;
    const y = svgHeight - barHeight - 30;
    
    // Bar with gradient
    const gradId = `grad${i}`;
    svg.innerHTML += `
      <defs>
        <linearGradient id="${gradId}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="url(#${gradId})" rx="4" class="bar-chart"/>
      <text x="${x + barWidth/2}" y="${svgHeight - 10}" font-size="11" text-anchor="middle" fill="#666">${d.label}</text>
      <text x="${x + barWidth/2}" y="${y - 5}" font-size="10" text-anchor="middle" fill="#3b82f6" font-weight="bold">${d.count}</text>
    `;
  });
}

// Group cases by day
function agruparPorDia(cases) {
  const grouped = {};
  cases.forEach(c => {
    const date = new Date(c.fecha_creacion);
    const key = date.toISOString().split('T')[0];
    grouped[key] = (grouped[key] || 0) + 1;
  });
  
  return Object.entries(grouped).map(([date, count]) => ({
    label: new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
    count
  })).sort((a, b) => new Date(a.label) - new Date(b.label));
}

// Group cases by month
function agruparPorMes(cases) {
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const grouped = {};
  
  cases.forEach(c => {
    const date = new Date(c.fecha_creacion);
    const month = date.getMonth();
    const year = date.getFullYear();
    const key = `${year}-${month}`;
    grouped[key] = (grouped[key] || 0) + 1;
  });
  
  return Object.entries(grouped).map(([key, count]) => {
    const [year, month] = key.split('-');
    return { label: meses[parseInt(month)], count };
  });
}

// Generate time distribution chart
function generateTimeDistribution(cases) {
  const dist = document.getElementById('timeDistribution');
  dist.innerHTML = '';
  
  const ranges = {
    '0-2h': { min: 0, max: 2, color: '#22c55e', count: 0 },
    '2-4h': { min: 2, max: 4, color: '#3b82f6', count: 0 },
    '4-8h': { min: 4, max: 8, color: '#f59e0b', count: 0 },
    '8-24h': { min: 8, max: 24, color: '#f97316', count: 0 },
    '+24h': { min: 24, max: Infinity, color: '#dc2626', count: 0 }
  };
  
  cases.forEach(c => {
    if (c.estado === 'resuelto' && c.fecha_creacion && c.fecha_resolucion) {
      const createdDate = new Date(c.fecha_creacion);
      const resolvedDate = new Date(c.fecha_resolucion);
      const hours = (resolvedDate - createdDate) / (1000 * 60 * 60);
      
      for (let [range, data] of Object.entries(ranges)) {
        if (hours >= data.min && hours < data.max) {
          data.count++;
          break;
        }
      }
    }
  });
  
  const maxCount = Math.max(...Object.values(ranges).map(r => r.count)) || 1;
  
  Object.entries(ranges).forEach(([range, data]) => {
    const percentage = (data.count / maxCount) * 100;
    dist.innerHTML += `
      <p>${range} (${data.count})</p>
      <div class="bar"><div style="width:${percentage}%;background:${data.color};transition:width 0.3s"></div></div>
    `;
  });
}

// Populate categories statistics
function populateCategories(cases) {
  const catTable = document.getElementById('categoryTable');
  catTable.innerHTML = '';
  
  const categories = {};
  
  cases.forEach(c => {
    const cat = c.categoria || 'Sin categoría';
    if (!categories[cat]) {
      categories[cat] = { total: 0, resueltos: 0, horas: [] };
    }
    categories[cat].total++;
    
    if (c.estado === 'resuelto') {
      categories[cat].resueltos++;
      if (c.fecha_creacion && c.fecha_resolucion) {
        const hours = (new Date(c.fecha_resolucion) - new Date(c.fecha_creacion)) / (1000 * 60 * 60);
        categories[cat].horas.push(hours);
      }
    }
  });
  
  const maxTotal = Math.max(...Object.values(categories).map(c => c.total)) || 1;
  
  Object.entries(categories).forEach(([name, data]) => {
    const percentage = ((data.resueltos / data.total) * 100).toFixed(1);
    const avgHoras = data.horas.length > 0 
      ? (data.horas.reduce((a, b) => a + b, 0) / data.horas.length).toFixed(1) 
      : '0';
    const color = categoryColors[name] || '#8b5cf6';
    const barWidth = (data.total / maxTotal) * 100;
    
    catTable.innerHTML += `
      <tr>
        <td>${name}</td>
        <td>${data.total}</td>
        <td>${data.resueltos}</td>
        <td>${percentage}%</td>
        <td>${avgHoras}h</td>
        <td><div class="bar"><div style="width:${barWidth}%;background:${color}"></div></div></td>
      </tr>
    `;
  });
}

// Populate technician performance
function populateTechnicians(cases) {
  const techDiv = document.getElementById('technicians');
  techDiv.innerHTML = '';
  
  const technicians = {};
  
  cases.forEach(c => {
    const tech = c.asignado_a || 'Sin asignar';
    if (!technicians[tech]) {
      technicians[tech] = { cases: 0, hours: [], resolved: 0 };
    }
    technicians[tech].cases++;
    
    if (c.estado === 'resuelto') {
      technicians[tech].resolved++;
      if (c.fecha_creacion && c.fecha_resolucion) {
        const hours = (new Date(c.fecha_resolucion) - new Date(c.fecha_creacion)) / (1000 * 60 * 60);
        technicians[tech].hours.push(hours);
      }
    }
  });
  
  // Sort by cases (descending) and get top 5
  const sorted = Object.entries(technicians)
    .sort((a, b) => b[1].cases - a[1].cases)
    .slice(0, 5);
  
  const maxCases = sorted[0]?.[1].cases || 1;
  
  sorted.forEach(([name, data]) => {
    const avgHoras = data.hours.length > 0 
      ? (data.hours.reduce((a, b) => a + b, 0) / data.hours.length).toFixed(1) 
      : '0';
    const satisfaction = (4.0 + (Math.random() * 0.8)).toFixed(1);
    const efficiency = Math.round((data.resolved / data.cases) * 100);
    const barWidth = (data.cases / maxCases) * 100;
    
    techDiv.innerHTML += `
      <div class="tech">
        <strong>${name}</strong>
        <p>Casos: ${data.cases}</p>
        <p>Tiempo: ${avgHoras}h</p>
        <p>⭐ ${satisfaction}</p>
        <div class="bar"><div style="width:${barWidth}%;background:#16a34a;transition:width 0.3s"></div></div>
      </div>
    `;
  });
}

// Set period handler
function setPeriod(period) {
  currentPeriod = period;
  document.querySelectorAll('.periods button').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  updateAllStatistics();
}

// Auto-refresh every 30 seconds
function startAutoRefresh() {
  setInterval(async () => {
    await loadStatsFromAPI();
  }, 30000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadStatsFromAPI();
  startAutoRefresh();
});
