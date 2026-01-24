const API_URL = 'http://localhost:3001/api';
let allCenters = [];
let allCases = [];
let searchQuery = '';
let statusFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  setupAutoRefresh();
  fetchData();
});

function setupEventListeners() {
  const searchInput = document.getElementById('search');
  const statusSelect = document.getElementById('statusFilter');
  const logoutBtn = document.querySelector('.logout-btn');
  const newBtn = document.getElementById('newBtn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      applyFilters();
    });
  }

  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      statusFilter = e.target.value;
      applyFilters();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.location.href = '../../index.html';
    });
  }

  if (newBtn) {
    newBtn.addEventListener('click', () => {
      showToast('Funcionalidad de busqueda avanzada en desarrollo', 'info');
    });
  }
}

function setupAutoRefresh() {
  setInterval(() => {
    fetchData(true);
  }, 30000);
}

async function fetchData(silent = false) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_casos_simple' })
    });

    if (!response.ok) throw new Error('Error al obtener datos');

    const data = await response.json();
    
    if (data.success && Array.isArray(data.data)) {
      allCases = data.data.map(mapCase);
      buildCentersFromCases();
      updateMetrics();
      applyFilters();
      
      if (!silent) {
        showToast('Datos actualizados correctamente', 'success');
      }
    } else {
      throw new Error('Formato de respuesta invalido');
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('Error al cargar datos: ' + error.message, 'error');
    allCenters = [];
    renderTable([]);
    updateMetrics();
  }
}

function mapCase(caso) {
  return {
    id: caso.id || '',
    titulo: caso.titulo || caso.title || 'Sin titulo',
    cliente: caso.cliente || caso.client || caso.empresa || 'Sin cliente',
    categoria: caso.categoria || caso.category || 'General',
    prioridad: caso.prioridad || caso.priority || 'Media',
    estado: caso.estado || caso.status || 'Pendiente',
    tecnico: caso.tecnico_asignado || caso.technician || caso.tecnico || 'Sin asignar',
    fecha: caso.fecha_creacion || caso.created_at || caso.fecha || new Date().toISOString(),
    descripcion: caso.descripcion || caso.description || '',
    centro_costos: caso.centro_costos || caso.cost_center || '',
    presupuesto: parseFloat(caso.presupuesto || caso.budget || 0),
    costo_ejecutado: parseFloat(caso.costo_ejecutado || caso.spent || 0)
  };
}

function buildCentersFromCases() {
  const centerMap = new Map();

  allCases.forEach(caso => {
    let centerName = caso.centro_costos || `Centro - ${caso.cliente}`;
    let centerId = centerName.replace(/\s+/g, '-').toUpperCase();

    if (!centerMap.has(centerId)) {
      centerMap.set(centerId, {
        id: centerId,
        name: centerName,
        client: caso.cliente,
        budget: 0,
        spent: 0,
        cases: [],
        responsible: caso.tecnico || 'Sin asignar'
      });
    }

    const center = centerMap.get(centerId);
    center.cases.push(caso);
    center.budget += caso.presupuesto;
    center.spent += caso.costo_ejecutado;
  });

  allCenters = Array.from(centerMap.values()).map(center => {
    const progress = center.budget > 0 ? (center.spent / center.budget) * 100 : 0;
    let status = 'Activo';
    
    if (progress >= 98) {
      status = 'Completado';
    } else if (progress >= 85) {
      status = 'Alerta';
    }

    const activeCases = center.cases.filter(c => 
      c.estado !== 'Cerrado' && c.estado !== 'Completado'
    ).length;

    return {
      ...center,
      status,
      progress,
      activeCases,
      totalCases: center.cases.length
    };
  });

  if (allCenters.length === 0) {
    const uniqueClients = [...new Set(allCases.map(c => c.cliente))];
    
    allCenters = uniqueClients.map((client, idx) => {
      const clientCases = allCases.filter(c => c.cliente === client);
      const budget = clientCases.reduce((sum, c) => sum + c.presupuesto, 0);
      const spent = clientCases.reduce((sum, c) => sum + c.costo_ejecutado, 0);
      const progress = budget > 0 ? (spent / budget) * 100 : 0;
      
      let status = 'Activo';
      if (progress >= 98) status = 'Completado';
      else if (progress >= 85) status = 'Alerta';

      const activeCases = clientCases.filter(c => 
        c.estado !== 'Cerrado' && c.estado !== 'Completado'
      ).length;

      return {
        id: `CC-${new Date().getFullYear()}-${String(idx + 1).padStart(3, '0')}`,
        name: `Centro de Costos ${client}`,
        client,
        budget,
        spent,
        cases: clientCases,
        status,
        progress,
        activeCases,
        totalCases: clientCases.length,
        responsible: clientCases[0]?.tecnico || 'Sin asignar'
      };
    });
  }
}

