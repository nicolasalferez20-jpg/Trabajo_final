let evidencias = [];
let todasLasEvidencias = [];
const API_BASE = 'http://localhost:3001/api?action=get_casos_simple';

const grid = document.getElementById('gridView');
const table = document.querySelector('#listView tbody');
const tableWrapper = document.getElementById('tableWrapper');
const gridWrapper = document.getElementById('gridWrapper');
const search = document.getElementById('searchEvidence');
const typeFilter = document.getElementById('typeFilter');
const noResults = document.getElementById('noResults');
const gridBtn = document.getElementById('gridBtn');
const listBtn = document.getElementById('listBtn');
const btnRefresh = document.getElementById('btnRefresh');
const btnUpload = document.getElementById('btnUpload');

const statTotal = document.getElementById('statTotal');
const statAprobadas = document.getElementById('statAprobadas');
const statPendientes = document.getElementById('statPendientes');
const statTipos = document.getElementById('statTipos');
const statTotalNote = document.getElementById('statTotalNote');
const statAprobadasNote = document.getElementById('statAprobadasNote');
const statPendientesNote = document.getElementById('statPendientesNote');
const statTiposNote = document.getElementById('statTiposNote');

let currentView = 'grid';
let currentData = [];

// Load data from API and generate evidence
async function loadDataFromAPI() {
	try {
		const response = await fetch(API_BASE);
		const casos = await response.json();
		
		if (Array.isArray(casos)) {
			todasLasEvidencias = [];
			
			// Generate evidence entries from cases
			casos.forEach((caso, index) => {
				const numEvidencias = Math.floor(Math.random() * 4) + 1;
				const tiposEvidencia = ['Diagnóstico', 'Logs', 'Fotografía', 'Reporte'];
				const estados = ['Aprobado', 'Pendiente'];
				
				for (let i = 0; i < numEvidencias; i++) {
					const tipo = Math.random() > 0.6 ? 'imagen' : 'documento';
					const formato = tipo === 'imagen' ? 'JPG' : 'PDF';
					const tamano = tipo === 'imagen' 
						? `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 9)} MB`
						: `${Math.floor(Math.random() * 50) + 10} KB`;
					
					todasLasEvidencias.push({
						id: `EV-${1000 + todasLasEvidencias.length}`,
						nombre: `${tiposEvidencia[Math.floor(Math.random() * 4)]}_${caso.id}_${i + 1}.${formato.toLowerCase()}`,
						tipo: tipo,
						formato: formato,
						tamano: tamano,
						caso: caso.id || `C-${1000 + index}`,
						tecnico: caso.asignado_a || 'Sin asignar',
						fecha: new Date(new Date(caso.fecha_creacion).getTime() + Math.random() * 24 * 60 * 60 * 1000).toLocaleString('es-ES'),
						categoria: tiposEvidencia[Math.floor(Math.random() * 4)],
						estado: estados[Math.floor(Math.random() * 2)]
					});
				}
			});
			
			evidencias = [...todasLasEvidencias];
			applyFilters();
		}
	} catch (error) {
		console.error('Error loading data from API:', error);
		showNotification('Error cargando datos', 'error');
	}
}

function renderGrid(data) {
	if (!grid) return;
	grid.innerHTML = '';

	data.forEach((ev, index) => {
		const card = document.createElement('div');
		card.className = 'file-card';
		card.style.animation = `slideInUp ${0.3 + index * 0.05}s ease-out`;
		
		const iconType = ev.tipo === 'imagen' ? '🖼️' : '📄';
		
		card.innerHTML = `
			<div class="file-top">
				<div style="display: flex; gap: 10px; align-items: center;">
					<span style="font-size: 24px;">${iconType}</span>
					<div>
						<div class="file-name">${ev.nombre}</div>
						<div class="file-meta">${ev.formato} • ${ev.tamano} • ${ev.fecha}</div>
					</div>
				</div>
				<span class="badge estado-${ev.estado.toLowerCase()}">${ev.estado}</span>
			</div>
			<div class="file-meta">Caso: ${ev.caso} • Técnico: ${ev.tecnico} • ${ev.categoria}</div>
			<div class="file-actions">
				<a class="link" href="#" onclick="viewEvidence('${ev.id}'); return false;">Ver</a>
				<a class="link" href="#" onclick="downloadEvidence('${ev.id}'); return false;">Descargar</a>
			</div>
		`;
		grid.appendChild(card);
	});
}

function renderTable(data) {
	if (!table) return;
	table.innerHTML = '';

	data.forEach((ev, index) => {
		const row = document.createElement('tr');
		row.style.animation = `slideInLeft ${0.3 + index * 0.05}s ease-out`;
		
		const iconType = ev.tipo === 'imagen' ? '🖼️' : '📄';
		
		row.innerHTML = `
			<td>${iconType} ${ev.nombre}</td>
			<td>${ev.tipo}</td>
			<td>${ev.caso}</td>
			<td>${ev.tecnico}</td>
			<td>${ev.categoria}</td>
			<td>${ev.fecha}</td>
			<td>${ev.tamano}</td>
			<td><span class="badge estado-${ev.estado.toLowerCase()}">${ev.estado}</span></td>
			<td><a class="link" href="#" onclick="viewEvidence('${ev.id}'); return false;">Ver</a> | <a class="link" href="#" onclick="downloadEvidence('${ev.id}'); return false;">Descargar</a></td>
		`;
		table.appendChild(row);
	});
}

