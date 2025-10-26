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

// Ordenadores

const images = document.querySelector('.carousel-images');
const total = images.children.length / 2;
let index = 0;

function showImage(i, animated = true) {
    images.style.transition = animated ? 'transform 0.5s ease-in-out' : 'none';
    images.style.transform = `translateX(-${i * 100}%)`;
}

function nextImage() {
    index++;
    showImage(index);
    if (index === total) {
        setTimeout(() => {
            index = 0;
            showImage(index, false);
        }, 500);
    }
}

function prevImage() {
    if (index === 0) {
        index = total;
        showImage(index, false);
    }
    index--;
    showImage(index);
}

document.querySelector('.next').addEventListener('click', nextImage);
document.querySelector('.prev').addEventListener('click', prevImage);

setInterval(nextImage, 3000);

//Laptops

const images1 = document.querySelector('.carousel-images1');
const total1 = images.children.length / 2;
let index1 = 0;

function showImage1(i, animated = true) {
    images1.style.transition = animated ? 'transform 0.5s ease-in-out' : 'none';
    images1.style.transform = `translateX(-${i * 100}%)`;
}

function nextImage1() {
    index1++;
    showImage1(index1);
    if (index1 === total1) {
        setTimeout(() => {
            index1 = 0;
            showImage1(index1, false);
        }, 500);
    }
}

function prevImage1() {
    if (index1 === 0) {
        index1 = total1;
        showImage1(index1, false);
    }
    index1--;
    showImage1(index1);
}

document.querySelector('.boton-carrusel2').addEventListener('click', nextImage1);
document.querySelector('.boton-carrusel1').addEventListener('click', prevImage1);

setInterval(nextImage1, 3000);

//Dispositivos moviles

const images2 = document.querySelector('.carousel-images2');
const total2 = images.children.length / 2;
let index2 = 0;

function showImage2(i, animated = true) {
    images2.style.transition = animated ? 'transform 0.5s ease-in-out' : 'none';
    images2.style.transform = `translateX(-${i * 100}%)`;
}

function nextImage2() {
    index2++;
    showImage2(index2);
    if (index2 === total2) {
        setTimeout(() => {
            index2 = 0;
            showImage2(index2, false);
        }, 500);
    }
}

function prevImage2() {
    if (index2 === 0) {
        index2 = total2;
        showImage2(index2, false);
    }
    index2--;
    showImage2(index2);
}

document.querySelector('.boton-carrusel4').addEventListener('click', nextImage2);
document.querySelector('.boton-carrusel3').addEventListener('click', prevImage2);

setInterval(nextImage2, 3000);

// Accesorios

const images3 = document.querySelector('.carousel-images3');
const total3 = images3.children.length / 2;
let index3 = 0;

function showImage3(i, animated = true) {
    images3.style.transition = animated ? 'transform 0.5s ease-in-out' : 'none';
    images3.style.transform = `translateX(-${i * 100}%)`;
}

function nextImage3() {
    index3++;
    showImage3(index3);
    if (index3 === total3) {
        setTimeout(() => {
            index3 = 0;
            showImage3(index3, false);
        }, 500);
    }
}

function prevImage3() {
    if (index3 === 0) {
        index3 = total3;
        showImage3(index3, false);
    }
    index3--;
    showImage3(index3);
}

document.querySelector('.boton-carrusel6').addEventListener('click', nextImage3);
document.querySelector('.boton-carrusel5').addEventListener('click', prevImage3);

setInterval(nextImage3, 3000);
