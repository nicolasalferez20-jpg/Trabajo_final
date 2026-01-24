const API_URL = 'http://localhost:3001/api';
const DRAFT_STATES = ['borrador', 'draft', 'drafts', 'borradores'];

let drafts = [];
let filteredDrafts = [];
let currentSelectedDraft = null;
let draftToDelete = null;
let autoRefreshTimer = null;

const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const formatCaseId = (id) => `DRAFT-${String(id ?? '').padStart(3, '0')}`;

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const timeAgo = (value) => {
  if (!value) return 'Sin fecha';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Hace instantes';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Hace ${days} d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Hace ${months} mes(es)`;
  const years = Math.floor(months / 12);
  return `Hace ${years} año(s)`;
};

const completenessMeta = [
  { key: 'titulo', label: 'Título' },
  { key: 'asunto', label: 'Asunto' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'empresa', label: 'Cliente' },
  { key: 'categoria', label: 'Categoría' },
  { key: 'prioridad', label: 'Prioridad' },
  { key: 'contacto', label: 'Contacto' },
  { key: 'contacto_nombre', label: 'Contacto' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'contacto_telefono', label: 'Teléfono' },
  { key: 'tiempo_estimado', label: 'Tiempo estimado' },
  { key: 'fecha_limite', label: 'Fecha límite' },
  { key: 'archivos', label: 'Archivos adjuntos' }
];

const computeCompleteness = (draft) => {
  const seen = new Set();
  let filled = 0;
  let total = 0;
  const missing = [];

  completenessMeta.forEach(({ key, label }) => {
    if (seen.has(label)) return;
    const val = draft[key];
    const isFilled = val !== undefined && val !== null && String(val).trim() !== '';
    total += 1;
    if (isFilled) {
      filled += 1;
    } else {
      missing.push(label);
    }
    seen.add(label);
  });

  const completeness = total === 0 ? 0 : Math.round((filled / total) * 100);
  return { completeness, missingFields: missing };
};

const capitalize = (txt = '') => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();

const mapApiToDraft = (item, idx) => {
  const { completeness, missingFields } = computeCompleteness(item);
  return {
    id: formatCaseId(item.id ?? idx + 1),
    rawId: item.id ?? idx + 1,
    title: item.titulo || item.asunto || 'Caso sin título',
    client: item.cliente || item.empresa || 'Sin cliente',
    category: item.categoria || 'Sin categoría',
    priority: item.prioridad ? capitalize(item.prioridad) : 'Media',
    createdDate: formatDate(item.fecha_creacion || item.created_at),
    lastModified: timeAgo(item.updated_at || item.fecha_modificacion || item.fecha_creacion || item.created_at),
    completeness,
    missingFields,
    description: item.descripcion || '',
    contactName: item.contacto || item.contacto_nombre || '',
    contactPhone: item.telefono || item.contacto_telefono || '',
    estimatedTime: item.tiempo_estimado || '',
    notes: item.notas || item.comentarios || '',
    estado: item.estado || ''
  };
};

const isDraftState = (estado) => {
  const value = (estado || '').toLowerCase();
  return DRAFT_STATES.some(s => value.includes(s));
};

