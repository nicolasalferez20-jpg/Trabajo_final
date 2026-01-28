// ============ DATOS DE CLIENTES ============

let clientsData = [
  { id: 1, nombre: 'Banco Atlántico', email: 'contact@bancoatlantico.com', telefono: '584161234567', industria: 'Banca', ciudad: 'Caracas', direccion: 'Av. Principal #100', contacto: 'Carlos Mendez', estado: 'Activo', casosTotales: 24, satisfaccion: 92, contratos: 3 },
  { id: 2, nombre: 'Distribuidora Nacional', email: 'info@distnacional.com', telefono: '584261234567', industria: 'Distribución', ciudad: 'Valencia', direccion: 'Calle 5 #200', contacto: 'Ana García', estado: 'Activo', casosTotales: 15, satisfaccion: 85, contratos: 2 },
  { id: 3, nombre: 'Hospital Central', email: 'it@hospitalcentral.com', telefono: '584361234567', industria: 'Salud', ciudad: 'Maracaibo', direccion: 'Av. Salud #50', contacto: 'Dr. López', estado: 'Activo', casosTotales: 32, satisfaccion: 88, contratos: 5 },
  { id: 4, nombre: 'Universidad Técnica', email: 'soporte@univtecnica.com', telefono: '584461234567', industria: 'Educación', ciudad: 'Barquisimeto', direccion: 'Zona Universitaria #1', contacto: 'Prof. Torres', estado: 'Inactivo', casosTotales: 8, satisfaccion: 78, contratos: 1 },
  { id: 5, nombre: 'Petroven Solutions', email: 'admin@petrovensol.com', telefono: '584561234567', industria: 'Energía', ciudad: 'Anzoátegui', direccion: 'Parque Industrial #15', contacto: 'Ing. Rodríguez', estado: 'Activo', casosTotales: 28, satisfaccion: 90, contratos: 4 },
  { id: 6, nombre: 'TeleVenezuela Inc', email: 'support@televzla.com', telefono: '584661234567', industria: 'Telecomunicaciones', ciudad: 'Caracas', direccion: 'Centro Empresarial #25', contacto: 'Javier Pérez', estado: 'Activo', casosTotales: 45, satisfaccion: 87, contratos: 6 },
  { id: 7, nombre: 'Alimentos Frescos S.A.', email: 'itsupport@alimentosfrescos.com', telefono: '584761234567', industria: 'Alimentos', ciudad: 'Valencia', direccion: 'Zona Industrial Sur', contacto: 'María Díaz', estado: 'Activo', casosTotales: 12, satisfaccion: 83, contratos: 2 },
];

let casosRelacionados = {
  1: [
    { numero: 'CASO-001', asunto: 'Falla en sistema de autenticación', estado: 'Cerrado' },
    { numero: 'CASO-002', asunto: 'Mantenimiento preventivo', estado: 'En Progreso' },
    { numero: 'CASO-003', asunto: 'Actualización de software', estado: 'Cerrado' }
  ],
  2: [
    { numero: 'CASO-004', asunto: 'Configuración de red', estado: 'Cerrado' },
    { numero: 'CASO-005', asunto: 'Backup y recuperación', estado: 'En Progreso' }
  ],
  3: [
    { numero: 'CASO-006', asunto: 'Sistema de historiales médicos', estado: 'En Progreso' },
    { numero: 'CASO-007', asunto: 'Seguridad de datos pacientes', estado: 'En Progreso' },
    { numero: 'CASO-008', asunto: 'Conectividad de dispositivos', estado: 'Cerrado' }
  ]
};

// ============ VARIABLES GLOBALES ============

let clientesFiltered = [];
let clienteActual = null;
let modoEdicion = false;

// ============ INICIALIZACIÓN ============

document.addEventListener('DOMContentLoaded', function() {
  console.log('📦 Inicializando módulo de Clientes');
  
  cargarClientes();
  calcularKPIs();
  inicializarEventos();
  
  console.log('✅ Módulo de Clientes inicializado');
});

// ============ CARGAR Y MOSTRAR CLIENTES ============

