const recentReports = [
  { name: 'Reporte_Mensual_Diciembre_2024.pdf', date: '05 Ene 2025', size: '2.4 MB', downloads: 24 },
  { name: 'Casos_Por_Cliente_Q4_2024.xlsx', date: '03 Ene 2025', size: '856 KB', downloads: 15 },
  { name: 'Desempeño_Técnicos_Dic_2024.pdf', date: '02 Ene 2025', size: '1.8 MB', downloads: 32 },
  { name: 'Centro_Costos_2024.csv', date: '28 Dic 2024', size: '1.2 MB', downloads: 8 },
  { name: 'Satisfacción_Cliente_Q4.pdf', date: '20 Dic 2024', size: '2.1 MB', downloads: 45 }
];

const list = document.getElementById('recentReports');

recentReports.forEach(r => {
  const li = document.createElement('li');
  li.className = 'report-item';
  li.innerHTML = `
    <div class="left">
      <div class="r-icon">${chooseIcon(r.name)}</div>
      <div class="r-info">
        <div class="r-title">${r.name}</div>
        <div class="r-meta">${r.date} • ${r.size} • ${r.downloads} descargas</div>
      </div>
    </div>
    <div class="r-actions">
      <button class="r-btn r-download" title="Descargar">🔽</button>
      <button class="r-btn r-print" title="Imprimir">🖨️</button>
    </div>
  `;
  list.appendChild(li);
});

function chooseIcon(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return '📄';
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return '📊';
  if (lower.endsWith('.csv')) return '📦';
  return '📁';
}

// Evento de selección de reporte
document.querySelectorAll('.card').forEach(card => {
  card.onclick = () => {
    alert(`Reporte seleccionado: ${card.textContent.trim()}`);
  };
});

// Delegación de eventos para acciones de reportes
list.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const li = btn.closest('.report-item');
  const title = li && li.querySelector('.r-title')?.textContent;
  if (btn.classList.contains('r-download')) {
    alert(`Iniciando descarga: ${title}`);
  } else if (btn.classList.contains('r-print')) {
    alert(`Imprimiendo: ${title}`);
  }
});