const showToast = (msg, isError = false) => {
  let box = document.getElementById('draft-toast');
  if (!box) {
    box = document.createElement('div');
    box.id = 'draft-toast';
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

const getPriorityClass = (priority) => {
  const val = (priority || '').toLowerCase();
  if (val === 'urgente' || val === 'critica' || val === 'crítica') return 'priority-urgent';
  if (val === 'alta') return 'priority-high';
  if (val === 'media') return 'priority-medium';
  if (val === 'baja') return 'priority-low';
  return 'priority-medium';
};

const getCompletenessClass = (completeness) => {
  if (completeness >= 80) return 'completeness-high';
  if (completeness >= 50) return 'completeness-medium';
  return 'completeness-low';
};

const getProgressBarClass = (completeness) => {
  if (completeness >= 80) return 'progress-fill-green';
  if (completeness >= 50) return 'progress-fill-yellow';
  return 'progress-fill-red';
};

const getStatusText = (completeness) => {
  if (completeness >= 80) return 'Listo';
  if (completeness >= 50) return 'En progreso';
  return 'Incompleto';
};

const updateStats = () => {
  const readyCount = drafts.filter(d => d.completeness >= 80).length;
  const progressCount = drafts.filter(d => d.completeness >= 50 && d.completeness < 80).length;
  const incompleteCount = drafts.filter(d => d.completeness < 50).length;
  const totalCount = drafts.length;

  qs('#total-drafts').textContent = totalCount;
  qs('#ready-count').textContent = readyCount;
  qs('#progress-count').textContent = progressCount;
  qs('#incomplete-count').textContent = incompleteCount;
  qs('#drafts-count').textContent = totalCount;
};

const renderDrafts = () => {
  const draftsList = qs('#drafts-list');
  draftsList.innerHTML = '';

  if (!filteredDrafts.length) {
    draftsList.innerHTML = '<div class="draft-card"><div class="draft-content"><p class="detail-value">Sin borradores disponibles</p></div></div>';
    return;
  }

  filteredDrafts.forEach(draft => {
    const draftElement = document.createElement('div');
    draftElement.className = 'draft-card';
    draftElement.dataset.id = draft.id;

    draftElement.innerHTML = `
      <div class="draft-content">
        <div class="draft-header">
          <div class="draft-info">
            <div class="draft-meta">
              <span class="draft-id">${draft.id}</span>
              ${draft.priority ? `<span class="priority-badge ${getPriorityClass(draft.priority)}">${draft.priority}</span>` : ''}
              <span class="draft-category">${draft.category}</span>
              <div class="draft-time">
                <i data-lucide="clock" class="draft-time-icon"></i>
                <span>${draft.lastModified}</span>
              </div>
            </div>
            <h3 class="draft-title">${draft.title}</h3>
            <p class="draft-client">${draft.client}</p>
          </div>
          <div class="draft-completeness">
            <p class="completeness-label">Completitud</p>
            <p class="completeness-value ${getCompletenessClass(draft.completeness)}">${draft.completeness}%</p>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${getProgressBarClass(draft.completeness)}" style="width: ${draft.completeness}%"></div>
        </div>
        ${draft.missingFields.length ? `
          <div class="missing-fields">
            <p class="missing-fields-title">Campos pendientes por completar:</p>
            <div class="missing-fields-list">
              ${draft.missingFields.map(field => `<span class="missing-field-tag">${field}</span>`).join('')}
            </div>
          </div>
        ` : ''}
        <div class="draft-details">
          <div class="draft-detail">
            <p class="detail-label">Creado</p>
            <p class="detail-value">${draft.createdDate}</p>
          </div>
          <div class="draft-detail">
            <p class="detail-label">Contacto</p>
            <p class="detail-value">${draft.contactName || 'No asignado'}</p>
          </div>
          <div class="draft-detail">
            <p class="detail-label">Tiempo Estimado</p>
            <p class="detail-value">${draft.estimatedTime || 'No definido'}</p>
          </div>
          <div class="draft-detail">
            <p class="detail-label">Estado</p>
            <p class="detail-value ${getCompletenessClass(draft.completeness)}">${getStatusText(draft.completeness)}</p>
          </div>
        </div>
        <div class="draft-actions">
          <button class="btn btn-outline view-details-btn" data-draft-id="${draft.id}">
            <i data-lucide="eye" class="btn-icon"></i>
            Ver Detalles
          </button>
          <button class="btn btn-primary edit-draft-btn" data-draft-id="${draft.id}">
            <i data-lucide="edit" class="btn-icon"></i>
            Continuar Editando
          </button>
          <button class="btn btn-success publish-draft-btn" data-draft-id="${draft.id}" ${draft.completeness < 80 ? 'disabled' : ''}>
            <i data-lucide="send" class="btn-icon"></i>
            Publicar
          </button>
          <button class="btn btn-danger btn-small delete-draft-btn" data-draft-id="${draft.id}">
            <i data-lucide="trash-2" class="btn-icon"></i>
          </button>
        </div>
      </div>
    `;

    draftsList.appendChild(draftElement);
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }

  qsa('.view-details-btn').forEach(btn => btn.addEventListener('click', () => openDetailModal(btn.dataset.draftId)));
  qsa('.edit-draft-btn').forEach(btn => btn.addEventListener('click', () => editDraft(btn.dataset.draftId)));
  qsa('.publish-draft-btn').forEach(btn => btn.addEventListener('click', () => publishDraft(btn.dataset.draftId)));
  qsa('.delete-draft-btn').forEach(btn => btn.addEventListener('click', () => openDeleteModal(btn.dataset.draftId)));
};

const openDetailModal = (draftId) => {
  const draft = drafts.find(d => d.id === draftId);
  if (!draft) return;
  currentSelectedDraft = draft;

  qs('#modal-draft-id').textContent = draft.id;
  qs('#modal-draft-title').textContent = draft.title;

  const priorityElement = qs('#modal-priority');
  priorityElement.textContent = draft.priority;
  priorityElement.className = `priority-badge ${getPriorityClass(draft.priority)}`;

  qs('#modal-completeness').textContent = `${draft.completeness}%`;
  qs('#modal-completeness').className = `completeness-value ${getCompletenessClass(draft.completeness)}`;

  const progressBar = qs('#modal-completeness-bar');
  progressBar.className = `completeness-fill ${getProgressBarClass(draft.completeness)}`;
  progressBar.style.width = `${draft.completeness}%`;

  const missingFieldsSection = qs('#modal-missing-fields');
  if (draft.missingFields.length > 0) {
    missingFieldsSection.innerHTML = `
      <p class="missing-fields-title">Campos pendientes por completar:</p>
      <div class="missing-fields-tags">
        ${draft.missingFields.map(field => `<span class="missing-field-tag-large">${field}</span>`).join('')}
      </div>
    `;
    missingFieldsSection.style.display = 'block';
  } else {
    missingFieldsSection.style.display = 'none';
  }

  qs('#modal-client').textContent = draft.client;
  qs('#modal-category').textContent = draft.category;
  qs('#modal-created').textContent = draft.createdDate;
  qs('#modal-modified').textContent = draft.lastModified;
  qs('#modal-contact').textContent = draft.contactName || 'No asignado';
  qs('#modal-phone').textContent = draft.contactPhone || 'No asignado';

  const descriptionSection = qs('#modal-description-section');
  if (draft.description) {
    descriptionSection.innerHTML = `
      <p class="section-title">Descripción</p>
      <div class="section-content">${draft.description}</div>
    `;
    descriptionSection.style.display = 'block';
  } else {
    descriptionSection.style.display = 'none';
  }

  const notesSection = qs('#modal-notes-section');
  if (draft.notes) {
    notesSection.innerHTML = `
      <p class="section-title">Notas</p>
      <div class="section-content">${draft.notes}</div>
    `;
    notesSection.style.display = 'block';
  } else {
    notesSection.style.display = 'none';
  }

  const publishBtn = qs('#publish-draft-btn');
  publishBtn.disabled = draft.completeness < 80;
  publishBtn.className = 'btn btn-success';

  qs('#detail-modal').style.display = 'flex';
};

const closeDetailModal = () => {
  qs('#detail-modal').style.display = 'none';
  currentSelectedDraft = null;
};

const openDeleteModal = (draftId) => {
  const draft = drafts.find(d => d.id === draftId);
  if (!draft) return;
  draftToDelete = draft;
  qs('#delete-draft-id').textContent = draft.id;
  qs('#delete-draft-title').textContent = draft.title;
  qs('#delete-modal').style.display = 'flex';
};

const closeDeleteModal = () => {
  qs('#delete-modal').style.display = 'none';
  draftToDelete = null;
};

const editDraft = (draftId) => {
  const draft = drafts.find(d => d.id === draftId);
  if (!draft) return;
  showToast(`Reanudar edición de ${draft.id}`);
};

const publishDraft = (draftId) => {
  const draft = drafts.find(d => d.id === draftId);
  if (!draft) return;
  if (draft.completeness < 80) {
    showToast('Completa al menos 80% para publicar', true);
    return;
  }
  drafts = drafts.filter(d => d.id !== draftId);
  filteredDrafts = filteredDrafts.filter(d => d.id !== draftId);
  updateStats();
  renderDrafts();
  closeDetailModal();
  showToast(`Borrador ${draft.id} publicado`);
};

const deleteDraft = () => {
  if (!draftToDelete) return;
  drafts = drafts.filter(d => d.id !== draftToDelete.id);
  filteredDrafts = filteredDrafts.filter(d => d.id !== draftToDelete.id);
  updateStats();
  renderDrafts();
  showToast(`Borrador ${draftToDelete.id} eliminado`);
  draftToDelete = null;
  closeDeleteModal();
};

const handleSearch = (term) => {
  const value = term.toLowerCase();
  filteredDrafts = drafts.filter(d =>
    d.title.toLowerCase().includes(value) ||
    d.client.toLowerCase().includes(value) ||
    d.id.toLowerCase().includes(value) ||
    d.category.toLowerCase().includes(value)
  );
  renderDrafts();
};

const fetchDrafts = async () => {
  try {
    const res = await fetch(`${API_URL}?action=get_casos_simple`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const onlyDrafts = Array.isArray(data) ? data.filter(item => isDraftState(item.estado) || item.es_borrador) : [];
    drafts = onlyDrafts.map(mapApiToDraft);
    filteredDrafts = [...drafts];
    updateStats();
    renderDrafts();
    showToast('Borradores actualizados');
  } catch (err) {
    console.error('Error al cargar borradores:', err);
    showToast('No se pudieron cargar los borradores', true);
  }
};

const setupEventListeners = () => {
  const searchInput = qs('#search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
  }

  const closeDetailBtn = qs('#close-detail-modal');
  const closeModalBtn = qs('#close-modal-btn');
  if (closeDetailBtn) closeDetailBtn.addEventListener('click', closeDetailModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeDetailModal);

  const continueBtn = qs('#continue-editing-btn');
  if (continueBtn) continueBtn.addEventListener('click', () => { if (currentSelectedDraft) editDraft(currentSelectedDraft.id); });

  const publishBtn = qs('#publish-draft-btn');
  if (publishBtn) publishBtn.addEventListener('click', () => { if (currentSelectedDraft) publishDraft(currentSelectedDraft.id); });

  const cancelDeleteBtn = qs('#cancel-delete-btn');
  const confirmDeleteBtn = qs('#confirm-delete-btn');
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', deleteDraft);
};

const startAutoRefresh = () => {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(fetchDrafts, 30000);
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
  setupEventListeners();
  fetchDrafts();
  startAutoRefresh();
});// Datos de los borradores
const drafts = [
    {
        id: 'DRAFT-001',
        title: 'Actualización servidores Datacenter',
        client: 'ECOPETROL',
        category: 'HARDWARE',
        priority: 'Alta',
        createdDate: '10 Ene 2025, 14:30',
        lastModified: 'Hace 1 hora',
        completeness: 75,
        missingFields: ['Fecha límite', 'Archivos adjuntos'],
        description: 'Actualización de firmware y parches de seguridad en servidores Dell PowerEdge del datacenter principal',
        contactName: 'María Rodríguez',
        contactPhone: '+57 310 456 7890',
        estimatedTime: '6 horas',
        notes: 'Requiere ventana de mantenimiento nocturna'
    },
    {
        id: 'DRAFT-002',
        title: 'Instalación Office 365 nuevos usuarios',
        client: 'BANCO AGRARIO',
        category: 'SOFTWARE',
        priority: 'Media',
        createdDate: '10 Ene 2025, 11:15',
        lastModified: 'Hace 3 horas',
        completeness: 60,
        missingFields: ['Prioridad', 'Contacto', 'Descripción detallada'],
        description: 'Instalación y configuración de Office 365 para 15 nuevos empleados',
        contactName: '',
        contactPhone: '',
        estimatedTime: '',
        notes: ''
    },
    {
        id: 'DRAFT-003',
        title: 'Reparación switch principal',
        client: 'QUALA SA',
        category: 'REDES',
        priority: 'Urgente',
        createdDate: '09 Ene 2025, 16:45',
        lastModified: 'Hace 1 día',
        completeness: 90,
        missingFields: ['Archivos adjuntos'],
        description: 'Switch Cisco Catalyst 3850 presenta fallas intermitentes en puertos 12-24',
        contactName: 'Andrea Gómez',
        contactPhone: '+57 312 345 6789',
        estimatedTime: '3 horas',
        notes: 'Cliente solicita atención urgente debido a pérdida de conectividad'
    },
    {
        id: 'DRAFT-004',
        title: 'Configuración backup automático',
        client: 'IDIGER',
        category: 'SOFTWARE',
        priority: 'Media',
        createdDate: '09 Ene 2025, 10:00',
        lastModified: 'Hace 1 día',
        completeness: 45,
        missingFields: ['Categoría', 'Fecha límite', 'Tiempo estimado', 'Contacto'],
        description: '',
        contactName: '',
        contactPhone: '',
        estimatedTime: '',
        notes: ''
    },
    {
        id: 'DRAFT-005',
        title: 'Mantenimiento preventivo UPS',
        client: 'CANCEROLÓGICO',
        category: 'HARDWARE',
        priority: 'Baja',
        createdDate: '08 Ene 2025, 15:20',
        lastModified: 'Hace 2 días',
        completeness: 85,
        missingFields: ['Fecha límite'],
        description: 'Mantenimiento trimestral de UPS APC Smart-UPS 10KVA',
        contactName: 'Patricia Ruiz',
        contactPhone: '+57 314 567 8901',
        estimatedTime: '2 horas',
        notes: 'Coordinar con administración para corte de energía'
    },
    {
        id: 'DRAFT-006',
        title: 'Migración email a cloud',
        client: 'COLSOF SAS',
        category: 'SOFTWARE',
        priority: 'Alta',
        createdDate: '08 Ene 2025, 09:30',
        lastModified: 'Hace 2 días',
        completeness: 70,
        missingFields: ['Tiempo estimado', 'Archivos adjuntos'],
        description: 'Migración de cuentas de correo desde servidor local a Microsoft 365',
        contactName: 'Diana López',
        contactPhone: '+57 315 678 9012',
        estimatedTime: '',
        notes: 'Migración progresiva por departamentos'
    },
    {
        id: 'DRAFT-007',
        title: 'Instalación sistema biométrico',
        client: 'SUPERSALUD',
        category: 'HARDWARE',
        priority: 'Media',
        createdDate: '07 Ene 2025, 13:00',
        lastModified: 'Hace 3 días',
        completeness: 55,
        missingFields: ['Descripción detallada', 'Fecha límite', 'Tiempo estimado'],
        description: 'Instalación de lectores biométricos',
        contactName: 'Roberto Castro',
        contactPhone: '+57 316 789 0123',
        estimatedTime: '',
        notes: ''
    }
];

// Variables globales
let currentSelectedDraft = null;
let draftToDelete = null;

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar iconos de Lucide
    if (lucide) {
        lucide.createIcons();
    }
    
    // Actualizar estadísticas
    updateStats();
    
    // Renderizar borradores
    renderDrafts();
    
    // Configurar event listeners
    setupEventListeners();
});

// Obtener clase de color para prioridad
function getPriorityClass(priority) {
    switch(priority) {
        case 'Urgente': return 'priority-urgent';
        case 'Alta': return 'priority-high';
        case 'Media': return 'priority-medium';
        case 'Baja': return 'priority-low';
        default: return 'priority-medium';
    }
}

// Obtener clase de color para completitud
function getCompletenessClass(completeness) {
    if (completeness >= 80) return 'completeness-high';
    if (completeness >= 50) return 'completeness-medium';
    return 'completeness-low';
}

// Obtener clase de color para la barra de progreso
function getProgressBarClass(completeness) {
    if (completeness >= 80) return 'progress-fill-green';
    if (completeness >= 50) return 'progress-fill-yellow';
    return 'progress-fill-red';
}

// Obtener texto de estado
function getStatusText(completeness) {
    if (completeness >= 80) return 'Listo';
    if (completeness >= 50) return 'En progreso';
    return 'Incompleto';
}

// Actualizar estadísticas en la interfaz
function updateStats() {
    const readyCount = drafts.filter(d => d.completeness >= 80).length;
    const progressCount = drafts.filter(d => d.completeness >= 50 && d.completeness < 80).length;
    const incompleteCount = drafts.filter(d => d.completeness < 50).length;
    const totalCount = drafts.length;
    
    // Actualizar contadores
    document.getElementById('total-drafts').textContent = totalCount;
    document.getElementById('ready-count').textContent = readyCount;
    document.getElementById('progress-count').textContent = progressCount;
    document.getElementById('incomplete-count').textContent = incompleteCount;
    document.getElementById('drafts-count').textContent = totalCount;
}

// Renderizar la lista de borradores
function renderDrafts() {
    const draftsList = document.getElementById('drafts-list');
    draftsList.innerHTML = '';
    
    drafts.forEach(draft => {
        const draftElement = document.createElement('div');
        draftElement.className = 'draft-card';
        draftElement.dataset.id = draft.id;
        
        draftElement.innerHTML = `
            <div class="draft-content">
                <!-- Header -->
                <div class="draft-header">
                    <div class="draft-info">
                        <div class="draft-meta">
                            <span class="draft-id">${draft.id}</span>
                            ${draft.priority ? `<span class="priority-badge ${getPriorityClass(draft.priority)}">${draft.priority}</span>` : ''}
                            <span class="draft-category">${draft.category}</span>
                            <div class="draft-time">
                                <i data-lucide="clock" class="draft-time-icon"></i>
                                <span>${draft.lastModified}</span>
                            </div>
                        </div>
                        <h3 class="draft-title">${draft.title}</h3>
                        <p class="draft-client">${draft.client}</p>
                    </div>
                    
                    <div class="draft-completeness">
                        <p class="completeness-label">Completitud</p>
                        <p class="completeness-value ${getCompletenessClass(draft.completeness)}">${draft.completeness}%</p>
                    </div>
                </div>
                
                <!-- Progress Bar -->
                <div class="progress-bar">
                    <div class="progress-fill ${getProgressBarClass(draft.completeness)}" style="width: ${draft.completeness}%"></div>
                </div>
                
                <!-- Missing Fields -->
                ${draft.missingFields.length > 0 ? `
                    <div class="missing-fields">
                        <p class="missing-fields-title">Campos pendientes por completar:</p>
                        <div class="missing-fields-list">
                            ${draft.missingFields.map(field => `<span class="missing-field-tag">${field}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Info Grid -->
                <div class="draft-details">
                    <div class="draft-detail">
                        <p class="detail-label">Creado</p>
                        <p class="detail-value">${draft.createdDate}</p>
                    </div>
                    <div class="draft-detail">
                        <p class="detail-label">Contacto</p>
                        <p class="detail-value">${draft.contactName || 'No asignado'}</p>
                    </div>
                    <div class="draft-detail">
                        <p class="detail-label">Tiempo Estimado</p>
                        <p class="detail-value">${draft.estimatedTime || 'No definido'}</p>
                    </div>
                    <div class="draft-detail">
                        <p class="detail-label">Estado</p>
                        <p class="detail-value ${getCompletenessClass(draft.completeness)}">
                            ${getStatusText(draft.completeness)}
                        </p>
                    </div>
                </div>
                
                <!-- Actions -->
                <div class="draft-actions">
                    <button class="btn btn-outline view-details-btn" data-draft-id="${draft.id}">
                        <i data-lucide="eye" class="btn-icon"></i>
                        Ver Detalles
                    </button>
                    <button class="btn btn-primary edit-draft-btn" data-draft-id="${draft.id}">
                        <i data-lucide="edit" class="btn-icon"></i>
                        Continuar Editando
                    </button>
                    <button class="btn ${draft.completeness >= 80 ? 'btn-success' : 'btn-success'} publish-draft-btn" data-draft-id="${draft.id}" ${draft.completeness < 80 ? 'disabled' : ''}>
                        <i data-lucide="send" class="btn-icon"></i>
                        Publicar
                    </button>
                    <button class="btn btn-danger btn-small delete-draft-btn" data-draft-id="${draft.id}">
                        <i data-lucide="trash-2" class="btn-icon"></i>
                    </button>
                </div>
            </div>
        `;
        
        draftsList.appendChild(draftElement);
    });
    
    // Re-inicializar iconos después de agregar nuevos elementos
    if (lucide) {
        lucide.createIcons();
    }
    
    // Agregar event listeners a los botones
    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', function() {
            const draftId = this.dataset.draftId;
            openDetailModal(draftId);
        });
    });
    
    document.querySelectorAll('.edit-draft-btn').forEach(button => {
        button.addEventListener('click', function() {
            const draftId = this.dataset.draftId;
            editDraft(draftId);
        });
    });
    
    document.querySelectorAll('.publish-draft-btn').forEach(button => {
        button.addEventListener('click', function() {
            const draftId = this.dataset.draftId;
            publishDraft(draftId);
        });
    });
    
    document.querySelectorAll('.delete-draft-btn').forEach(button => {
        button.addEventListener('click', function() {
            const draftId = this.dataset.draftId;
            openDeleteModal(draftId);
        });
    });
}

