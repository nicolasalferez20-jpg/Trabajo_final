const API_URL = 'http://localhost:3001/api';

let cases = [];
let technicians = [];
let currentSelectedCase = null;
let autoRefreshTimer = null;

const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const formatCaseId = (id) => `#${String(id ?? '').padStart(8, '0')}`;

const normalize = (val = '') => String(val || '').toLowerCase();

const isUnassigned = (item) => {
  const estado = normalize(item.estado);
  const tecnico = normalize(item.tecnico_asignado || item.asignado_a || item.tecnico);
  return estado.includes('sin asignar') || estado.includes('no asignado') || estado === '' || !tecnico;
};

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const waitingTimeLabel = (value) => {
  if (!value) return 'Sin datos';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Sin datos';
  const diff = Date.now() - d.getTime();
  const hours = Math.max(1, Math.round(diff / 3600000));
  if (hours < 24) return `${hours} hora${hours === 1 ? '' : 's'}`;
  const days = Math.round(hours / 24);
  return `${days} dias${days === 1 ? '' : 's'}`;
};

const waitingTimeClass = (createdAt) => {
  const label = waitingTimeLabel(createdAt);
  if (label.includes('dia')) return 'waiting-time-red';
  const n = parseInt(label, 10);
  if (Number.isNaN(n)) return 'waiting-time-yellow';
  if (n >= 6) return 'waiting-time-red';
  if (n >= 3) return 'waiting-time-orange';
  return 'waiting-time-yellow';
};

const priorityClass = (priority) => {
  const p = normalize(priority);
  if (p === 'urgente' || p === 'critica' || p === 'critica') return 'priority-urgent';
  if (p === 'alta') return 'priority-high';
  if (p === 'media') return 'priority-medium';
  if (p === 'baja') return 'priority-low';
  return 'priority-medium';
};

const loadColorClass = (load, maxLoad) => {
  const percentage = (load / maxLoad) * 100;
  if (percentage >= 80) return 'load-fill-red';
  if (percentage >= 60) return 'load-fill-yellow';
  return 'load-fill-green';
};

