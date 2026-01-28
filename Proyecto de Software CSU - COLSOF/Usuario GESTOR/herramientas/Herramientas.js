// ============ DATOS DE HERRAMIENTAS ============

const herramientasData = [
  {
    id: 'diagnostico',
    tipo: 'diagnostico',
    titulo: 'Diagnóstico de Hardware',
    descripcion: 'Herramientas para diagnóstico de fallas en PCs y Laptops',
    icon: 'fa-tools',
    btnText: 'Iniciar Diagnóstico'
  },
  {
    id: 'impresoras',
    tipo: 'impresoras',
    titulo: 'Mantenimiento Impresoras',
    descripcion: 'Guías de limpieza de cabezales y manuales de servicio',
    icon: 'fa-print',
    btnText: 'Ver Guías'
  },
  {
    id: 'conocimiento',
    tipo: 'conocimiento',
    titulo: 'Base de Conocimiento',
    descripcion: 'Repositorio de soluciones comunes y documentación técnica',
    icon: 'fa-book',
    btnText: 'Buscar Solución'
  },
  {
    id: 'drivers',
    tipo: 'drivers',
    titulo: 'Drivers y Controladores',
    descripcion: 'Descargas de drivers oficiales para HP, Dell, Lenovo y Epson',
    icon: 'fa-download',
    btnText: 'Descargar Drivers'
  },
  {
    id: 'remoto',
    tipo: 'remoto',
    titulo: 'Escritorio Remoto',
    descripcion: 'Herramientas para conexión remota (AnyDesk, TeamViewer)',
    icon: 'fa-laptop',
    btnText: 'Conectar'
  },
  {
    id: 'inventario',
    tipo: 'inventario',
    titulo: 'Inventario de Repuestos',
    descripcion: 'Consulta disponibilidad de toners, discos duros y más',
    icon: 'fa-boxes',
    btnText: 'Consultar Stock'
  }
];

// ============ DATOS DE BASE DE CONOCIMIENTO ============

const soluciones = [
  {
    titulo: 'Error de conexión WiFi',
    resumen: 'Solución para problemas de conexión a redes inalámbricas'
  },
  {
    titulo: 'Pantalla azul de la muerte',
    resumen: 'Pasos para diagnosticar y resolver errores BSOD'
  },
  {
    titulo: 'Lentitud del sistema',
    resumen: 'Técnicas para optimizar rendimiento de Windows'
  },
  {
    titulo: 'Impresora no reconocida',
    resumen: 'Procedimiento para instalar drivers de impresora'
  },
  {
    titulo: 'Problema de audio',
    resumen: 'Solución para altavoces o micrófono no funcionan'
  },
  {
    titulo: 'Teclado o ratón inoperativo',
    resumen: 'Reinstalar controladores de periféricos USB'
  }
];

// ============ DATOS DE REPUESTOS ============

const repuestos = [
  { nombre: 'Toner HP LaserJet Pro M404n', stock: 15, estado: 'alto', proveedor: 'HP Distribuidora' },
  { nombre: 'Cartucho Epson T220', stock: 8, estado: 'medio', proveedor: 'Epson Service' },
  { nombre: 'Disco Duro 2TB WD', stock: 3, estado: 'bajo', proveedor: 'Western Digital' },
  { nombre: 'Memoria RAM 8GB DDR4', stock: 12, estado: 'alto', proveedor: 'Kingston' },
  { nombre: 'Batería Laptop Sony', stock: 2, estado: 'bajo', proveedor: 'Sony Electronics' },
  { nombre: 'Cable HDMI 3m', stock: 25, estado: 'alto', proveedor: 'Tech Supplies' },
  { nombre: 'Adaptador VGA a HDMI', stock: 5, estado: 'medio', proveedor: 'Tech Supplies' },
  { nombre: 'Fuente de Poder 450W', stock: 4, estado: 'bajo', proveedor: 'Corsair' }
];

// ============ GUÍAS DE IMPRESORAS ============

