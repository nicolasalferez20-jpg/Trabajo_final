const API_URL = 'http://localhost:3001/api';

let cases = [];
let selectedCase = null;
let autoRefreshTimer = null;

const qs = (sel, ctx = document) => ctx.querySelector(sel);
const normalize = (val = '') => String(val || '').toLowerCase();

const formatCaseId = (id) => `#${String(id ?? '').padStart(8, '0')}`;

const isPendingClose = (item) => {
  const estado = normalize(item.estado);
  return estado.includes('completado') || estado.includes('por cerrar') || 
         estado.includes('resuelto') || estado.includes('pendiente cierre') ||
         estado.includes('pendiente validacion');
};

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const calculatePendingDays = (completedDate) => {
  if (!completedDate) return 0;
  const d = new Date(completedDate);
  if (Number.isNaN(d.getTime())) return 0;
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / 86400000));
};

const daysClass = (d) => {
  if (d >= 3) return 'red';
  if (d >= 2) return 'orange';
  return 'yellow';
};

const showToast = (msg, isError = false) => {
  let box = document.getElementById('closing-toast');
  if (!box) {
    box = document.createElement('div');
    box.id = 'closing-toast';
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
  const completedDate = item.fecha_completado || item.fecha_resolucion || item.updated_at;
  const pendingDays = calculatePendingDays(completedDate);
  
  return {
    id: formatCaseId(item.id || idx + 1),
    rawId: item.id || idx + 1,
    title: item.titulo || item.asunto || 'Caso sin titulo',
    client: item.cliente || item.empresa || 'Sin cliente',
    technician: item.tecnico_asignado || item.asignado_a || item.tecnico || 'Sin tecnico',
    priority,
    pendingDays,
    completed: formatDate(completedDate),
    resolution: item.resolucion || item.solucion || item.descripcion || 'Sin resolucion',
    attachments: item.adjuntos || item.evidencias || [],
    reason: item.motivo_pendiente || item.razon || 'Pendiente validacion',
    category: item.categoria || 'Sin categoria'
  };
};

const updateMetrics = () => {
  const total = cases.length;
  const urgent = cases.filter(c => c.pendingDays === 1).length;
  const soon = cases.filter(c => c.pendingDays === 2).length;
  const late = cases.filter(c => c.pendingDays >= 3).length;

  qs('#totalPending').textContent = total;
  qs('#kpiTotal').textContent = total;
  qs('#kpiUrgent').textContent = urgent;
  qs('#kpiSoon').textContent = soon;
  qs('#kpiLate').textContent = late;
};

const renderCases = () => {
  const list = qs('#casesList');
  list.innerHTML = '';

  if (!cases.length) {
    list.innerHTML = '<div class="case"><p style="text-align:center;">Sin casos pendientes de cierre</p></div>';
    return;
  }

  cases.forEach(c => {
    const caseDiv = document.createElement('div');
    caseDiv.className = 'case';
    
    const attachmentsHtml = Array.isArray(c.attachments) && c.attachments.length
      ? c.attachments.map(a => `<span>${a}</span>`).join('')
      : '<span style="color:#9ca3af;">Sin adjuntos</span>';

    caseDiv.innerHTML = `
      <div class="case-header">
        <div>
          <strong>${c.id}</strong>
          <span class="badge priority-${c.priority}">${c.priority}</span>
        </div>
        <span class="days ${daysClass(c.pendingDays)}">Hace ${c.pendingDays} dia(s)</span>
      </div>
      <h3>${c.title}</h3>
      <p><strong>Cliente:</strong> ${c.client}</p>
      <p><strong>Tecnico:</strong> ${c.technician}</p>
      <p><strong>Categoria:</strong> ${c.category}</p>
      <p>${c.resolution}</p>
      <div class="attachments">
        ${attachmentsHtml}
      </div>
      <div class="actions">
        <button class="view" onclick="window.openModal('${c.id}')">Ver</button>
        <button class="reject" onclick="window.rejectCase('${c.id}')">Rechazar</button>
        <button class="approve" onclick="window.approveCase('${c.id}')">Aprobar</button>
      </div>
    `;
    
    list.appendChild(caseDiv);
  });
};

const render = () => {
  updateMetrics();
  renderCases();
};

const openModal = (id) => {
  selectedCase = cases.find(c => c.id === id);
  if (!selectedCase) return;
  
  qs('#modalId').textContent = selectedCase.id;
  qs('#modalBody').innerHTML = `
    <div style="padding:15px;">
      <p><strong>${selectedCase.title}</strong></p>
      <p><strong>Cliente:</strong> ${selectedCase.client}</p>
      <p><strong>Tecnico:</strong> ${selectedCase.technician}</p>
      <p><strong>Categoria:</strong> ${selectedCase.category}</p>
      <p><strong>Prioridad:</strong> ${selectedCase.priority}</p>
      <p><strong>Completado:</strong> ${selectedCase.completed}</p>
      <p><strong>Tiempo pendiente:</strong> ${selectedCase.pendingDays} dia(s)</p>
      <hr style="margin:10px 0;">
      <p><strong>Resolucion:</strong></p>
      <p>${selectedCase.resolution}</p>
      <p><strong>Razon pendiente:</strong></p>
      <p><em>${selectedCase.reason}</em></p>
    </div>
  `;
  qs('#modal').classList.remove('hidden');
};

const closeModal = () => {
  qs('#modal').classList.add('hidden');
  selectedCase = null;
};

const approveCase = (id) => {
  const caso = id ? cases.find(c => c.id === id) : selectedCase;
  if (!caso) return;
  
  showToast(`Caso ${caso.id} aprobado y cerrado`);
  cases = cases.filter(c => c.id !== caso.id);
  render();
  if (qs('#modal').classList.contains('hidden') === false) {
    closeModal();
  }
};

const rejectCase = (id) => {
  const caso = id ? cases.find(c => c.id === id) : selectedCase;
  if (!caso) return;
  
  showToast(`Caso ${caso.id} rechazado y devuelto al tecnico`);
  cases = cases.filter(c => c.id !== caso.id);
  render();
  if (qs('#modal').classList.contains('hidden') === false) {
    closeModal();
  }
};

const fetchPendingClose = async () => {
  try {
    const res = await fetch(`${API_URL}?action=get_casos_simple`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const filtered = Array.isArray(data) ? data.filter(isPendingClose) : [];
    cases = filtered.map(mapCase);
    render();
    showToast('Casos por cerrar actualizados');
  } catch (err) {
    console.error('Error al cargar casos por cerrar:', err);
    showToast('No se pudieron cargar los casos por cerrar', true);
  }
};

const startAutoRefresh = () => {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(fetchPendingClose, 30000);
};

window.openModal = openModal;
window.closeModal = closeModal;
window.approveCase = approveCase;
window.rejectCase = rejectCase;

document.addEventListener('DOMContentLoaded', () => {
  fetchPendingClose();
  startAutoRefresh();
});