// Abrir modal de detalles
function openDetailModal(draftId) {
    const draft = drafts.find(d => d.id === draftId);
    if (!draft) return;
    
    currentSelectedDraft = draft;
    
    // Actualizar información del borrador en el modal
    document.getElementById('modal-draft-id').textContent = draft.id;
    document.getElementById('modal-draft-title').textContent = draft.title;
    
    // Actualizar prioridad
    const priorityElement = document.getElementById('modal-priority');
    priorityElement.textContent = draft.priority;
    priorityElement.className = `priority-badge ${getPriorityClass(draft.priority)}`;
    
    // Actualizar completitud
    document.getElementById('modal-completeness').textContent = `${draft.completeness}%`;
    document.getElementById('modal-completeness').className = `completeness-value ${getCompletenessClass(draft.completeness)}`;
    
    // Actualizar barra de progreso
    const progressBar = document.getElementById('modal-completeness-bar');
    progressBar.className = `completeness-fill ${getProgressBarClass(draft.completeness)}`;
    progressBar.style.width = `${draft.completeness}%`;
    
    // Actualizar campos faltantes
    const missingFieldsSection = document.getElementById('modal-missing-fields');
    if (draft.missingFields.length > 0) {
        missingFieldsSection.innerHTML = `
            <p class="missing-fields-title">Campos pendientes por completar:</p>
            <div class="missing-fields-tags">
                ${draft.missingFields.map(field => `<span class="missing-field-tag-large">${field}</span>`).join('')}
            </div>
        `;
        missingFieldsSection.style.display = 'block';
    } else {
        missingFieldsSection.style.display = 'none';
    }
    
    // Actualizar detalles
    document.getElementById('modal-client').textContent = draft.client;
    document.getElementById('modal-category').textContent = draft.category;
    document.getElementById('modal-created').textContent = draft.createdDate;
    document.getElementById('modal-modified').textContent = draft.lastModified;
    document.getElementById('modal-contact').textContent = draft.contactName || 'No asignado';
    document.getElementById('modal-phone').textContent = draft.contactPhone || 'No asignado';
    
    // Actualizar descripción
    const descriptionSection = document.getElementById('modal-description-section');
    if (draft.description) {
        descriptionSection.innerHTML = `
            <p class="section-title">Descripción</p>
            <div class="section-content">${draft.description}</div>
        `;
        descriptionSection.style.display = 'block';
    } else {
        descriptionSection.style.display = 'none';
    }
    
    // Actualizar notas
    const notesSection = document.getElementById('modal-notes-section');
    if (draft.notes) {
        notesSection.innerHTML = `
            <p class="section-title">Notas</p>
            <div class="section-content">${draft.notes}</div>
        `;
        notesSection.style.display = 'block';
    } else {
        notesSection.style.display = 'none';
    }
    
    // Actualizar botón de publicación
    const publishBtn = document.getElementById('publish-draft-btn');
    if (draft.completeness >= 80) {
        publishBtn.disabled = false;
        publishBtn.className = 'btn btn-success';
    } else {
        publishBtn.disabled = true;
        publishBtn.className = 'btn btn-success';
    }
    
    // Mostrar el modal
    document.getElementById('detail-modal').style.display = 'flex';
}