const guiasImpresoras = {
  'HP': `
    <ul>
      <li><strong>Limpieza de Cabezales:</strong> Panel de Control → Herramientas de Mantenimiento → Limpiar cabezales de impresión</li>
      <li><strong>Reset de Contadores:</strong> Usar HP Smart Utility para resetear contadores de tóner</li>
      <li><strong>Cambio de Tóner:</strong> Abrir compartimento frontal, retirar cartucho agotado e insertar uno nuevo</li>
      <li><strong>Desatolladuras:</strong> Abrir todas las compuertas y retirar papel o residuos con cuidado</li>
    </ul>
  `,
  'Epson': `
    <ul>
      <li><strong>Limpieza de Cabezales:</strong> Utilidad de Epson → Mantenimiento → Limpiar cabezales</li>
      <li><strong>Alineación:</strong> Ejecutar alineación de cabezales automática desde software</li>
      <li><strong>Cambio de Tanques de Tinta:</strong> Presionar botón de liberación e insertar tanque nuevo</li>
      <li><strong>Mantenimiento Preventivo:</strong> Ejecutar limpieza cada 40 horas de impresión</li>
    </ul>
  `,
  'Canon': `
    <ul>
      <li><strong>Limpieza de Cabezales:</strong> Canon IJ Printer Utility → Mantenimiento → Limpiar cabezales</li>
      <li><strong>Verificación de Cartuchos:</strong> Revisar niveles de tinta en tiempo real</li>
      <li><strong>Cambio de Cartuchos:</strong> Retirar tapa de acceso y extraer cartucho de forma diagonal</li>
      <li><strong>Ciclo de Mantenimiento:</strong> Canon ejecuta ciclos automáticos cada inicio</li>
    </ul>
  `,
  'Brother': `
    <ul>
      <li><strong>Limpieza de Cabezales:</strong> Panel de Control → Herramientas → Mantenimiento → Limpiar</li>
      <li><strong>Alineación de Inyectores:</strong> Ejecutar alineación automática desde panel frontal</li>
      <li><strong>Cambio de Cartuchos:</strong> Abrir bandeja, retirar cartucho usado e insertar nuevo</li>
      <li><strong>Verificación de Niveles:</strong> Ver niveles de tinta en display LCD frontal</li>
    </ul>
  `
};

// ============ DATOS DE DRIVERS ============

const driversPorMarca = {
  'HP': [
    { nombre: 'HP LaserJet Pro M404n', tipo: 'Impresora', url: 'descargar' },
    { nombre: 'HP Pavilion dv6', tipo: 'Chipset', url: 'descargar' },
    { nombre: 'HP All-in-One K8600', tipo: 'Multifunción', url: 'descargar' }
  ],
  'Dell': [
    { nombre: 'Dell OptiPlex 7090', tipo: 'Chipset', url: 'descargar' },
    { nombre: 'Dell Inspiron 15', tipo: 'Controladores', url: 'descargar' },
    { nombre: 'Dell V515w', tipo: 'Impresora', url: 'descargar' }
  ],
  'Lenovo': [
    { nombre: 'Lenovo ThinkPad X1', tipo: 'Trackpad', url: 'descargar' },
    { nombre: 'Lenovo IdeaCentre', tipo: 'Audio', url: 'descargar' },
    { nombre: 'Lenovo Yoga', tipo: 'Sensores', url: 'descargar' }
  ],
  'Epson': [
    { nombre: 'Epson L3110', tipo: 'Impresora', url: 'descargar' },
    { nombre: 'Epson WorkForce', tipo: 'Multifunción', url: 'descargar' },
    { nombre: 'Epson LQ-590', tipo: 'Matriz de Puntos', url: 'descargar' }
  ]
};

// ============ FUNCIONES PRINCIPALES ============

document.addEventListener('DOMContentLoaded', () => {
  console.log('📦 Módulo Herramientas inicializando...');
  
  cargarHerramientas();
  inicializarEventos();
  
  console.log('✅ Módulo Herramientas cargado correctamente');
});

// ============ CARGAR HERRAMIENTAS ============

