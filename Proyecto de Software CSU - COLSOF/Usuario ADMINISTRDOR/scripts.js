// scripts.js - lógica unificada para el dashboard y creación de usuarios

(function(){
  // Utilidades
  function qs(sel, ctx=document){ return ctx.querySelector(sel); }
  function qsa(sel, ctx=document){ return Array.from(ctx.querySelectorAll(sel)); }

  // Perfil: abrir/cerrar menú y cerrar sesión
  (function(){
    const btn = qs('#btnProfile') || qs('.profile-menu-btn');
    const menu = qs('#menuProfile') || qs('.profile-menu');
    if (btn && menu) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
      });
      document.addEventListener('click', () => menu.classList.remove('show'));
    }
    const btnLogout = qs('#btnLogout') || qs('.logout-btn');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => alert('Sesión cerrada.'));
    }
  })();

  // Modal de construcción (compatibilidad con ambos ids)
  (function(){
    const modal = qs('#mdlConstruccion') || qs('#modal-construccion');
    const cerrar = qs('#btnCerrarModal') || qs('#cerrar-modal');
    if (!modal) return;
    
    qsa('.open-modal').forEach(a => {
      const text = (a.textContent || '').toLowerCase();
      let href = '';

      // Asignar rutas a archivos existentes en el proyecto
      if (text.includes('reportes')) href = '../../Menu - Reportes.html';
      else if (text.includes('estadísticas') || text.includes('estadisticas')) href = '../../Menu - Estadisticas.html';
      else if (text.includes('notificaciones')) href = '../../Menu - Notificaciones.html';
      else if (text.includes('herramientas')) href = '../Usuario GESTOR/Menu - Herramientas.html';
      else if (text.includes('configuración') || text.includes('configuracion')) href = '../../Menu - Configuracion.html';

      if (href) {
        a.href = href;
        a.classList.remove('open-modal');
      } else {
        a.addEventListener('click', (e) => { e.preventDefault(); modal.classList.add('active'); modal.style.display = 'flex'; });
      }
    });

    if (cerrar) cerrar.addEventListener('click', () => { modal.classList.remove('active'); modal.style.display = 'none'; });
    modal.addEventListener('click', (e) => { if (e.target === modal) { modal.classList.remove('active'); modal.style.display = 'none'; } });
  })();

  // Exportar CSV (dashboard)
  (function(){
    const btnCSV = qs('#btnCSV');
    if (!btnCSV) return;
    btnCSV.addEventListener('click', () => {
      const filas = [
        ['Mes','Solucionados','Creados','En Pausa','Cerrados'],
        ['Feb', 120, 240, 80, 40],
        ['Mar', 140, 260, 70, 50],
        ['Abr', 160, 300, 90, 60],
        ['May', 200, 340, 110, 80],
        ['Jun', 285, 390, 120, 100],
        ['Jul', 260, 410, 130, 110]
      ];
      const csv = filas.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'reporte_casos.csv';
      a.click(); URL.revokeObjectURL(url);
    });
  })();

  // Generar contraseña segura (form usuarios)
  (function(){
    const btnGen = qs('.gen-pass-btn');
    const input = qs('#contrasena');
    if (!btnGen || !input) return;
    function generarContrasena(longitud = 12) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?';
      let pass = '';
      for (let i = 0; i < longitud; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
      return pass;
    }
    btnGen.addEventListener('click', (e) => {
      e.preventDefault();
      input.value = generarContrasena();
    });
  })();

  // Envío del formulario de creación: validar, mostrar éxito/error y redirigir
  (function(){
    const form = qs('.user-form');
    if (!form) return;
    const modalExito = qs('#modal-exito');
    const modalError = qs('#modal-error');
    const cerrarError = qs('#cerrar-modal-error');
    const goToMenu = () => { window.location.href = 'Menu principal Admin.html'; };

    if (cerrarError && modalError) cerrarError.onclick = () => { modalError.style.display = 'none'; };

    form.addEventListener('submit', function(e){
      e.preventDefault();
      if (form.checkValidity()) {
        if (modalExito) {
          modalExito.style.display = 'flex';
          // Redirección automática
          setTimeout(goToMenu, 1400);
          // Si existe botón de cierre, también redirige
          const cerrarExito = qs('#cerrar-modal-exito');
          if (cerrarExito) cerrarExito.onclick = goToMenu;
        } else {
          goToMenu();
        }
      } else {
        form.reportValidity();
        if (modalError) modalError.style.display = 'flex';
      }
    });
  })();
})();
