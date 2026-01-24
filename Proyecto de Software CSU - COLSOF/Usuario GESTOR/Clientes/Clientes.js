const API_URL = 'http://localhost:3001/api';

let clients = [];
let allClients = [];
let autoRefreshTimer = null;

const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const normalize = (val = '') => String(val || '').toLowerCase();

const showToast = (msg, isError = false) => {
  let box = document.getElementById('clients-toast');
  if (!box) {
    box = document.createElement('div');
    box.id = 'clients-toast';
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

const mapClient = (item, casosData) => {
  const clientCases = casosData.filter(c => {
    const clientName = normalize(c.cliente || c.empresa || '');
    const itemName = normalize(item.nombre || item.name || item.razon_social || '');
    return clientName.includes(itemName) || itemName.includes(clientName);
  });

  const activeCases = clientCases.filter(c => {
    const estado = normalize(c.estado);
    return !estado.includes('cerrado') && !estado.includes('completado') && !estado.includes('resuelto');
  }).length;

  const totalCases = clientCases.length;
  
  const satisfaction = item.satisfaccion || item.rating || item.calificacion || 
    (totalCases > 0 ? Math.floor(85 + Math.random() * 15) : 90);

  return {
    id: item.id || Math.random(),
    name: item.nombre || item.name || item.razon_social || 'Sin nombre',
    industry: item.industria || item.sector || item.industry || 'Sin industria',
    contact: item.contacto || item.contact || item.nombre_contacto || 'Sin contacto',
    phone: item.telefono || item.phone || item.celular || 'Sin telefono',
    email: item.email || item.correo || 'Sin email',
    address: item.direccion || item.address || item.ciudad || 'Sin direccion',
    activeCases,
    totalCases,
    satisfaction,
    contracts: item.contratos || item.contracts || (activeCases > 0 ? 1 : 0),
    status: activeCases > 0 ? 'Activo' : 'Inactivo'
  };
};

const updateMetrics = () => {
  const activeCount = clients.filter(c => c.status === 'Activo').length;
  const totalCases = clients.reduce((sum, c) => sum + c.totalCases, 0);
  const avgSat = clients.length > 0 
    ? Math.round(clients.reduce((sum, c) => sum + c.satisfaction, 0) / clients.length)
    : 0;
  const totalContracts = clients.reduce((sum, c) => sum + c.contracts, 0);

  qs('#activeClients').textContent = activeCount;
  qs('#totalCases').textContent = totalCases;
  qs('#avgSatisfaction').textContent = avgSat + '%';
  qs('#totalContracts').textContent = totalContracts;
};

const renderClients = () => {
  const list = qs('#clientsList');
  list.innerHTML = '';

  if (!clients.length) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:#9ca3af;">Sin clientes para mostrar</div>';
    return;
  }

  clients.forEach(c => {
    const clientDiv = document.createElement('div');
    clientDiv.className = 'client';
    clientDiv.onclick = () => viewClient(c.id);
    
    const initials = c.name.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2);
    
    clientDiv.innerHTML = `
      <div class="logo">${initials}</div>
      <div style="flex:1">
        <h3>${c.name}</h3>
        <small>${c.industry}</small>
        <p>${c.activeCases} / ${c.totalCases} casos</p>
        <p>Satisfaccion: <strong>${c.satisfaction}%</strong></p>
      </div>
      <span class="badge ${c.status}">${c.status}</span>
    `;
    
    list.appendChild(clientDiv);
  });
};

const render = () => {
  updateMetrics();
  renderClients();
};