function cargarHerramientas() {
  const container = document.getElementById('toolsContainer');
  if (!container) return;

  // Simular loading y luego cargar
  setTimeout(() => {
    container.innerHTML = '';
    
    herramientasData.forEach((herramienta, index) => {
      const card = document.createElement('div');
      card.className = 'tool-card';
      card.setAttribute('data-type', herramienta.tipo);
      card.style.animation = `slideUp 0.4s ease ${index * 0.1}s backwards`;
      
      card.innerHTML = `
        <div class="tool-icon">
          <i class="fas ${herramienta.icon}"></i>
        </div>
        <h3 class="tool-title">${herramienta.titulo}</h3>
        <p class="tool-desc">${herramienta.descripcion}</p>
        <button class="tool-btn" onclick="abrirHerramienta('${herramienta.id}')">
          <i class="fas fa-arrow-right"></i>
          ${herramienta.btnText}
        </button>
      `;
      
      container.appendChild(card);
    });
    
    console.log('✅ Herramientas cargadas dinámicamente');
  }, 300);
}

// ============ ABRIR HERRAMIENTAS ============

function abrirHerramienta(id) {
  const modales = {
    diagnostico: 'diagnosticoModal',
    impresoras: 'impresoresModal',
    conocimiento: 'conocimientoModal',
    drivers: 'driversModal',
    remoto: 'remotoModal',
    inventario: 'inventarioModal'
  };

  const modalId = modales[id];
  if (modalId) {
    abrirModal(modalId);
    console.log(`🔧 Abriendo herramienta: ${id}`);
  }
}

// ============ FUNCIONES DE MODALES ============

function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function cerrarModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    const form = modal.querySelector('form');
    if (form) form.reset();
  }
}

// ============ DIAGNÓSTICO ============

function ejecutarDiagnostico() {
  const resultado = document.getElementById('diagnosticoResult');
  resultado.innerHTML = '<p style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Ejecutando diagnóstico...</p>';
  
  setTimeout(() => {
    let html = '<div class="item">';
    html += '<strong>CPU-Z:</strong> ✅ Procesador Intel Core i7-10700K @ 3.8GHz<br>';
    html += '<strong>GPU-Z:</strong> ✅ NVIDIA GeForce RTX 2080 (8GB VRAM)<br>';
    html += '<strong>Memoria RAM:</strong> ✅ 32GB DDR4 @ 2666MHz (98% saludable)<br>';
    html += '<strong>Disco Duro:</strong> ✅ SSD Samsung 970 EVO (450GB disponibles)<br>';
    html += '<strong>Temperatura CPU:</strong> ✅ 45°C (Normal)<br>';
    html += '<strong>Temperatura GPU:</strong> ✅ 52°C (Normal)<br>';
    html += '</div>';
    
    resultado.innerHTML = html;
    mostrarToast('✅ Diagnóstico completado exitosamente', false);
  }, 2000);
}

// ============ IMPRESORAS ============

function mostrarGuiaImpresora(marca) {
  const titleEl = document.getElementById('guiaTitle');
  const contentEl = document.getElementById('guiaContent');
  
  titleEl.textContent = `Guía: ${marca}`;
  contentEl.innerHTML = guiasImpresoras[marca] || '<p>Guía no disponible</p>';
  
  console.log(`📖 Mostrando guía para: ${marca}`);
}

// ============ BASE DE CONOCIMIENTO ============

function buscarSolucion(termino) {
  const container = document.getElementById('solucionesContainer');
  
  if (!termino.trim()) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Ingresa una palabra clave para buscar...</p>';
    return;
  }

  const resultados = soluciones.filter(s => 
    s.titulo.toLowerCase().includes(termino.toLowerCase()) ||
    s.resumen.toLowerCase().includes(termino.toLowerCase())
  );

  if (resultados.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No se encontraron resultados para "' + termino + '"</p>';
    return;
  }

  container.innerHTML = resultados.map(sol => `
    <div class="solucion-item">
      <h4><i class="fas fa-lightbulb"></i> ${sol.titulo}</h4>
      <p>${sol.resumen}</p>
    </div>
  `).join('');

  console.log(`📚 ${resultados.length} soluciones encontradas para: ${termino}`);
}

// ============ DRIVERS ============