function renderStats(data) {
	const total = data.length;
	const aprobadas = data.filter(e => e.estado === 'Aprobado').length;
	const pendientes = data.filter(e => e.estado === 'Pendiente').length;
	const imagenes = data.filter(e => e.tipo === 'imagen').length;
	const docs = data.filter(e => e.tipo === 'documento').length;

	animateCounter(statTotal, parseInt(statTotal?.textContent) || 0, total);
	animateCounter(statAprobadas, parseInt(statAprobadas?.textContent) || 0, aprobadas);
	animateCounter(statPendientes, parseInt(statPendientes?.textContent) || 0, pendientes);

	if (statTipos) statTipos.textContent = `${imagenes} / ${docs}`;

	if (statTotalNote) statTotalNote.textContent = total ? 'Registros visibles' : 'Sin datos';
	if (statAprobadasNote) statAprobadasNote.textContent = aprobadas ? 'Listas para uso' : 'Ninguna aprobada';
	if (statPendientesNote) statPendientesNote.textContent = pendientes ? 'En revisión' : 'Sin pendientes';
	if (statTiposNote) statTiposNote.textContent = 'Imágenes / Documentos';
}

function animateCounter(element, start, end) {
	if (!element) return;
	const duration = 500;
	const steps = 30;
	const stepValue = (end - start) / steps;
	let current = start;
	let step = 0;

	const interval = setInterval(() => {
		step++;
		current += stepValue;
		element.textContent = Math.round(current);

		if (step >= steps) {
			element.textContent = end;
			clearInterval(interval);
		}
	}, duration / steps);
}

function render(data) {
	const isEmpty = data.length === 0;
	if (noResults) noResults.classList.toggle('hidden', !isEmpty);

	if (gridWrapper) gridWrapper.classList.toggle('hidden', currentView !== 'grid');
	if (tableWrapper) tableWrapper.classList.toggle('hidden', currentView !== 'list');

	if (currentView === 'grid') {
		renderGrid(isEmpty ? [] : data);
	} else {
		renderTable(isEmpty ? [] : data);
	}
}

function applyFilters() {
	const term = search ? search.value.toLowerCase() : '';
	const type = typeFilter ? typeFilter.value : 'todos';

	currentData = todasLasEvidencias.filter(e => {
		const matchSearch = e.nombre.toLowerCase().includes(term) || e.caso.toLowerCase().includes(term) || e.tecnico.toLowerCase().includes(term);
		const matchType = type === 'todos' || e.tipo === type;
		return matchSearch && matchType;
	});

	renderStats(currentData);
	render(currentData);
}

function switchView(view) {
	currentView = view;
	const isGrid = view === 'grid';
	if (gridBtn) {
		gridBtn.classList.toggle('active', isGrid);
		gridBtn.setAttribute('aria-pressed', isGrid);
	}
	if (listBtn) {
		listBtn.classList.toggle('active', !isGrid);
		listBtn.setAttribute('aria-pressed', !isGrid);
	}
	if (gridWrapper) gridWrapper.classList.toggle('hidden', !isGrid);
	if (tableWrapper) tableWrapper.classList.toggle('hidden', isGrid);
	render(currentData);
}

function resetFilters() {
	if (search) search.value = '';
	if (typeFilter) typeFilter.value = 'todos';
	loadDataFromAPI();
	switchView('grid');
}

function viewEvidence(id) {
	showNotification(`Abriendo evidencia ${id}...`, 'info');
}

function downloadEvidence(id) {
	showNotification(`Descargando evidencia ${id}...`, 'info');
}

function showNotification(message, type = 'info') {
	const notification = document.createElement('div');
	notification.className = `notification ${type}`;
	notification.textContent = message;
	notification.style.animation = 'slideIn 0.3s ease-out';
	
	const container = document.querySelector('.main-content') || document.body;
	container.appendChild(notification);

	setTimeout(() => {
		notification.style.animation = 'slideOut 0.3s ease-out';
		setTimeout(() => notification.remove(), 300);
	}, 3000);
}

// Event listeners
if (search) search.addEventListener('input', applyFilters);
if (typeFilter) typeFilter.addEventListener('change', applyFilters);
if (gridBtn) gridBtn.addEventListener('click', () => switchView('grid'));
if (listBtn) listBtn.addEventListener('click', () => switchView('list'));
if (btnRefresh) btnRefresh.addEventListener('click', () => {
	btnRefresh.style.animation = 'spin 1s linear';
	setTimeout(() => btnRefresh.style.animation = '', 1000);
	resetFilters();
});
if (btnUpload) btnUpload.addEventListener('click', () => {
	showNotification('Función de carga disponible próximamente', 'info');
});

// Auto-refresh every 30 seconds
setInterval(() => {
	loadDataFromAPI();
}, 30000);

// Initial load
document.addEventListener('DOMContentLoaded', function() {
	loadDataFromAPI();
	switchView('grid');
});