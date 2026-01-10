const settings = {
  systemName: 'CSU - Centro de Soporte a Usuarios',
  language: 'es',
  timezone: 'America/Bogota',
  dateFormat: 'DD/MM/YYYY',
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  sessionTimeout: 30,
  twoFactorAuth: false,
  theme: 'light',
  compactMode: false,
  smtpServer: 'smtp.gmail.com',
  smtpPort: '587',
  smtpUser: 'noreply@colsof.com.co',
  smtpPassword: '',
  emailFrom: 'CSU Colsof <noreply@colsof.com.co>'
};

// Inicializar valores
Object.keys(settings).forEach(key => {
  const el = document.getElementById(key);
  if (!el) return;
  if (el.type === 'checkbox') el.checked = settings[key];
  else el.value = settings[key];
});

// Tabs - soporta botones en .sidebar y .sidebar-card
document.querySelectorAll('.sidebar button, .sidebar-card button').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.sidebar button, .sidebar-card button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  };
});

// Guardar
document.getElementById('saveBtn').onclick = () => {
  document.querySelectorAll('input, select').forEach(el => {
    settings[el.id] = el.type === 'checkbox' ? el.checked : el.value;
  });
  alert('Configuración guardada exitosamente');
};
