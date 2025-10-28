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
// 📦 Lógica para agregar productos (debe estar en la página del catálogo)

document.querySelectorAll('.boton-carrito').forEach(boton => {
    boton.addEventListener('click', function(e) {
        e.preventDefault(); 
        e.stopPropagation(); // Evita que el clic en el botón active el enlace <a>

        // 1. Obtener la tarjeta completa y su HTML
        const tarjeta = this.closest('.tarjeta-producto');
        const htmlTarjeta = tarjeta.outerHTML; // 👈 Captura el HTML completo (incluyendo el <a> y el diseño)
        
        // 2. Cargar el carrito de HTML existente (CRÍTICO: evita que se borren los artículos anteriores)
        // Usamos una clave diferente: 'carritoHTML'
        let carritoHTML = JSON.parse(localStorage.getItem('carritoHTML')) || []; 
        
        // 3. Añadir la nueva cadena HTML (el string) al array
        carritoHTML.push(htmlTarjeta);
        
        // 4. Guardar el array de HTML actualizado en LocalStorage
        localStorage.setItem('carritoHTML', JSON.stringify(carritoHTML));

        const nombre = tarjeta.dataset.nombre;
        alert(`"${nombre}" fue agregado al carrito.`);
    });
});


// 🛒 Lógica para mostrar el carrito (debe estar en la página del carrito)

function mostrarCarrito() {
    // 1. Obtener el array de strings HTML con la clave 'carritoHTML'
    const carritoGuardado = JSON.parse(localStorage.getItem('carritoHTML')) || []; 
    const contenedor = document.querySelector('[data-carrito]');
    // Hemos removido la línea que busca '[data-total-carrito]' porque ya no podemos sumar precios fácilmente.
    
    if (!contenedor) return;

    contenedor.innerHTML = ''; // Limpiar el contenedor
    
    if (carritoGuardado.length === 0) {
        contenedor.innerHTML = '<p>El carrito está vacío. ¡Añade algunos productos!</p>';
        return;
    }

    // 2. Iterar e inyectar el HTML guardado directamente
    carritoGuardado.forEach(htmlString => {
        // Inyectamos el string de HTML tal cual fue guardado
        contenedor.insertAdjacentHTML('beforeend', htmlString);
    });
    
    // NOTA IMPORTANTE:
    // Si necesitas mostrar el total de la compra, deberás modificar 
    // la lógica de agregar al carrito para guardar también el precio 
    // en un objeto separado y luego iterar sobre esa lista para sumar.
    // Con esta solución (solo guardando HTML), la suma es muy compleja.
}

window.addEventListener('DOMContentLoaded', mostrarCarrito);
