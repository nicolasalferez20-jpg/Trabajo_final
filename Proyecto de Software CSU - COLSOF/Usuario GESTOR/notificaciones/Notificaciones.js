document.addEventListener('DOMContentLoaded', () => {
  const listContainer = document.getElementById('notificationList');
  const filters = document.querySelectorAll('.filters button');
  
  // Ruta a la API (ajustada desde la raíz donde está Menu - Notificaciones.html)
  // Usamos encodeURI para manejar correctamente los espacios en los nombres de carpeta
  const API_URL = encodeURI('Proyecto de Software CSU - COLSOF/Usuario GESTOR/api.php');

  let notifications = [];

  // 1. Cargar notificaciones desde la BD
  function loadNotifications() {
    if(listContainer) listContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#666;">Cargando notificaciones...</div>';
    
    fetch(API_URL + '?action=get_notifications')
      .then(res => {
        // Verificar si la respuesta es exitosa
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        return res.text().then(text => {
          try {
            return JSON.parse(text);
          } catch (e) {
            throw new Error("Respuesta del servidor no es JSON válido: " + text);
          }
        });
      })
      .then(data => {
        notifications = data;
        renderNotifications('all');
        updateBadge(data.length);
      })
      .catch(err => {
        console.error(err);
        // Mostrar un mensaje más descriptivo si es posible, o pedir revisar consola
        if(listContainer) listContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#d32f2f;">Error de conexión. Revisa la consola (F12) para más detalles.</div>';
      });
  }

  // 2. Renderizar lista
  function renderNotifications(filterType) {
    if (!listContainer) return;
    listContainer.innerHTML = '';
    
    const filtered = notifications.filter(n => {
      if (filterType === 'all') return true;
      if (filterType === 'unread') return !n.leido;
      return n.tipo === filterType;
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = '<div style="padding:40px; text-align:center; color:#999;">No hay notificaciones en esta categoría</div>';
      return;
    }

    filtered.forEach(n => {
      const div = document.createElement('div');
      div.className = `notification ${n.leido ? '' : 'unread'}`;
      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <h3 style="margin:0; font-size:16px; color:#0b3a66;">${n.titulo}</h3>
            <small style="color:#666;">${n.fecha}</small>
        </div>
        <p style="margin:0; color:#444;">${n.mensaje}</p>
        <div class="actions">
          <button class="read">Marcar como leída</button>
          <button class="delete">Eliminar</button>
        </div>
      `;
      listContainer.appendChild(div);
    });
  }

  function updateBadge(count) {
    const badges = document.querySelectorAll('.badge');
    badges.forEach(b => b.textContent = count > 0 ? count : '');
  }

  // Eventos de filtros
  filters.forEach(btn => btn.addEventListener('click', () => { filters.forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderNotifications(btn.dataset.filter); }));

  loadNotifications();
});