// Cerrar modal de detalles
function closeDetailModal() {
    document.getElementById('detail-modal').style.display = 'none';
    currentSelectedDraft = null;
}

// Abrir modal de eliminación
function openDeleteModal(draftId) {
    const draft = drafts.find(d => d.id === draftId);
    if (!draft) return;
    
    draftToDelete = draft;
    
    // Actualizar información en el modal
    document.getElementById('delete-draft-id').textContent = draft.id;
    document.getElementById('delete-draft-title').textContent = draft.title;
    
    // Mostrar el modal
    document.getElementById('delete-modal').style.display = 'flex';
}

// Cerrar modal de eliminación
function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    draftToDelete = null;
}

// Editar borrador
function editDraft(draftId) {
    const draft = drafts.find(d => d.id === draftId);
    if (!draft) return;
    
    alert(`Editando borrador ${draft.id}`);
    closeDetailModal();
}

// Publicar borrador
function publishDraft(draftId) {
    const draft = drafts.find(d => d.id === draftId);
    if (!draft) return;
    
    if (draft.completeness < 80) {
        alert(`El borrador necesita completar los siguientes campos antes de publicar:\n${draft.missingFields.join('\n')}`);
    } else {
        alert(`Borrador ${draft.id} publicado como caso activo`);
        if (currentSelectedDraft) {
            closeDetailModal();
        }
    }
}