const showToast = (msg, isError = false) => {
  let box = document.getElementById('unassigned-toast');
  if (!box) {
    box = document.createElement('div');
    box.id = 'unassigned-toast';
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
  return {
    id: formatCaseId(item.id || idx + 1),
    rawId: item.id || idx + 1,
    title: item.titulo || item.asunto || 'Caso sin titulo',
    client: item.cliente || item.empresa || 'Sin cliente',
    category: item.categoria || 'Sin categoria',
    priority,
    created: formatDate(item.fecha_creacion || item.created_at),
    waitingLabel: waitingTimeLabel(item.fecha_creacion || item.created_at),
    waitingClass: waitingTimeClass(item.fecha_creacion || item.created_at),
    description: item.descripcion || 'Sin descripcion',
    requiredSkill: item.categoria || 'Soporte general',
    estimatedTime: item.tiempo_estimado || 'No definido'
  };
};

const buildTechnicians = () => {
  const categoryCounts = cases.reduce((acc, c) => {
    const key = c.category || 'General';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(categoryCounts);
  if (!entries.length) {
    technicians = [];
    return;
  }

  technicians = entries.map(([category, count], idx) => {
    const maxLoad = 10;
    const currentLoad = Math.min(maxLoad, Math.max(2, Math.round(count * 1.5)));
    const initials = category.slice(0, 2).toUpperCase();
    return {
      id: idx + 1,
      name: `Tecnico ${idx + 1}`,
      avatar: initials,
      currentLoad,
      maxLoad,
      skills: [category]
    };
  });
};

const updateStats = () => {
  const urgentCount = cases.filter(c => normalize(c.priority) === 'urgente' || normalize(c.priority) === 'critica' || normalize(c.priority) === 'critica').length;
  const highCount = cases.filter(c => normalize(c.priority) === 'alta').length;
  const totalCount = cases.length;

  const avgHours = (() => {
    if (!cases.length) return 0;
    const totalHours = cases.reduce((acc, c) => {
      const label = waitingTimeLabel(c.created);
      const num = parseInt(label, 10);
      if (Number.isNaN(num)) return acc;
      if (label.includes('dia')) return acc + num * 24;
      return acc + num;
    }, 0);
    return Math.round(totalHours / cases.length);
  })();

  const avgLabel = avgHours >= 24 ? `${Math.round(avgHours / 24)}d` : `${avgHours}h`;

  qs('#urgent-count').textContent = urgentCount;
  qs('#high-count').textContent = highCount;
  qs('#total-unassigned').textContent = totalCount;
  qs('#queue-count').textContent = totalCount;
  const avgNode = qs('.stat-value.average-time');
  if (avgNode) avgNode.textContent = avgLabel;

  const alertMessage = qs('#alert-message');
  if (alertMessage) {
    alertMessage.textContent = `Hay ${urgentCount} casos urgentes y ${highCount} de alta prioridad esperando asignacion. Asigna estos casos para mantener los SLA.`;
  }
};

const renderCases = () => {
  const casesList = qs('#cases-list');
  casesList.innerHTML = '';

  if (!cases.length) {
    casesList.innerHTML = '<div class="case-card"><div class="case-content"><p class="detail-value">Sin casos sin asignar</p></div></div>';
    return;
  }

  cases.forEach(caso => {
    const caseElement = document.createElement('div');
    caseElement.className = 'case-card';
    caseElement.dataset.id = caso.id;

    caseElement.innerHTML = `
      <div class="case-content">
        <div class="case-header">
          <div class="case-info">
            <div class="case-id-priority">
              <span class="case-id">${caso.id}</span>
              <span class="priority-badge ${priorityClass(caso.priority)}">${caso.priority}</span>
              <div class="waiting-time ${caso.waitingClass}">
                <i data-lucide="clock" class="waiting-time-icon"></i>
                <span>Esperando ${caso.waitingLabel}</span>
              </div>
            </div>
            <h3 class="case-title">${caso.title}</h3>
            <p class="case-description">${caso.description}</p>
          </div>
        </div>
        <div class="case-details">
          <div>
            <p class="detail-label">Cliente</p>
            <p class="detail-value">${caso.client}</p>
          </div>
          <div>
            <p class="detail-label">Categoria</p>
            <p class="detail-value">${caso.category}</p>
          </div>
          <div>
            <p class="detail-label">Tiempo Estimado</p>
            <p class="detail-value">${caso.estimatedTime}</p>
          </div>
        </div>
        <div class="skill-card">
          <p class="skill-label">Habilidad Requerida:</p>
          <p class="skill-value">${caso.requiredSkill}</p>
        </div>
        <div class="case-actions">
          <button class="btn btn-outline view-details-btn" data-case-id="${caso.id}">
            <i data-lucide="eye" class="btn-icon"></i>
            Ver Detalles
          </button>
          <button class="btn btn-primary assign-btn" data-case-id="${caso.id}">
            <i data-lucide="user-plus" class="btn-icon"></i>
            Asignar Tecnico
          </button>
        </div>
      </div>
    `;

    casesList.appendChild(caseElement);
  });

  if (window.lucide) window.lucide.createIcons();

  qsa('.assign-btn').forEach(btn => btn.addEventListener('click', () => openAssignModal(btn.dataset.caseId)));
  qsa('.view-details-btn').forEach(btn => btn.addEventListener('click', () => showCaseDetails(btn.dataset.caseId)));
};

const renderTechnicians = () => {
  const techniciansList = qs('#technicians-list');
  techniciansList.innerHTML = '';

  if (!technicians.length) {
    techniciansList.innerHTML = '<p class="detail-value">Sin tecnicos disponibles</p>';
    return;
  }

  technicians.forEach(tech => {
    const loadPercentage = Math.round((tech.currentLoad / tech.maxLoad) * 100);
    const techElement = document.createElement('div');
    techElement.className = 'technician-card';
    techElement.dataset.id = tech.id;

    techElement.innerHTML = `
      <div class="technician-header">
        <div class="technician-avatar">${tech.avatar}</div>
        <div class="technician-info">
          <p class="technician-name">${tech.name}</p>
          <p class="technician-load">${tech.currentLoad}/${tech.maxLoad} casos activos</p>
        </div>
      </div>
      <div class="load-container">
        <div class="load-header">
          <span>Carga de trabajo</span>
          <span>${loadPercentage}%</span>
        </div>
        <div class="load-bar">
          <div class="load-fill ${loadColorClass(tech.currentLoad, tech.maxLoad)}" style="width: ${loadPercentage}%"></div>
        </div>
      </div>
      <div class="skills-container">
        <p class="skills-label">Habilidades:</p>
        <div class="skills-list">
          ${tech.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
        </div>
      </div>
    `;

    techniciansList.appendChild(techElement);
  });
};

const renderModalTechnicians = () => {
  const modalTechniciansList = qs('#technicians-modal-list');
  modalTechniciansList.innerHTML = '';
  if (!currentSelectedCase || !technicians.length) return;

  technicians.forEach(tech => {
    const hasSkill = tech.skills.some(skill => normalize(currentSelectedCase.requiredSkill).includes(normalize(skill)));
    const loadPercentage = Math.round((tech.currentLoad / tech.maxLoad) * 100);

    const techElement = document.createElement('div');
    techElement.className = `technician-modal-card ${hasSkill ? 'recommended' : ''}`;
    techElement.dataset.techId = tech.id;
    techElement.innerHTML = `
      <div class="technician-modal-content">
        <div class="technician-modal-left">
          <div class="technician-modal-avatar">${tech.avatar}</div>
          <div class="technician-modal-info">
            <p class="technician-modal-name">
              ${tech.name}
              ${hasSkill ? '<span class="recommended-badge">Recomendado</span>' : ''}
            </p>
            <p class="technician-modal-load">${tech.currentLoad}/${tech.maxLoad} casos activos</p>
          </div>
        </div>
        <div class="technician-modal-right">
          <div class="modal-load-bar">
            <div class="modal-load-fill ${loadColorClass(tech.currentLoad, tech.maxLoad)}" style="width: ${loadPercentage}%"></div>
          </div>
          <p class="load-percentage">${loadPercentage}% carga</p>
        </div>
      </div>
    `;

    techElement.addEventListener('click', () => assignCase(currentSelectedCase.id, tech.id));
    modalTechniciansList.appendChild(techElement);
  });
};

const openAssignModal = (caseId) => {
  const caso = cases.find(c => c.id === caseId);
  if (!caso) return;
  currentSelectedCase = caso;
  qs('#modal-case-info').textContent = `${caso.id} - ${caso.title}`;
  qs('#modal-skill').textContent = caso.requiredSkill;
  renderModalTechnicians();
  qs('#assign-modal').style.display = 'flex';
};

const closeAssignModal = () => {
  qs('#assign-modal').style.display = 'none';
  currentSelectedCase = null;
};

const assignCase = (caseId, technicianId) => {
  const tech = technicians.find(t => t.id === Number(technicianId));
  if (!tech) return;
  cases = cases.filter(c => c.id !== caseId);
  updateStats();
  renderCases();
  closeAssignModal();
  showToast(`Caso ${caseId} asignado a ${tech.name}`);
};

const showCaseDetails = (caseId) => {
  const caso = cases.find(c => c.id === caseId);
  if (!caso) return;
  showToast(`${caso.id} | ${caso.client} | ${caso.priority}`);
};

const fetchUnassigned = async () => {
  try {
    const res = await fetch(`${API_URL}?action=get_casos_simple`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const filtered = Array.isArray(data) ? data.filter(isUnassigned) : [];
    cases = filtered.map(mapCase);
    buildTechnicians();
    updateStats();
    renderCases();
    renderTechnicians();
    showToast('Casos sin asignar actualizados');
  } catch (err) {
    console.error('Error al cargar casos sin asignar:', err);
    showToast('No se pudieron cargar los casos sin asignar', true);
  }
};

const setupEventListeners = () => {
  const cancelAssign = qs('#cancel-assign');
  if (cancelAssign) cancelAssign.addEventListener('click', closeAssignModal);
};

const startAutoRefresh = () => {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(fetchUnassigned, 30000);
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) window.lucide.createIcons();
  setupEventListeners();
  fetchUnassigned();
  startAutoRefresh();
});
