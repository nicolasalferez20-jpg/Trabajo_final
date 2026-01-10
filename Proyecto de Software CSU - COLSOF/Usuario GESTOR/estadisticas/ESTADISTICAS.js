// Paleta y opciones coherentes con el diseño global
const palette = {
  primary: '#15467b',
  accent: '#0b3a66',
  success: '#16a34a',
  muted: '#97a0aa'
};

// Datos
const monthlyData = {
  labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
  datasets: [
    { label: 'Creados', data: [245, 280, 310, 265, 290, 320], borderWidth: 2, borderColor: '#1d4ed8', backgroundColor: 'rgba(29,78,216,0.08)', tension: 0.3, pointRadius: 3 },
    { label: 'Resueltos', data: [230, 265, 295, 250, 280, 305], borderWidth: 2, borderColor: '#0b3a66', backgroundColor: 'rgba(11,58,102,0.06)', tension: 0.3, pointRadius: 3 },
    { label: 'Pendientes', data: [15, 15, 15, 15, 10, 15], borderWidth: 2, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.06)', tension: 0.3, pointRadius: 3 }
  ]
};

new Chart(document.getElementById('monthlyChart'), {
  type: 'line',
  data: monthlyData,
  options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { x: { ticks: { color: palette.muted }, grid: { display: false } }, y: { ticks: { color: palette.muted }, grid: { color: '#f1f5f9' } } }
});

new Chart(document.getElementById('categoryChart'), {
  type: 'pie',
  data: {
    labels: ['Hardware', 'Software', 'Impresión', 'Mantenimiento', 'Office'],
    datasets: [{
      data: [450, 380, 280, 220, 180],
      backgroundColor: ['#1d4ed8', '#0b3a66', '#60a5fa', '#f59e0b', '#c7d2fe']
    }]
  },
  options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
});

new Chart(document.getElementById('priorityChart'), {
  type: 'bar',
  data: {
    labels: ['Urgente', 'Alta', 'Media', 'Baja'],
    datasets: [{
      data: [150, 520, 480, 360],
      backgroundColor: ['#ef4444', '#f97316', '#fbbf24', '#60a5fa']
    }]
  },
  options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: palette.muted } }, y: { ticks: { color: palette.muted }, beginAtZero: true } } }
});

new Chart(document.getElementById('hourChart'), {
  type: 'bar',
  data: {
    labels: ['8am', '10am', '12pm', '2pm', '4pm', '6pm'],
    datasets: [{
      data: [12, 25, 35, 28, 22, 8],
      backgroundColor: '#60a5fa'
    }]
  },
  options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: palette.muted } }, y: { ticks: { color: palette.muted }, beginAtZero: true } } }
});

// Tabla técnicos (colores por técnico y tendencia dinámica)
const technicians = [
  { name: 'Juan Pérez', solved: 145, avg: 2.3, sat: 98, trend: 5.2, color: 'linear-gradient(135deg,#6366f1,#60a5fa)' },
  { name: 'Dianne Russell', solved: 132, avg: 2.5, sat: 96, trend: 8.2, color: 'linear-gradient(135deg,#7c3aed,#a78bfa)' },
  { name: 'Jane Cooper', solved: 128, avg: 2.8, sat: 94, trend: 2.9, color: 'linear-gradient(135deg,#06b6d4,#60a5fa)' },
  { name: 'Robert Fox', solved: 115, avg: 3.1, sat: 92, trend: 7.0, color: 'linear-gradient(135deg,#f97316,#fb923c)' },
  { name: 'Cody Fisher', solved: 98, avg: 3.5, sat: 90, trend: 8.2, color: 'linear-gradient(135deg,#ef4444,#f97316)' }
];

const tbody = document.getElementById('techTable');
function initials(name) {
  return name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
}

technicians.forEach(t => {
  const tr = document.createElement('tr');
  const isPositive = t.trend >= 0;
  const trendClass = isPositive ? 'trend-up' : 'trend-down';
  const trendSymbol = isPositive ? '▴' : '▾';

  tr.innerHTML = `
    <td class="tech-cell">
      <div class="tech-left">
        <div class="avatar-circle" style="background:${t.color}">${initials(t.name)}</div>
        <div class="tech-name">${t.name}</div>
      </div>
    </td>
    <td class="solved"><strong>${t.solved}</strong></td>
    <td class="avg">${t.avg}</td>
    <td class="sat">
      <div class="sat-row">
        <div class="sat-bar"><div class="sat-fill" style="width:${t.sat}%"></div></div>
        <span class="sat-percent">${t.sat}%</span>
      </div>
    </td>
    <td class="trend"><span class="${trendClass}">${trendSymbol} <small>${Math.abs(t.trend)}%</small></span></td>
  `;
  tbody.appendChild(tr);
});

// Export CSV desde el botón Exportar Reporte (incluye Tendencia)
const exportBtn = document.getElementById('exportBtn');
if (exportBtn) {
  exportBtn.addEventListener('click', function () {
    const headers = ['Técnico', 'Casos Resueltos', 'Tiempo Promedio (hrs)', 'Satisfacción', 'Tendencia'];
    const rows = technicians.map(t => [t.name, t.solved, t.avg, t.sat + '%', (t.trend >= 0 ? '+' : '-') + Math.abs(t.trend) + '%']);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
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