// Eliminar borrador
function deleteDraft() {
    if (!draftToDelete) return;
    
    // Simular eliminación
    alert(`Borrador ${draftToDelete.id} eliminado`);
    closeDeleteModal();
    
    // En una aplicación real, aquí eliminarías el borrador del array y actualizarías la interfaz
    // Por ahora, solo mostramos un mensaje
}

// Configurar event listeners
function setupEventListeners() {
    // Botones del modal de detalles
    document.getElementById('close-detail-modal').addEventListener('click', closeDetailModal);
    document.getElementById('continue-editing-btn').addEventListener('click', function() {
        if (currentSelectedDraft) {
            editDraft(currentSelectedDraft.id);
        }
    });
    document.getElementById('publish-draft-btn').addEventListener('click', function() {
        if (currentSelectedDraft) {
            publishDraft(currentSelectedDraft.id);
        }
    });
    document.getElementById('close-modal-btn').addEventListener('click', closeDetailModal);
    
    // Botones del modal de eliminación
    document.getElementById('cancel-delete-btn').addEventListener('click', closeDeleteModal);
    document.getElementById('confirm-delete-btn').addEventListener('click', deleteDraft);
    
    // Cerrar modales al hacer clic fuera de ellos
    document.getElementById('detail-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeDetailModal();
        }
    });
    
    document.getElementById('delete-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeDeleteModal();
        }
    });
    
    // Barra de búsqueda
    document.getElementById('search-input').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        // Filtrar borradores
        const filteredDrafts = drafts.filter(draft => 
            draft.title.toLowerCase().includes(searchTerm) ||
            draft.client.toLowerCase().includes(searchTerm) ||
            draft.id.toLowerCase().includes(searchTerm) ||
            draft.category.toLowerCase().includes(searchTerm)
        );
        
        // Actualizar estadísticas con resultados filtrados
        const readyCount = filteredDrafts.filter(d => d.completeness >= 80).length;
        const progressCount = filteredDrafts.filter(d => d.completeness >= 50 && d.completeness < 80).length;
        const incompleteCount = filteredDrafts.filter(d => d.completeness < 50).length;
        
        document.getElementById('total-drafts').textContent = filteredDrafts.length;
        document.getElementById('ready-count').textContent = readyCount;
        document.getElementById('progress-count').textContent = progressCount;
        document.getElementById('incomplete-count').textContent = incompleteCount;
        document.getElementById('drafts-count').textContent = filteredDrafts.length;
        
        // En una aplicación real, aquí renderizarías solo los borradores filtrados
        // Por ahora, solo actualizamos las estadísticas
    });
}