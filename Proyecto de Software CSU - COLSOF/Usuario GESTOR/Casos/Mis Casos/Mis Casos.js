const API_URL = 'http://localhost:3001/api';

let cases = [];
let allCases = [];
let filterStatus = 'all';
let autoRefreshTimer = null;
const CURRENT_USER = 'Juan Perez';

const qs = (sel, ctx = document) => ctx.querySelector(sel);
const normalize = (val = '') => String(val || '').toLowerCase();

const formatCaseId = (id) => `#${String(id ?? '').padStart(8, '0')}`;

const isMyCases = (item) => {
  const tecnico = normalize(item.tecnico_asignado || item.asignado_a || item.tecnico);
  const currentUser = normalize(CURRENT_USER);
  return tecnico.includes(currentUser.split(' ')[0]) || 
         tecnico.includes(currentUser.split(' ')[1]) ||
         tecnico === currentUser;
};

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('es-CO', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const timeAgo = (value) => {
  if (!value) return 'Sin fecha';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Sin fecha';
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours} hora${hours === 1 ? '' : 's'}`;
  return `Hace ${days} dia${days === 1 ? '' : 's'}`;
};

const showToast = (msg, isError = false) => {
  let box = document.getElementById('mycases-toast');
  if (!box) {
    box = document.createElement('div');
    box.id = 'mycases-toast';
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
    client: item.cliente || item.empresa || 'Sin cliente',
    category: item.categoria || 'Sin categoria',
    priority,
    status,
    created: formatDate(item.fecha_creacion || item.created_at),
    updated: timeAgo(item.fecha_actualizacion || item.updated_at || item.fecha_creacion),
    description: item.descripcion || 'Sin descripcion',
    notes: item.notas_count || item.comentarios_count || 0,
    attachments: item.adjuntos_count || item.evidencias_count || 0,
    assignedBy: item.asignado_por || item.gestor || 'Sistema',
    deadline: formatDate(item.fecha_limite || item.deadline),
    technician: item.tecnico_asignado || item.asignado_a || item.tecnico || 'Sin asignar'
  };
};

const updateMetrics = () => {
  const total = allCases.length;
  const inProgress = allCases.filter(c => normalize(c.status).includes('progreso') || normalize(c.status).includes('proceso')).length;
  const pending = allCases.filter(c => normalize(c.status).includes('pendiente') || normalize(c.status).includes('espera')).length;
  const completed = allCases.filter(c => normalize(c.status).includes('completado') || normalize(c.status).includes('cerrado') || normalize(c.status).includes('resuelto')).length;
  const active = total - completed;

  qs('#totalCases').textContent = total;
  qs('#inProgress').textContent = inProgress;
  qs('#pending').textContent = pending;
  qs('#completed').textContent = completed;
  qs('#activeCases').textContent = `${active} casos activos`;
};

const renderCases = () => {
  const list = qs('#casesList');
  list.innerHTML = '';

  if (!cases.length) {
    list.innerHTML = '<div class="case"><p style="text-align:center;">Sin casos asignados</p></div>';
    return;
  }

  cases.forEach(c => {
    const caseDiv = document.createElement('div');
    caseDiv.className = 'case';
    caseDiv.onclick = () => openModal(c.id);
    
    caseDiv.innerHTML = `
      <span class="badge priority-${c.priority}">${c.priority}</span>
      <strong>${c.id}</strong>
      <h3>${c.title}</h3>
      <p>${c.description}</p>
      <div style="display:flex;gap:10px;margin-top:8px;font-size:13px;color:#6b7280;">
        <span>${c.client}</span>
        <span>•</span>
        <span>Vence ${c.deadline}</span>
        <span>•</span>
        <span>${c.updated}</span>
      </div>
      <div style="display:flex;gap:10px;margin-top:6px;font-size:12px;color:#9ca3af;">
        <span>📝 ${c.notes} notas</span>
        <span>📎 ${c.attachments} adjuntos</span>
      </div>
    `;
    
    list.appendChild(caseDiv);
  });
};

const render = () => {
  updateMetrics();
  renderCases();
};

const setFilter = (status) => {
  filterStatus = status;
  
  cases = filterStatus === 'all'
    ? allCases
    : allCases.filter(c => c.status === status);
  
  renderCases();
  
  document.querySelectorAll('.filter-buttons button').forEach(btn => {
    btn.style.background = '';
    btn.style.color = '';
  });
  
  const activeBtn = Array.from(document.querySelectorAll('.filter-buttons button'))
    .find(btn => {
      if (status === 'all' && btn.textContent === 'Todos') return true;
      if (status === 'En Progreso' && btn.textContent === 'En Progreso') return true;
      if (status === 'Pendiente' && btn.textContent === 'Pendientes') return true;
      return false;
    });
  
  if (activeBtn) {
    activeBtn.style.background = '#1d4ed8';
    activeBtn.style.color = 'white';
  }
};

const openModal = (id) => {
  const c = cases.find(x => x.id === id);
  if (!c) return;
  
  qs('#modalId').textContent = c.id;
  qs('#modalTitle').textContent = c.title;
  qs('#modalBody').innerHTML = `
    <div style="padding:15px;">
      <p><strong>Cliente:</strong> ${c.client}</p>
      <p><strong>Categoria:</strong> ${c.category}</p>
      <p><strong>Prioridad:</strong> ${c.priority}</p>
      <p><strong>Estado:</strong> ${c.status}</p>
      <p><strong>Tecnico asignado:</strong> ${c.technician}</p>
      <p><strong>Asignado por:</strong> ${c.assignedBy}</p>
      <p><strong>Fecha creacion:</strong> ${c.created}</p>
      <p><strong>Fecha limite:</strong> ${c.deadline}</p>
      <p><strong>Ultima actualizacion:</strong> ${c.updated}</p>
      <hr style="margin:10px 0;">
      <p><strong>Descripcion:</strong></p>
      <p>${c.description}</p>
      <hr style="margin:10px 0;">
      <p><strong>Notas:</strong> ${c.notes} | <strong>Adjuntos:</strong> ${c.attachments}</p>
    </div>
  `;
  qs('#modal').classList.remove('hidden');
};

const closeModal = () => {
  qs('#modal').classList.add('hidden');
};

const setupSearch = () => {
  const input = qs('.filters input');
  if (!input) return;
  
  input.disabled = false;
  input.addEventListener('input', (e) => {
    const query = normalize(e.target.value);
    
    if (!query) {
      cases = filterStatus === 'all' ? allCases : allCases.filter(c => c.status === filterStatus);
      renderCases();
      return;
    }

    const baseFilter = filterStatus === 'all' ? allCases : allCases.filter(c => c.status === filterStatus);
    
    cases = baseFilter.filter(c =>
      normalize(c.id).includes(query) ||
      normalize(c.title).includes(query) ||
      normalize(c.client).includes(query) ||
      normalize(c.description).includes(query) ||
      normalize(c.category).includes(query)
    );

    renderCases();
  });
};

const fetchMyCases = async () => {
  try {
    const res = await fetch(`${API_URL}?action=get_casos_simple`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const filtered = Array.isArray(data) ? data.filter(isMyCases) : [];
    allCases = filtered.map(mapCase);
    cases = allCases;
    render();
    showToast('Mis casos actualizados');
  } catch (err) {
    console.error('Error al cargar mis casos:', err);
    showToast('No se pudieron cargar mis casos', true);
  }
};

const startAutoRefresh = () => {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(fetchMyCases, 30000);
};

window.setFilter = setFilter;
window.openModal = openModal;
window.closeModal = closeModal;

document.addEventListener('DOMContentLoaded', () => {
  setupSearch();
  fetchMyCases();
  startAutoRefresh();
});
