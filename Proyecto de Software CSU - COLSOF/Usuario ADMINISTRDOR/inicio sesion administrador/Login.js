document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            // Redireccionar al menú principal del administrador
            window.location.href = 'Menu principal Administrador.html';
        });
    }
});