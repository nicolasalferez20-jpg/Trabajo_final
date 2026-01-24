const API_URL = 'http://localhost:3001/api';
const STORAGE_KEY = 'colsof_config_settings';

const defaultSettings = {
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

let settings = { ...defaultSettings };

const notify = (msg, isError = false) => {
  let box = document.getElementById('config-toast');
  if (!box) {
    box = document.createElement('div');
    box.id = 'config-toast';
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
  box._timer = setTimeout(() => { box.remove(); }, 2400);
};

const applySettingsToUI = (data) => {
  Object.keys(defaultSettings).forEach(key => {
    const el = document.getElementById(key);
    if (!el) return;
    const value = data[key] !== undefined ? data[key] : defaultSettings[key];
    if (el.type === 'checkbox') el.checked = Boolean(value);
    else el.value = value;
  });
};

const readSettingsFromUI = () => {
  const next = { ...settings };
  document.querySelectorAll('input, select').forEach(el => {
    if (!el.id) return;
    next[el.id] = el.type === 'checkbox' ? el.checked : el.value;
  });
  return next;
};

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('No se pudo leer configuración local:', err);
    return null;
  }
};

const saveToStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('No se pudo guardar configuración local:', err);
  }
};

const fetchSettings = async () => {
  try {
    const res = await fetch(`${API_URL}?action=get_settings`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return { ...defaultSettings, ...data };
  } catch (err) {
    console.warn('Fallo al cargar desde API, se usará caché local:', err);
    const cached = loadFromStorage();
    if (cached) return { ...defaultSettings, ...cached };
    return { ...defaultSettings };
  }
};

const persistSettings = async (data) => {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ action: 'save_settings', payload: JSON.stringify(data) })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    notify('Configuración sincronizada con el servidor');
  } catch (err) {
    notify('Guardado local: sin conexión al API', false);
    console.warn('No se pudo guardar en API, se mantiene en localStorage:', err);
  }
  saveToStorage(data);
};

// Tabs - soporta botones en .sidebar y .sidebar-card
document.querySelectorAll('.sidebar button, .sidebar-card button').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.sidebar button, .sidebar-card button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  };
});

// Cargar valores iniciales
(async () => {
  settings = await fetchSettings();
  applySettingsToUI(settings);
})();

// Guardar
document.getElementById('saveBtn').onclick = async () => {
  settings = readSettingsFromUI();
  await persistSettings(settings);
};
