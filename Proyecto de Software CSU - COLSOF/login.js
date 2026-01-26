const form = document.getElementById('loginForm');
const alertBox = document.getElementById('alertBox');
const passwordInput = document.getElementById('password');
const emailInput = document.getElementById('email');
const togglePassword = document.querySelector('.toggle');
const inputGroups = Array.from(form.querySelectorAll('.input-group[data-field]'));
const submitButton = form.querySelector('.submit');

// API base URL
const API_URL = window.location.origin + '/api';

// Toggle password visibility
if (togglePassword) {
  togglePassword.addEventListener('click', () => {
    const isHidden = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isHidden ? 'text' : 'password');
    
    // Update ARIA label for accessibility
    togglePassword.setAttribute(
      'aria-label',
      isHidden ? 'Ocultar contraseña' : 'Mostrar contraseña'
    );
  });

  // Also allow Enter/Space to trigger the toggle
  togglePassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePassword.click();
    }
  });
}

// Validation function
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Show alert with custom message
function showAlert(message, type = 'error') {
  const alertContent = alertBox.querySelector('.alert-content');
  alertContent.innerHTML = `<h2>${type === 'error' ? 'Error' : 'Información'}</h2><p>${message}</p>`;
  alertBox.classList.add('show');
}

// Hide alert
function hideAlert() {
  alertBox.classList.remove('show');
}

// Form submission with validation
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  let hasError = false;

  // Validate email
  const emailValue = emailInput.value.trim();
  const emailGroup = emailInput.closest('.input-group');
  
  if (!emailValue || !validateEmail(emailValue)) {
    hasError = true;
    emailGroup.classList.add('error');
    emailInput.setAttribute('aria-invalid', 'true');
  } else {
    emailGroup.classList.remove('error');
    emailInput.setAttribute('aria-invalid', 'false');
  }

  // Validate password
  const passwordValue = passwordInput.value.trim();
  const passwordGroup = passwordInput.closest('.input-group');
  
  if (!passwordValue || passwordValue.length < 3) {
    hasError = true;
    passwordGroup.classList.add('error');
    passwordInput.setAttribute('aria-invalid', 'true');
  } else {
    passwordGroup.classList.remove('error');
    passwordInput.setAttribute('aria-invalid', 'false');
  }

  if (hasError) {
    showAlert('Asegúrese de haber ingresado correctamente su información');
    // Focus on first error field for accessibility
    const firstError = form.querySelector('.input-group.error input');
    if (firstError) {
      firstError.focus();
    }
    return;
  }

  // Si la validación es correcta, intentar login
  await performLogin(emailValue, passwordValue);
});

// Perform login with API
async function performLogin(email, password) {
  try {
    // Deshabilitar el botón durante la solicitud
    submitButton.disabled = true;
    submitButton.textContent = 'Ingresando...';

    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Error en autenticación
      showAlert(data.error || 'Error en la autenticación');
      submitButton.disabled = false;
      submitButton.textContent = 'Ingresar';
      return;
    }

    // Autenticación exitosa
    hideAlert();
    
    // Guardar datos del usuario en localStorage
    const userData = {
      id: data.data.id,
      nombre: data.data.nombre,
      apellido: data.data.apellido,
      email: data.data.email,
      rol: data.data.rol,
      loginTime: new Date().toISOString()
    };

    localStorage.setItem('usuario', JSON.stringify(userData));

    // Redirigir según el rol
    setTimeout(() => {
      if (data.data.rol.toLowerCase() === 'administrador') {
        window.location.href = 'Usuario ADMINISTRDOR/Menu principal Admin.html';
      } else if (data.data.rol.toLowerCase() === 'gestor') {
        window.location.href = 'Usuario GESTOR/Menu principal.html';
      } else if (data.data.rol.toLowerCase() === 'tecnico') {
        window.location.href = 'Usuario ADMINISTRDOR/Menu principal Admin.html'; // O redirigir a página de técnico si existe
      } else {
        showAlert('Rol de usuario no reconocido');
      }
    }, 500);

  } catch (error) {
    console.error('Error en login:', error);
    showAlert('Error al conectar con el servidor. Intenta más tarde.');
    submitButton.disabled = false;
    submitButton.textContent = 'Ingresar';
  }
}

// Remove error styles on input
inputGroups.forEach((group) => {
  const input = group.querySelector('input');
  input.addEventListener('input', () => {
    group.classList.remove('error');
    input.setAttribute('aria-invalid', 'false');
    hideAlert();
  });

  // Also remove error on focus for better UX
  input.addEventListener('focus', () => {
    if (group.classList.contains('error')) {
      group.classList.remove('error');
      input.setAttribute('aria-invalid', 'false');
    }
  });
});

// Dismiss alert on click
alertBox.addEventListener('click', () => {
  alertBox.classList.remove('show');
});

// Handle "Remember me" with localStorage (optional enhancement)
const rememberCheckbox = form.querySelector('input[name="remember"]');
if (rememberCheckbox) {
  // Load remembered email if exists
  const rememberedEmail = localStorage.getItem('rememberedEmail');
  if (rememberedEmail) {
    emailInput.value = rememberedEmail;
    rememberCheckbox.checked = true;
  }

  // Save email when form is submitted successfully
  form.addEventListener('submit', () => {
    if (rememberCheckbox.checked && !form.querySelector('.input-group.error')) {
      localStorage.setItem('rememberedEmail', emailInput.value);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
  });
}
