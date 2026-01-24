const API_URL = 'http://localhost:3001/api';

let cases = [];
let technicians = [];
let selectedTechnician = 'all';
let selectedCase = null;
let autoRefreshTimer = null;

const qs = (sel, ctx = document) => ctx.querySelector(sel);
const normalize = (val = '') => String(val || '').toLowerCase();

const formatCaseId = (id) => `#${String(id ?? '').padStart(8, '0')}`;

const isAssigned = (item) => {
  const estado = normalize(item.estado);
  const tecnico = normalize(item.tecnico_asignado || item.asignado_a || item.tecnico);
  return tecnico && tecnico !== '' && !estado.includes('sin asignar') && !estado.includes('no asignado');
};

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const showToast = (msg, isError = false) => {
  let box = document.getElementById('assigned-toast');
  if (!box) {
    box = document.createElement('div');
    box.id = 'assigned-toast';
    box.style.position = 'fixed';
    box.style.right = '20px';
    box.style.bottom = '20px';
    box.style.padding = '12px 16px';
    box.style.borderRadius = '8px';
    box.style.boxShadow = '0 10px 30px rgba(0,0,0,0.12)';
    box.style.zIndex = '9999';
    box.style.fontWeight = '600';
    document.body.appendChild(box);
  }
  box.textContent = msg;
  box.style.background = isError ? '#fee2e2' : '#d1fae5';
  box.style.color = isError ? '#991b1b' : '#065f46';
  clearTimeout(box._timer);
  box._timer = setTimeout(() => box.remove(), 2400);
};

const mapCase = (item, idx) => {
  const priority = item.prioridad || 'Media';
  const status = item.estado || 'Pendiente';
  return {
    id: formatCaseId(item.id || idx + 1),
    rawId: item.id || idx + 1,
    title: item.titulo || item.asunto || 'Caso sin titulo',
    technician: item.tecnico_asignado || item.asignado_a || item.tecnico || 'Sin asignar',
    technicianId: item.tecnico_id || idx + 1,
    client: item.cliente || item.empresa || 'Sin cliente',
    category: item.categoria || 'Sin categoria',
    priority,
    status,
    deadline: formatDate(item.fecha_limite || item.deadline || item.fecha_cierre),
    description: item.descripcion || 'Sin descripcion'
  };
};

const buildTechnicians = () => {
  const techMap = new Map();
  
  cases.forEach(c => {
    const key = c.technician;
    if (!techMap.has(key)) {
      const initials = key.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2);
      techMap.set(key, { name: key, avatar: initials, activeCount: 0 });
    }
    techMap.get(key).activeCount++;
  });

  const totalCount = cases.length;
  technicians = [
    { id: 'all', name: 'Todos', avatar: 'ALL', activeCount: totalCount }
  ];

  const sorted = Array.from(techMap.entries())
    .sort((a, b) => b[1].activeCount - a[1].activeCount)
    .map(([name, data], idx) => ({
      id: idx + 1,
      name,
      avatar: data.avatar,
      activeCount: data.activeCount
    }));

  technicians.push(...sorted);
};

const updateMetrics = (filtered) => {
  const progress = filtered.filter(c => normalize(c.status).includes('progreso') || normalize(c.status).includes('proceso')).length;
  const pending = filtered.filter(c => normalize(c.status).includes('pendiente') || normalize(c.status).includes('espera')).length;
  const urgent = filtered.filter(c => normalize(c.priority) === 'urgente' || normalize(c.priority) === 'critica').length;
  const scheduled = filtered.filter(c => normalize(c.status).includes('programado') || normalize(c.status).includes('planificado')).length;

  qs('#kpiProgress').textContent = progress;
  qs('#kpiPending').textContent = pending;
  qs('#kpiUrgent').textContent = urgent;
  qs('#kpiScheduled').textContent = scheduled;
};