function cargarClientes() {
  console.log('📖 Cargando clientes...');
  
  try {
    // Intentar obtener del API
    if (window.api && window.api.getClientes) {
      window.api.getClientes().then(clientes => {
        if (clientes && clientes.length > 0) {
          clientsData = clientes;
          mostrarClientes(clientsData);
        } else {
          mostrarClientes(clientsData);
        }
      }).catch(() => mostrarClientes(clientsData));
    } else {
      mostrarClientes(clientsData);
    }
  } catch (error) {
    console.error('❌ Error cargando clientes:', error);
    mostrarClientes(clientsData);
  }
}

function mostrarClientes(clientes) {
  console.log('🔧 Mostrando', clientes.length, 'clientes');
  
  const container = document.querySelector('.clients-grid') || crearGridContenedor();
  clientesFiltered = clientes;
  
  if (clientes.length === 0) {
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #9ca3af;">No se encontraron clientes</div>';
    return;
  }
  
  container.innerHTML = clientes.map(cliente => `
    <div class="client-card" data-id="${cliente.id}">
      <div class="client-header">
        <div class="client-icon">
          <i class="fas fa-building"></i>
        </div>
        <div class="client-info" style="flex: 1;">
          <p class="client-name">${cliente.nombre}</p>
          <p class="client-industry">${cliente.industria || 'General'}</p>
        </div>
        <span class="client-status ${cliente.estado === 'Activo' ? 'status-activo' : 'status-inactivo'}">
          <i class="fas fa-${cliente.estado === 'Activo' ? 'check-circle' : 'times-circle'}"></i>
          ${cliente.estado}
        </span>
      </div>
      
      <div class="client-details-quick">
        <div class="detail-item">
          <i class="fas fa-envelope"></i>
          <span>${cliente.email || 'No disponible'}</span>
        </div>
        <div class="detail-item">
          <i class="fas fa-phone"></i>
          <span>${cliente.telefono || 'No disponible'}</span>
        </div>
        <div class="detail-item">
          <i class="fas fa-map-marker-alt"></i>
          <span>${cliente.ciudad || 'No especificada'}</span>
        </div>
      </div>
      
      <div class="client-stats">
        <div class="stat">
          <div class="stat-value">${cliente.casosTotales || 0}</div>
          <div class="stat-label">Casos</div>
        </div>
        <div class="stat">
          <div class="stat-value">${cliente.satisfaccion || 0}%</div>
          <div class="stat-label">Satisfacción</div>
        </div>
      </div>
      
      <div class="client-actions">
        <button class="btn-client primary" onclick="abrirCliente(${cliente.id})">
          <i class="fas fa-eye"></i> Ver Detalles
        </button>
        <button class="btn-client" onclick="editarCliente(${cliente.id})">
          <i class="fas fa-edit"></i> Editar
        </button>
      </div>
    </div>
  `).join('');
  
  // Agregar evento de clic a tarjetas
  document.querySelectorAll('.client-card').forEach(card => {
    card.addEventListener('click', function(e) {
      if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
        abrirCliente(this.dataset.id);
      }
    });
  });
}

function crearGridContenedor() {
  let grid = document.querySelector('.clients-grid');
  if (!grid) {
    const main = document.querySelector('main') || document.body;
    grid = document.createElement('div');
    grid.className = 'clients-grid';
    const kpiSection = document.querySelector('.kpis');
    if (kpiSection) {
      kpiSection.insertAdjacentElement('afterend', grid);
    } else {
      main.appendChild(grid);
    }
  }
  return grid;
}

// ============ FILTRADO Y BÚSQUEDA ============

function filtrarClientes() {
  const searchValue = document.querySelector('#search')?.value.toLowerCase() || '';
  const industryValue = document.querySelector('#industryFilter')?.value || '';
  const statusValue = document.querySelector('#statusFilter')?.value || '';
  
  const filtered = clientsData.filter(cliente => {
    const matchSearch = cliente.nombre.toLowerCase().includes(searchValue) ||
                        cliente.email.toLowerCase().includes(searchValue) ||
                        cliente.ciudad.toLowerCase().includes(searchValue);
    
    const matchIndustry = !industryValue || cliente.industria === industryValue;
    const matchStatus = !statusValue || cliente.estado === statusValue;
    
    return matchSearch && matchIndustry && matchStatus;
  });
  
  console.log('🔍 Filtrados:', filtered.length, 'de', clientsData.length);
  mostrarClientes(filtered);
}

