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


function setupInfiniteCarousel(imagesSelector, prevBtnSelector, nextBtnSelector, interval = 3000) {
    const images = document.querySelector(imagesSelector);
    const slides = images.children;
    const total = slides.length / 2; // la mitad son clonadas
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

    document.querySelector(nextBtnSelector).addEventListener('click', nextImage);
    document.querySelector(prevBtnSelector).addEventListener('click', prevImage);

    return setInterval(nextImage, interval);
}

// Configuración de carruseles
setupInfiniteCarousel('.carousel-images', '.prev', '.next');
setupInfiniteCarousel('.carousel-images1', '.boton-carrusel1', '.boton-carrusel2');
setupInfiniteCarousel('.carousel-images2', '.boton-carrusel3', '.boton-carrusel4');
setupInfiniteCarousel('.carousel-images3', '.boton-carrusel5', '.boton-carrusel6');
setupInfiniteCarousel('.carousel-images4', '.boton-carrusel7', '.boton-carrusel8');
setupInfiniteCarousel('.carousel-images5', '.boton-carrusel9', '.boton-carrusel10');



  // Creamos un array para guardar los productos
const carrito = [];

document.querySelectorAll('.boton-carrito').forEach(boton => {
    boton.addEventListener('click', function(e) {
      e.preventDefault(); 

      const tarjeta = this.closest('.tarjeta-producto');

      const producto = {
        nombre: tarjeta.dataset.nombre,
        precio: parseFloat(tarjeta.dataset.precio),
        imagen: tarjeta.dataset.img
      };

      carrito.push(producto);

      console.log('✅ Producto agregado al carrito:', producto);
      console.log('🛒 Carrito actual:', carrito);

      localStorage.setItem('carrito', JSON.stringify(carrito));

      alert(`"${producto.nombre}" fue agregado al carrito`);
    });
});

  

function mostrarCarrito() {
  const contenedor = document.querySelector('[data-carrito]');
  const total = document.querySelector('[data-total-carrito]');
  const carritoGuardado = JSON.parse(localStorage.getItem('carrito')) || [];

  if (!contenedor) return;

  contenedor.innerHTML = '';
  let suma = 0;

  carritoGuardado.forEach(producto => {
    const tarjeta = document.createElement('a');
    tarjeta.href = "detalle-5700x.html";
    tarjeta.className = "tarjeta-producto";
    tarjeta.dataset.nombre = producto.nombre;
    tarjeta.dataset.precio = producto.precio;
    tarjeta.dataset.img = producto.imagen;

    tarjeta.innerHTML = `
      <div class="contenido">
        <img src="${producto.imagen}" alt="${producto.nombre}">
        <h3>${producto.nombre}</h3>
        <p>Producto agregado</p>
        <p class="precio">C$${producto.precio.toFixed(2)}</p>
        <button class="boton-carrito" disabled>Agregado</button>
      </div>
    `;

    contenedor.appendChild(tarjeta);
    suma += producto.precio;
  });

  total.textContent = `Total: C$${suma.toFixed(2)}`;
}

window.addEventListener('DOMContentLoaded', mostrarCarrito);