const renderTechnicians = () => {
  const techDiv = qs('#technicians');
  techDiv.innerHTML = '';

  technicians.forEach(t => {
    const div = document.createElement('div');
    div.className = `tech ${selectedTechnician === t.id ? 'active' : ''}`;
    div.onclick = () => {
      selectedTechnician = t.id;
      render();
    };
    div.innerHTML = `
      <strong>${t.avatar}</strong>
      <p>${t.name}</p>
      <p>${t.activeCount} casos</p>
    `;
    techDiv.appendChild(div);
  });
};

const renderTable = (filtered) => {
  const tbody = qs('#casesTable');
  tbody.innerHTML = '';

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Sin casos asignados</td></tr>';
    return;
  }

  filtered.forEach(c => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${c.id}</strong><br>${c.title}</td>
      <td>${c.technician}</td>
      <td>${c.client}</td>
      <td>${c.category}</td>
      <td><span class="badge priority-${c.priority}">${c.priority}</span></td>
      <td><span class="badge status-${c.status.replace(/ /g, '')}">${c.status}</span></td>
      <td>${c.deadline}</td>
      <td class="actions">
        <button onclick="window.openModal('${c.id}')">Ver</button>
      </td>
    `;
    tbody.appendChild(row);
  });
};

const render = () => {
  qs('#totalCases').textContent = cases.length;

  renderTechnicians();

  const filtered = selectedTechnician === 'all'
    ? cases
    : cases.filter(c => {
        const tech = technicians.find(t => t.id === selectedTechnician);
        return tech && c.technician === tech.name;
      });

  updateMetrics(filtered);
  renderTable(filtered);
};

const openModal = (id) => {
  selectedCase = cases.find(c => c.id === id);
  if (!selectedCase) return;
  qs('#modalId').textContent = selectedCase.id;
  qs('#modalBody').innerHTML = `
    <div style="padding:15px;">
      <p><strong>${selectedCase.title}</strong></p>
      <p><strong>Descripcion:</strong> ${selectedCase.description}</p>
      <p><strong>Cliente:</strong> ${selectedCase.client}</p>
      <p><strong>Categoria:</strong> ${selectedCase.category}</p>
      <p><strong>Tecnico:</strong> ${selectedCase.technician}</p>
      <p><strong>Prioridad:</strong> ${selectedCase.priority}</p>
      <p><strong>Estado:</strong> ${selectedCase.status}</p>
      <p><strong>Fecha limite:</strong> ${selectedCase.deadline}</p>
    </div>
  `;
  qs('#modal').classList.remove('hidden');
};

const closeModal = () => {
  qs('#modal').classList.add('hidden');
  selectedCase = null;
};

const reassign = () => {
  if (!selectedCase) return;
  showToast(`Reasignando caso ${selectedCase.id}...`);
  closeModal();
};

const setupSearch = () => {
  const input = qs('.search input');
  if (!input) return;

  input.addEventListener('input', (e) => {
    const query = normalize(e.target.value);
    if (!query) {
      render();
      return;
    }

    const filtered = cases.filter(c =>
      normalize(c.id).includes(query) ||
      normalize(c.title).includes(query) ||
      normalize(c.client).includes(query) ||
      normalize(c.technician).includes(query) ||
      normalize(c.category).includes(query)
    );

    updateMetrics(filtered);
    renderTable(filtered);
  });
};

const fetchAssigned = async () => {
  try {
    const res = await fetch(`${API_URL}?action=get_casos_simple`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const filtered = Array.isArray(data) ? data.filter(isAssigned) : [];
    cases = filtered.map(mapCase);
    buildTechnicians();
    render();
    showToast('Casos asignados actualizados');
  } catch (err) {
    console.error('Error al cargar casos asignados:', err);
    showToast('No se pudieron cargar los casos asignados', true);
  }
};

const startAutoRefresh = () => {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(fetchAssigned, 30000);
};

window.openModal = openModal;
window.closeModal = closeModal;
window.reassign = reassign;

document.addEventListener('DOMContentLoaded', () => {
  setupSearch();
  fetchAssigned();
  startAutoRefresh();
});