// ============ CÁLCULO DE KPIs ============

function calcularKPIs() {
  console.log('📊 Calculando KPIs...');
  
  const clientesActivos = clientsData.filter(c => c.estado === 'Activo').length;
  const totalCasos = clientsData.reduce((sum, c) => sum + (c.casosTotales || 0), 0);
  const satisfaccionPromedio = Math.round(
    clientsData.reduce((sum, c) => sum + (c.satisfaccion || 0), 0) / clientsData.length
  );
  const totalContratos = clientsData.reduce((sum, c) => sum + (c.contratos || 0), 0);
  
  const elementos = {
    '#activeClients': clientesActivos,
    '#totalCases': totalCasos,
    '#avgSatisfaction': satisfaccionPromedio,
    '#totalContracts': totalContratos
  };
  
  Object.entries(elementos).forEach(([selector, valor]) => {
    const elem = document.querySelector(selector);
    if (elem) elem.textContent = valor;
  });
}

// ============ MODALES - VISUALIZAR CLIENTE ============

function abrirCliente(clienteId) {
  console.log('👁️  Abriendo cliente:', clienteId);
  
  const cliente = clientsData.find(c => c.id == clienteId);
  if (!cliente) return;
  
  clienteActual = cliente;
  modoEdicion = false;
  
  const modal = document.querySelector('#clientModal');
  const detalles = document.querySelector('#clientDetails');
  const casesList = document.querySelector('#clientCases');
  
  if (detalles) {
    detalles.innerHTML = `
      <div class="detail-group">
        <div class="detail-label">Nombre</div>
        <div class="detail-value">${cliente.nombre}</div>
      </div>
      <div class="detail-group">
        <div class="detail-label">Email</div>
        <div class="detail-value">${cliente.email}</div>
      </div>
      <div class="detail-group">
        <div class="detail-label">Teléfono</div>
        <div class="detail-value">${cliente.telefono}</div>
      </div>
      <div class="detail-group">
        <div class="detail-label">Industria</div>
        <div class="detail-value">${cliente.industria}</div>
      </div>
      <div class="detail-group">
        <div class="detail-label">Dirección</div>
        <div class="detail-value">${cliente.direccion}</div>
      </div>
      <div class="detail-group">
        <div class="detail-label">Ciudad</div>
        <div class="detail-value">${cliente.ciudad}</div>
      </div>
      <div class="detail-group">
        <div class="detail-label">Contacto Principal</div>
        <div class="detail-value">${cliente.contacto}</div>
      </div>
      <div class="detail-group">
        <div class="detail-label">Estado</div>
        <div class="detail-value">
          <span class="client-status ${cliente.estado === 'Activo' ? 'status-activo' : 'status-inactivo'}">
            ${cliente.estado}
          </span>
        </div>
      </div>
    `;
  }
  
  if (casesList) {
    const casos = casosRelacionados[clienteId] || [];
    if (casos.length === 0) {
      casesList.innerHTML = '<p style="color: #9ca3af; font-style: italic;">No hay casos registrados</p>';
    } else {
      casesList.innerHTML = casos.map(caso => `
        <div class="case-item">
          <div>
            <strong>${caso.numero}</strong><br>
            <span style="color: #6b7280;">${caso.asunto}</span>
          </div>
          <span class="case-badge" style="background: ${caso.estado === 'Cerrado' ? '#d1fae5' : '#fef3c7'}; color: ${caso.estado === 'Cerrado' ? '#065f46' : '#92400e'};">
            ${caso.estado}
          </span>
        </div>
      `).join('');
    }
  }
  
  modal?.classList.add('active');
}

function cerrarModal(modalId) {
  console.log('❌ Cerrando modal:', modalId);
  const modal = document.querySelector(modalId);
  if (modal) modal.classList.remove('active');
}

// ============ MODALES - EDITAR/CREAR CLIENTE ============