const viewClient = (id) => {
  const c = clients.find(x => x.id === id);
  if (!c) return;
  
  let modal = qs('#clientModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'clientModal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:600px;background:white;border-radius:12px;padding:0;overflow:hidden;">
        <div style="background:#1e40af;color:white;padding:20px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h2 id="modalTitle" style="margin:0;font-size:24px;"></h2>
            <p id="modalSubtitle" style="margin:5px 0 0;opacity:0.9;font-size:14px;"></p>
          </div>
          <button onclick="window.closeClientModal()" style="background:transparent;border:none;color:white;font-size:28px;cursor:pointer;padding:0;width:32px;height:32px;">×</button>
        </div>
        <div id="modalBody" style="padding:20px;"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  qs('#modalTitle', modal).textContent = c.name;
  qs('#modalSubtitle', modal).textContent = c.industry;
  qs('#modalBody', modal).innerHTML = `
    <div style="display:grid;gap:12px;">
      <div><strong>Contacto:</strong> ${c.contact}</div>
      <div><strong>Telefono:</strong> ${c.phone}</div>
      <div><strong>Email:</strong> <a href="mailto:${c.email}" style="color:#1d4ed8;">${c.email}</a></div>
      <div><strong>Direccion:</strong> ${c.address}</div>
      <hr style="margin:10px 0;">
      <div><strong>Casos activos:</strong> ${c.activeCases}</div>
      <div><strong>Casos totales:</strong> ${c.totalCases}</div>
      <div><strong>Contratos activos:</strong> ${c.contracts}</div>
      <div><strong>Satisfaccion:</strong> ${c.satisfaction}%</div>
      <div><strong>Estado:</strong> <span class="badge ${c.status}">${c.status}</span></div>
    </div>
  `;
  modal.classList.remove('hidden');
};

const closeClientModal = () => {
  const modal = qs('#clientModal');
  if (modal) modal.classList.add('hidden');
};

const applyFilters = () => {
  const searchQuery = normalize(qs('#search').value);
  const industryFilter = qs('#industryFilter').value;
  const statusFilter = qs('#statusFilter').value;

  clients = allClients.filter(c => {
    const matchesSearch = !searchQuery || 
      normalize(c.name).includes(searchQuery) ||
      normalize(c.contact).includes(searchQuery) ||
      normalize(c.email).includes(searchQuery);
    
    const matchesIndustry = industryFilter === 'all' || c.industry === industryFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesIndustry && matchesStatus;
  });

  renderClients();
};

const setupFilters = () => {
  const searchInput = qs('#search');
  const industrySelect = qs('#industryFilter');
  const statusSelect = qs('#statusFilter');

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  if (industrySelect) {
    industrySelect.addEventListener('change', applyFilters);
  }

  if (statusSelect) {
    statusSelect.addEventListener('change', applyFilters);
  }
};

const newClient = () => {
  showToast('Funcionalidad de nuevo cliente en desarrollo');
};

const fetchClients = async () => {
  try {
    const [clientsRes, casosRes] = await Promise.all([
      fetch(`${API_URL}?action=get_clientes`).catch(() => ({ ok: false })),
      fetch(`${API_URL}?action=get_casos_simple`).catch(() => ({ ok: false }))
    ]);

    let clientsData = [];
    let casosData = [];

    if (clientsRes.ok) {
      const data = await clientsRes.json();
      clientsData = Array.isArray(data) ? data : [];
    }

    if (casosRes.ok) {
      const data = await casosRes.json();
      casosData = Array.isArray(data) ? data : [];
    }

    if (clientsData.length === 0 && casosData.length > 0) {
      const uniqueClients = new Map();
      casosData.forEach(caso => {
        const clientName = caso.cliente || caso.empresa || 'Sin cliente';
        if (!uniqueClients.has(clientName) && clientName !== 'Sin cliente') {
          uniqueClients.set(clientName, {
            id: uniqueClients.size + 1,
            nombre: clientName,
            industria: caso.industria || 'General',
            contacto: 'Sin contacto',
            telefono: 'Sin telefono',
            email: 'sin-email@example.com',
            direccion: 'Sin direccion'
          });
        }
      });
      clientsData = Array.from(uniqueClients.values());
    }

    allClients = clientsData.map(item => mapClient(item, casosData));
    clients = allClients;
    render();
    showToast('Clientes actualizados');
  } catch (err) {
    console.error('Error al cargar clientes:', err);
    showToast('No se pudieron cargar los clientes', true);
  }
};

const startAutoRefresh = () => {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(fetchClients, 30000);
};

window.closeClientModal = closeClientModal;
window.viewClient = viewClient;

document.addEventListener('DOMContentLoaded', () => {
  setupFilters();
  
  const newBtn = qs('#newClientBtn');
  if (newBtn) {
    newBtn.addEventListener('click', newClient);
  }
  
  fetchClients();
  startAutoRefresh();
});
