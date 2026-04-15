/* ============================================
   📌 1. MANEJO DE USUARIO (perfil + logout)
============================================ */
document.addEventListener("DOMContentLoaded", () => {
    const profileImg = document.getElementById("imagen");
    const infoBox = document.getElementById("info");
    const logoutBtn = document.getElementById("logoutBtn");
    const quickLogout = document.querySelector(".logout-action");

    // Mostrar/ocultar panel de usuario
    profileImg?.addEventListener("click", () => {
        infoBox.classList.toggle("visible");
    });

    // Logout unificado
    const logout = () => {
        localStorage.removeItem("usuario");
        window.location.href = "index.html";
    };

    logoutBtn?.addEventListener("click", logout);
    quickLogout?.addEventListener("click", logout);

    // Cargar datos del usuario
    const user = JSON.parse(localStorage.getItem("usuario"));
    if (user) {
        document.getElementById("userName").textContent = user.nombre || "Usuario";
        document.getElementById("userType").textContent = user.tipo || "Común";
    }
});

/* ============================================
   📌 2. MENÚ DESPLEGABLE (categorías)
============================================ */
document.addEventListener("DOMContentLoaded", () => {
    const menuBtn = document.getElementById("menuBtn");
    const menu = document.getElementById("menuPlegable");

    menuBtn?.addEventListener("click", () => {
        menu.classList.toggle("activo");
    });

    document.addEventListener("click", (e) => {
        if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
            menu.classList.remove("activo");
        }
    });
});

/* ============================================
   📌 3. FUNCIÓN PARA FORMATEAR NÚMEROS
============================================ */
function formatCurrency(num) {
    return num.toLocaleString("es-NI", {
        style: "currency",
        currency: "NIO"
    });
}

/* ============================================
   📌 4. CARRITO DE COMPRAS
============================================ */
document.addEventListener("DOMContentLoaded", () => {

    const listaCarrito = document.querySelector("[data-carrito]");
    const totalCarrito = document.querySelector("[data-total-carrito]");
    const carritoVacio = document.getElementById("carrito-vacio");

    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    const guardarCarrito = () => {
        localStorage.setItem("carrito", JSON.stringify(carrito));
    };

    const renderCarrito = () => {
        listaCarrito.innerHTML = "";
        
        if (carrito.length === 0) {
            carritoVacio.style.display = "block";
            totalCarrito.textContent = formatCurrency(0);
            return;
        }

        carritoVacio.style.display = "none";

        carrito.forEach((item, index) => {
            const div = document.createElement("div");
            div.className = "producto-carrito";
            div.innerHTML = `
                <img src="${item.imagen}" class="producto-img">
                <div>
                    <p>${item.nombre}</p>
                    <p>Cantidad: ${item.cantidad}</p>
                    <p>Subtotal: ${formatCurrency(item.precio * item.cantidad)}</p>
                </div>
                <button class="btn-eliminar" data-index="${index}">❌</button>
            `;
            listaCarrito.appendChild(div);
        });

        totalCarrito.textContent = formatCurrency(
            carrito.reduce((t, p) => t + p.precio * p.cantidad, 0)
        );
    };

    // Evento para eliminar producto
    listaCarrito.addEventListener("click", (e) => {
        if (e.target.matches(".btn-eliminar")) {
            carrito.splice(e.target.dataset.index, 1);
            guardarCarrito();
            renderCarrito();
        }
    });

    renderCarrito();

    /* Finalizar compra */
    const modal = document.getElementById("modal");
    const comprarBtn = document.getElementById("comprarBtn");
    const cerrarBtn = document.getElementById("cerrarBtn");

    comprarBtn?.addEventListener("click", () => {
        if (carrito.length === 0) return;
        modal.style.display = "flex";
        carrito = [];
        guardarCarrito();
        renderCarrito();
    });

    cerrarBtn?.addEventListener("click", () => {
        modal.style.display = "none";
    });
});

/* ============================================
   📌 5. BUSCADOR GLOBAL (filtra productos)
============================================ */
document.addEventListener("DOMContentLoaded", () => {
    const buscador = document.querySelector(".busqueda input");

    buscador?.addEventListener("input", () => {
        const query = buscador.value.toLowerCase();
        document.querySelectorAll(".producto").forEach(card => {
            const name = card.querySelector("h3").textContent.toLowerCase();
            card.style.display = name.includes(query) ? "flex" : "none";
        });
    });
});

// ================= CARRUSEL INFINITO =================
function setupInfiniteCarousel(imagesSelector, prevBtnSelector, nextBtnSelector, interval = 3000) {
    const imagesContainer = document.querySelector(imagesSelector);
    if (!imagesContainer) return;

    const slides = Array.from(imagesContainer.children);
    if (slides.length === 0) return;

    let index = 0;

    function showSlide(i) {
        imagesContainer.style.transition = 'transform 0.5s ease-in-out';
        imagesContainer.style.transform = `translateX(-${i * 100}%)`;
    }

    function nextSlide() {
        index = (index + 1) % slides.length;
        showSlide(index);
    }

    function prevSlide() {
        index = (index - 1 + slides.length) % slides.length;
        showSlide(index);
    }

    const nextBtn = document.querySelector(nextBtnSelector);
    const prevBtn = document.querySelector(prevBtnSelector);

    if (nextBtn) nextBtn.addEventListener('click', () => {
        nextSlide();
        resetInterval();
    });

    if (prevBtn) prevBtn.addEventListener('click', () => {
        prevSlide();
        resetInterval();
    });

    // Rotación automática
    let auto = setInterval(nextSlide, interval);

    // Reiniciar interval si se hace clic en botones
    function resetInterval() {
        clearInterval(auto);
        auto = setInterval(nextSlide, interval);
    }
}

// ==================== INICIALIZAR CARRUSELES ====================
document.addEventListener('DOMContentLoaded', () => {
    setupInfiniteCarousel('.carousel-images', '.prev', '.next');
    setupInfiniteCarousel('.carousel-images1', '.boton-carrusel1', '.boton-carrusel2');
    setupInfiniteCarousel('.carousel-images2', '.boton-carrusel3', '.boton-carrusel4');
    setupInfiniteCarousel('.carousel-images3', '.boton-carrusel5', '.boton-carrusel6');
    setupInfiniteCarousel('.carousel-images4', '.boton-carrusel7', '.boton-carrusel8');
    setupInfiniteCarousel('.carousel-images5', '.boton-carrusel9', '.boton-carrusel10');
});