function editarCliente(clienteId) {
  console.log('✏️  Editando cliente:', clienteId);
  
  const cliente = clientsData.find(c => c.id == clienteId);
  if (!cliente) return;
  
  clienteActual = cliente;
  modoEdicion = true;
  
  const modal = document.querySelector('#editClientModal');
  if (modal) {
    document.querySelector('#clientName').value = cliente.nombre;
    document.querySelector('#clientEmail').value = cliente.email;
    document.querySelector('#clientPhone').value = cliente.telefono;
    document.querySelector('#clientIndustry').value = cliente.industria;
    document.querySelector('#clientAddress').value = cliente.direccion;
    document.querySelector('#clientCity').value = cliente.ciudad;
    document.querySelector('#clientContact').value = cliente.contacto;
    document.querySelector('#clientStatus').value = cliente.estado;
    
    modal.classList.add('active');
  }
}

function abrirFormularioNuevo() {
  console.log('➕ Abriendo formulario nuevo cliente');
  
  clienteActual = null;
  modoEdicion = true;
  
  const modal = document.querySelector('#editClientModal');
  if (modal) {
    document.querySelector('#clientForm').reset();
    modal.classList.add('active');
  }
}

// ============ GUARDAR CLIENTE ============

function guardarCliente(event) {
  event.preventDefault();
  console.log('💾 Guardando cliente...');
  
  const nombre = document.querySelector('#clientName')?.value;
  const email = document.querySelector('#clientEmail')?.value;
  const telefono = document.querySelector('#clientPhone')?.value;
  const industria = document.querySelector('#clientIndustry')?.value;
  const direccion = document.querySelector('#clientAddress')?.value;
  const ciudad = document.querySelector('#clientCity')?.value;
  const contacto = document.querySelector('#clientContact')?.value;
  const estado = document.querySelector('#clientStatus')?.value;
  
  // Validación
  if (!nombre || !email || !industria) {
    mostrarToast('Por favor complete los campos requeridos', 'error');
    return;
  }
  
  if (clienteActual) {
    // Actualizar cliente existente
    Object.assign(clienteActual, {
      nombre, email, telefono, industria, direccion, ciudad, contacto, estado
    });
    console.log('✅ Cliente actualizado');
    mostrarToast('Cliente actualizado exitosamente', 'success');
  } else {
    // Crear nuevo cliente
    const nuevoCliente = {
      id: Math.max(...clientsData.map(c => c.id), 0) + 1,
      nombre, email, telefono, industria, direccion, ciudad, contacto, estado: estado || 'Activo',
      casosTotales: 0, satisfaccion: 85, contratos: 0
    };
    clientsData.push(nuevoCliente);
    console.log('✅ Nuevo cliente creado:', nuevoCliente.id);
    mostrarToast('Cliente creado exitosamente', 'success');
  }
  
  cerrarModal('#editClientModal');
  calcularKPIs();
  filtrarClientes();
}

// ============ EVENTOS ============

function inicializarEventos() {
  console.log('⚡ Inicializando eventos');
  
  // Búsqueda y filtros
  document.querySelector('#search')?.addEventListener('input', filtrarClientes);
  document.querySelector('#industryFilter')?.addEventListener('change', filtrarClientes);
  document.querySelector('#statusFilter')?.addEventListener('change', filtrarClientes);
  
  // Botón agregar cliente
  document.querySelector('#btnAddClient')?.addEventListener('click', abrirFormularioNuevo);
  
  // Modales - cerrar con botón
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', function() {
      const modal = this.closest('.modal-overlay');
      if (modal) modal.classList.remove('active');
    });
  });
  
  // Modales - cerrar con overlay
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('active');
      }
    });
  });
  
  // Formulario - guardar cliente
  document.querySelector('#clientForm')?.addEventListener('submit', guardarCliente);
  
  // ESC para cerrar modales
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    }
  });
}

// ============ NOTIFICACIONES ============

function mostrarToast(mensaje, tipo = 'info') {
  console.log(`🔔 Toast [${tipo}]: ${mensaje}`);
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${tipo === 'success' ? '#10b981' : '#ef4444'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 2000;
    font-weight: 500;
    animation: slideUp 0.3s ease;
  `;
  toast.textContent = mensaje;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
