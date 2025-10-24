// principal.js

// Obtener elementos del DOM
// Elementos
const userNameElem = document.getElementById('userName');
const userTypeElem = document.getElementById('userType');
const infoPanel = document.getElementById('info');
const profileImg = document.getElementById('imagen');
const logoutBtn = document.getElementById('logoutBtn');

// Recuperar datos del sessionStorage
const nombreUsuario = sessionStorage.getItem('NombreUsuario');
const tipoUsuario = sessionStorage.getItem('tipoUsuario');

// Si no hay sesión activa, redirigir al login
if (!nombreUsuario || !tipoUsuario) {
    window.location.href = "index.html";
} else {
    // Mostrar los datos en el header
    userNameElem.textContent = nombreUsuario;
    
    // Mostrar tipo "Admin" o "Común" según corresponda
    userTypeElem.textContent = (tipoUsuario === 'administrador') ? 'Administrador' : 'Usuario';
}

// Mostrar/ocultar panel al hacer clic en la imagen
profileImg.addEventListener('click', () => {
    infoPanel.style.display = (infoPanel.style.display === 'block') ? 'none' : 'block';
});

// Cerrar sesión
logoutBtn.addEventListener('click', () => {
    sessionStorage.clear(); // borra toda la sesión
    window.location.href = 'index.html'; // vuelve al login
});

// Opcional: cerrar el panel si se hace clic fuera de él
document.addEventListener('click', (e) => {
    if (!infoPanel.contains(e.target) && e.target !== profileImg) {
        infoPanel.style.display = 'none';
    }
});

const menuBtn = document.getElementById('menuBtn');
const menuPlegable = document.getElementById('menuPlegable');


menuBtn.addEventListener('click', () => {
    menuPlegable.classList.toggle('show');
});