function cargarDrivers(marca) {
  const container = document.getElementById('driversList');
  const drivers = driversPorMarca[marca] || [];

  if (drivers.length === 0) {
    container.innerHTML = '<p>No hay drivers disponibles para ' + marca + '</p>';
    return;
  }

  container.innerHTML = `
    <ul>
      ${drivers.map(driver => `
        <li>
          <strong>${driver.nombre}</strong><br>
          <small style="color: #999;">${driver.tipo}</small>
          <button onclick="descargarDriver('${driver.nombre}')" style="float: right; padding: 4px 8px; background: #10b981; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
            <i class="fas fa-download"></i> Descargar
          </button>
        </li>
      `).join('')}
    </ul>
  `;

  console.log(`⬇️ Drivers cargados para: ${marca}`);
}

function descargarDriver(nombre) {
  mostrarToast(`⬇️ Descargando: ${nombre}`, false);
  console.log(`📥 Iniciando descarga de: ${nombre}`);
}

// ============ ESCRITORIO REMOTO ============

function conectarRemoto(event) {
  event.preventDefault();
  
  const ip = document.getElementById('ipEquipo').value;
  const herramienta = document.getElementById('herramientaRemota').value;
  const usuario = document.getElementById('usuarioRemoto').value;

  if (!ip || !herramienta || !usuario) {
    mostrarToast('⚠️ Completa todos los campos', true);
    return;
  }

  console.log(`🔗 Conectando a ${ip} via ${herramienta} como ${usuario}`);
  
  cerrarModal('remotoModal');
  mostrarToast(`🔗 Intentando conectar a ${ip} con ${herramienta}...`, false);

  setTimeout(() => {
    mostrarToast(`✅ Conexión establecida con ${ip}`, false);
  }, 2000);
}

// ============ INVENTARIO ============

function cargarInventario() {
  const container = document.getElementById('repuestosList');
  
  container.innerHTML = repuestos.map(rep => `
    <div class="repuesto-row">
      <div>${rep.nombre}</div>
      <div><strong>${rep.stock}</strong> unidades</div>
      <div>
        <span class="stock-badge stock-${rep.estado}">
          ${rep.estado === 'alto' ? 'Alto' : rep.estado === 'medio' ? 'Medio' : 'Bajo'}
        </span>
      </div>
      <div>${rep.proveedor}</div>
    </div>
  `).join('');

  console.log('📦 Inventario cargado');
}

function filtrarRepuestos(termino) {
  const container = document.getElementById('repuestosList');
  
  if (!termino.trim()) {
    cargarInventario();
    return;
  }

  const resultados = repuestos.filter(rep => 
    rep.nombre.toLowerCase().includes(termino.toLowerCase())
  );

  container.innerHTML = resultados.map(rep => `
    <div class="repuesto-row">
      <div>${rep.nombre}</div>
      <div><strong>${rep.stock}</strong> unidades</div>
      <div>
        <span class="stock-badge stock-${rep.estado}">
          ${rep.estado === 'alto' ? 'Alto' : rep.estado === 'medio' ? 'Medio' : 'Bajo'}
        </span>
      </div>
      <div>${rep.proveedor}</div>
    </div>
  `).join('');
}

// ============ INICIALIZAR EVENTOS ============

function inicializarEventos() {
  // Cerrar modales al hacer click en overlay
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cerrarModal(modal.id);
      }
    });
  });

  // Cargar inventario cuando se abre el modal
  const inventarioModal = document.getElementById('inventarioModal');
  if (inventarioModal) {
    const observer = new MutationObserver(() => {
      if (inventarioModal.classList.contains('active')) {
        cargarInventario();
      }
    });
    observer.observe(inventarioModal, { attributes: true, attributeFilter: ['class'] });
  }

  // ESC para cerrar modales
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(modal => {
        cerrarModal(modal.id);
      });
    }
  });

  console.log('✅ Eventos inicializados');
}

// ============ UTILIDADES ============

function mostrarToast(mensaje, esError = false) {
  const toast = document.createElement('div');
  toast.innerHTML = mensaje;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${esError ? '#ef4444' : '#10b981'};
    color: #fff;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 2000;
    max-width: 400px;
    animation: slideUp 0.3s ease;
    font-size: 14px;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