function updateMetrics() {
  const totalBudget = allCenters.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = allCenters.reduce((sum, c) => sum + c.spent, 0);
  const activeCenters = allCenters.filter(c => c.status === 'Activo').length;
  const totalCases = allCenters.reduce((sum, c) => sum + c.totalCases, 0);

  document.getElementById('totalBudget').textContent = formatCurrency(totalBudget);
  document.getElementById('totalSpent').textContent = formatCurrency(totalSpent);
  document.getElementById('activeCenters').textContent = activeCenters;
  document.getElementById('totalCases').textContent = totalCases;
}

function applyFilters() {
  let filtered = allCenters.filter(center => {
    const matchesSearch = searchQuery === '' || 
      normalize(center.name).includes(normalize(searchQuery)) ||
      normalize(center.client).includes(normalize(searchQuery)) ||
      normalize(center.id).includes(normalize(searchQuery)) ||
      normalize(center.responsible).includes(normalize(searchQuery));

    const matchesStatus = statusFilter === 'all' || center.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  renderTable(filtered);
}

function renderTable(centers) {
  const tbody = document.getElementById('tableBody');
  
  if (!tbody) return;

  if (centers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2rem; color: #666;">
          No se encontraron centros de costos
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = centers.map(center => {
    const progress = Math.round(center.progress);
    const progressColor = getProgressColor(progress);
    const available = center.budget - center.spent;

    return `
      <tr>
        <td><strong>${escapeHtml(center.id)}</strong></td>
        <td>
          <strong>${escapeHtml(center.name)}</strong><br>
          <small style="color: #666;">${escapeHtml(center.client)}</small>
        </td>
        <td>${formatCurrency(center.budget)}</td>
        <td>${formatCurrency(center.spent)}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="min-width: 35px;">${progress}%</span>
            <div class="progress-bar" style="flex: 1; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
              <div style="width: ${Math.min(progress, 100)}%; height: 100%; background: ${progressColor}; transition: width 0.3s;"></div>
            </div>
          </div>
        </td>
        <td>
          <span style="color: #1976d2; font-weight: 500;">${center.activeCases}</span>
          <span style="color: #666;"> / ${center.totalCases}</span>
        </td>
        <td><span class="badge badge-${center.status.toLowerCase()}">${escapeHtml(center.status)}</span></td>
        <td>${escapeHtml(center.responsible)}</td>
        <td>
          <button onclick="viewCenter('${escapeHtml(center.id)}')" 
                  style="background: #1976d2; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 14px;"
                  title="Ver detalles">
            👁️ Ver
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function viewCenter(centerId) {
  const center = allCenters.find(c => c.id === centerId);
  
  if (!center) {
    showToast('Centro de costos no encontrado', 'error');
    return;
  }

  const available = center.budget - center.spent;
  const progress = Math.round(center.progress);
  
  const casesBreakdown = center.cases.reduce((acc, caso) => {
    acc[caso.estado] = (acc[caso.estado] || 0) + 1;
    return acc;
  }, {});

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
      <div class="modal-header" style="background: #1976d2; color: white; padding: 1.5rem; margin: -1.5rem -1.5rem 1.5rem;">
        <h2 style="margin: 0; font-size: 1.3rem;">📊 ${escapeHtml(center.name)}</h2>
      </div>
      
      <div style="display: grid; gap: 1.5rem;">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
          <div>
            <p style="margin: 0; color: #666; font-size: 0.9rem;">ID Centro</p>
            <p style="margin: 0.25rem 0 0; font-weight: 600;">${escapeHtml(center.id)}</p>
          </div>
          <div>
            <p style="margin: 0; color: #666; font-size: 0.9rem;">Cliente</p>
            <p style="margin: 0.25rem 0 0; font-weight: 600;">${escapeHtml(center.client)}</p>
          </div>
          <div>
            <p style="margin: 0; color: #666; font-size: 0.9rem;">Responsable</p>
            <p style="margin: 0.25rem 0 0; font-weight: 600;">${escapeHtml(center.responsible)}</p>
          </div>
          <div>
            <p style="margin: 0; color: #666; font-size: 0.9rem;">Estado</p>
            <p style="margin: 0.25rem 0 0;">
              <span class="badge badge-${center.status.toLowerCase()}">${escapeHtml(center.status)}</span>
            </p>
          </div>
        </div>

        <div style="border-top: 1px solid #e0e0e0; padding-top: 1rem;">
          <h3 style="margin: 0 0 1rem; font-size: 1.1rem; color: #333;">💰 Información Financiera</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
            <div style="background: #e3f2fd; padding: 1rem; border-radius: 8px;">
              <p style="margin: 0; color: #1976d2; font-size: 0.85rem; font-weight: 600;">PRESUPUESTO</p>
              <p style="margin: 0.5rem 0 0; font-size: 1.3rem; font-weight: 700; color: #0d47a1;">${formatCurrency(center.budget)}</p>
            </div>
            <div style="background: #fff3e0; padding: 1rem; border-radius: 8px;">
              <p style="margin: 0; color: #f57c00; font-size: 0.85rem; font-weight: 600;">EJECUTADO</p>
              <p style="margin: 0.5rem 0 0; font-size: 1.3rem; font-weight: 700; color: #e65100;">${formatCurrency(center.spent)}</p>
            </div>
            <div style="background: ${available >= 0 ? '#e8f5e9' : '#ffebee'}; padding: 1rem; border-radius: 8px;">
              <p style="margin: 0; color: ${available >= 0 ? '#388e3c' : '#c62828'}; font-size: 0.85rem; font-weight: 600;">DISPONIBLE</p>
              <p style="margin: 0.5rem 0 0; font-size: 1.3rem; font-weight: 700; color: ${available >= 0 ? '#1b5e20' : '#b71c1c'};">${formatCurrency(available)}</p>
            </div>
            <div style="background: #f3e5f5; padding: 1rem; border-radius: 8px;">
              <p style="margin: 0; color: #7b1fa2; font-size: 0.85rem; font-weight: 600;">EJECUCIÓN</p>
              <p style="margin: 0.5rem 0 0; font-size: 1.3rem; font-weight: 700; color: #4a148c;">${progress}%</p>
            </div>
          </div>
        </div>

        <div style="border-top: 1px solid #e0e0e0; padding-top: 1rem;">
          <h3 style="margin: 0 0 1rem; font-size: 1.1rem; color: #333;">📋 Casos Asociados (${center.totalCases})</h3>
          <div style="display: grid; gap: 0.5rem;">
            ${Object.entries(casesBreakdown).map(([estado, count]) => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f5f5f5; border-radius: 4px;">
                <span style="font-weight: 500;">${escapeHtml(estado)}</span>
                <span style="background: #1976d2; color: white; padding: 2px 10px; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">${count}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="border-top: 1px solid #e0e0e0; padding-top: 1rem;">
          <h3 style="margin: 0 0 0.75rem; font-size: 1.1rem; color: #333;">📈 Progreso de Ejecución</h3>
          <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="font-weight: 500;">Progreso actual</span>
              <span style="font-weight: 700; color: ${getProgressColor(progress)};">${progress}%</span>
            </div>
            <div style="width: 100%; height: 16px; background: #e0e0e0; border-radius: 8px; overflow: hidden;">
              <div style="width: ${Math.min(progress, 100)}%; height: 100%; background: ${getProgressColor(progress)}; transition: width 0.5s;"></div>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem;">
          <button onclick="this.closest('.modal-overlay').remove()" 
                  style="background: #666; color: white; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-weight: 500;">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  document.body.appendChild(modal);
}

function getProgressColor(progress) {
  if (progress >= 90) return '#d32f2f';
  if (progress >= 75) return '#f57c00';
  if (progress >= 50) return '#fbc02d';
  return '#388e3c';
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function normalize(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '12px 24px',
    background: type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3',
    color: 'white',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    zIndex: '10000',
    animation: 'slideIn 0.3s ease'
  });

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .modal-content {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    animation: scaleIn 0.3s ease;
  }
  @keyframes scaleIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  .badge-activo {
    background: #e8f5e9;
    color: #2e7d32;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
  }
  .badge-alerta {
    background: #fff3e0;
    color: #e65100;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
  }
  .badge-completado {
    background: #e3f2fd;
    color: #1565c0;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
  }
`;
document.head.appendChild(style);
