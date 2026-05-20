/* ============================================
   🛍️ ElectroShop — Principal JS
   Consolidated and optimized
============================================ */

document.addEventListener("DOMContentLoaded", () => {

    /* ============================================
       📌 1. MANEJO DE USUARIO (perfil + logout)
    ============================================ */
    const profileImg = document.getElementById("imagen");
    const infoBox = document.getElementById("info");
    const logoutBtn = document.getElementById("logoutBtn");
    const quickLogout = document.querySelector(".logout-action");

    // Mostrar/ocultar panel de usuario
    profileImg?.addEventListener("click", (e) => {
        e.stopPropagation();
        infoBox?.classList.toggle("visible");
    });

    // Cerrar panel al hacer clic fuera
    document.addEventListener("click", (e) => {
        if (infoBox && !infoBox.contains(e.target) && e.target !== profileImg) {
            infoBox.classList.remove("visible");
        }
    });

    // Logout unificado
    const logout = () => {
        localStorage.removeItem("usuario");
        sessionStorage.removeItem("NombreUsuario");
        sessionStorage.removeItem("tipoUsuario");
        window.location.href = "index.html";
    };

    logoutBtn?.addEventListener("click", logout);
    quickLogout?.addEventListener("click", logout);

    // Cargar datos del usuario
    const userName = sessionStorage.getItem("NombreUsuario");
    const userType = sessionStorage.getItem("tipoUsuario");
    if (userName) {
        const nameEl = document.getElementById("userName");
        const typeEl = document.getElementById("userType");
        if (nameEl) nameEl.textContent = userName;
        if (typeEl) typeEl.textContent = userType || "Común";
    }

    // Show admin panel link for admin users
    if (userType === "administrador") {
        const navBar = document.querySelector(".Ajustes-barra");
        if (navBar) {
            const adminLink = document.createElement("a");
            adminLink.href = "admin.html";
            adminLink.className = "nav-button-style";
            adminLink.textContent = "🛡️ Admin";
            adminLink.style.color = "#ffb700";
            adminLink.style.fontWeight = "600";
            navBar.appendChild(adminLink);
        }
    }


    /* ============================================
       📌 2. MENÚ DESPLEGABLE (categorías)
    ============================================ */
    const menuBtn = document.getElementById("menuBtn");
    const menu = document.getElementById("menuPlegable");

    menuBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        menu?.classList.toggle("activo");
    });

    document.addEventListener("click", (e) => {
        if (menu && !menu.contains(e.target) && e.target !== menuBtn) {
            menu.classList.remove("activo");
        }
    });

    /* ============================================
       📌 3. BUSCADOR GLOBAL (filtra productos)
    ============================================ */
    const buscador = document.querySelector(".busqueda input");

    buscador?.addEventListener("input", () => {
        const query = buscador.value.toLowerCase();
        document.querySelectorAll(".producto").forEach(card => {
            const nameEl = card.querySelector("h3");
            if (!nameEl) return;
            const name = nameEl.textContent.toLowerCase();
            card.closest(".tarjeta-producto").style.display = name.includes(query) ? "" : "none";
        });
    });

    /* ============================================
       📌 4. CARRITO DE COMPRAS (página carrito)
    ============================================ */
    const listaCarrito = document.querySelector("[data-carrito]");
    const totalCarrito = document.querySelector("[data-total-carrito]");
    const carritoVacio = document.getElementById("carrito-vacio");

    if (listaCarrito) {
        let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

        const guardarCarrito = () => {
            localStorage.setItem("carrito", JSON.stringify(carrito));
        };

        const renderCarrito = () => {
            listaCarrito.innerHTML = "";

            if (carrito.length === 0) {
                if (carritoVacio) carritoVacio.style.display = "flex";
                if (totalCarrito) totalCarrito.textContent = formatCurrency(0);
                return;
            }

            if (carritoVacio) carritoVacio.style.display = "none";

            carrito.forEach((item, index) => {
                const div = document.createElement("div");
                div.className = "tarjeta-carrito";

                // Use textContent instead of innerHTML for security
                const img = document.createElement("img");
                img.src = item.imagen;
                img.alt = item.nombre;

                const info = document.createElement("div");

                const pName = document.createElement("p");
                pName.textContent = item.nombre;
                pName.style.fontWeight = "600";

                const pQty = document.createElement("p");
                pQty.textContent = `Cantidad: ${item.cantidad || 1}`;

                const pSub = document.createElement("p");
                pSub.textContent = `Subtotal: ${formatCurrency(item.precio * (item.cantidad || 1))}`;

                info.append(pName, pQty, pSub);

                const btn = document.createElement("button");
                btn.className = "boton-eliminar";
                btn.textContent = "🗑️ Eliminar";
                btn.dataset.index = index;

                div.append(img, info, btn);
                listaCarrito.appendChild(div);
            });

            if (totalCarrito) {
                totalCarrito.textContent = formatCurrency(
                    carrito.reduce((t, p) => t + p.precio * (p.cantidad || 1), 0)
                );
            }
        };

        // Evento para eliminar producto
        listaCarrito.addEventListener("click", (e) => {
            if (e.target.matches(".boton-eliminar")) {
                carrito.splice(parseInt(e.target.dataset.index), 1);
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
            if (modal) modal.style.display = "flex";
            carrito = [];
            guardarCarrito();
            renderCarrito();
        });

        cerrarBtn?.addEventListener("click", () => {
            if (modal) modal.style.display = "none";
        });

        // --- PANEL DE DESEADOS ---
        const deseosLista = document.getElementById("deseos-lista");

        const renderDeseosPanel = async () => {
            if (!deseosLista) return;
            deseosLista.innerHTML = "";

            let listDeseos = [];
            const user = sessionStorage.getItem("NombreUsuario");
            if (user) {
                try {
                    const res = await fetch(`/api/usuarios/${user}/deseos`);
                    if (res.ok) {
                        listDeseos = await res.json();
                    }
                } catch (e) {
                    console.error("Error al obtener lista de deseos:", e);
                }
            } else {
                listDeseos = JSON.parse(localStorage.getItem("lista_deseos_local")) || [];
            }

            if (listDeseos.length === 0) {
                deseosLista.innerHTML = '<div class="deseos-vacio">No tienes productos en tu lista de deseos 🤍</div>';
                return;
            }

            try {
                const res = await fetch("/api/productos");
                if (res.ok) {
                    const todosProductos = await res.json();
                    const productosFavoritos = todosProductos.filter(p => listDeseos.includes(p.nombre));

                    if (productosFavoritos.length === 0) {
                        deseosLista.innerHTML = '<div class="deseos-vacio">No tienes productos en tu lista de deseos 🤍</div>';
                        return;
                    }

                    productosFavoritos.forEach(prod => {
                        const itemDiv = document.createElement("div");
                        itemDiv.className = "deseos-item";

                        const img = document.createElement("img");
                        img.src = prod.imagen;
                        img.alt = prod.nombre;

                        const infoDiv = document.createElement("div");
                        infoDiv.className = "deseos-item-info";

                        const nameP = document.createElement("p");
                        nameP.className = "deseos-item-nombre";
                        nameP.textContent = prod.nombre;

                        const priceP = document.createElement("p");
                        priceP.className = "deseos-item-precio";
                        priceP.textContent = formatCurrency(parseFloat(prod.precio));

                        infoDiv.append(nameP, priceP);

                        const actionsDiv = document.createElement("div");
                        actionsDiv.className = "deseos-item-acciones";

                        const btnAdd = document.createElement("button");
                        btnAdd.className = "btn-deseos-agregar";
                        btnAdd.textContent = "🛒 +";
                        btnAdd.title = "Agregar al carrito";

                        btnAdd.addEventListener("click", () => {
                            const producto = {
                                nombre: prod.nombre,
                                precio: parseFloat(prod.precio),
                                imagen: prod.imagen
                            };
                            
                            let localCarrito = JSON.parse(localStorage.getItem("carrito")) || [];
                            const existing = localCarrito.find(p => p.nombre === producto.nombre);
                            if (existing) {
                                existing.cantidad = (existing.cantidad || 1) + 1;
                            } else {
                                producto.cantidad = 1;
                                localCarrito.push(producto);
                            }
                            localStorage.setItem("carrito", JSON.stringify(localCarrito));
                            
                            carrito = localCarrito;
                            renderCarrito();
                            
                            btnAdd.textContent = "✓";
                            btnAdd.style.background = "#2ecc71";
                            setTimeout(() => {
                                btnAdd.textContent = "🛒 +";
                                btnAdd.style.background = "";
                            }, 1000);
                        });

                        const btnRemove = document.createElement("button");
                        btnRemove.className = "btn-deseos-eliminar";
                        btnRemove.innerHTML = "🗑️";
                        btnRemove.title = "Eliminar de favoritos";

                        btnRemove.addEventListener("click", async () => {
                            if (user) {
                                try {
                                    const delRes = await fetch(`/api/usuarios/${user}/deseos`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ producto: prod.nombre })
                                    });
                                    if (delRes.ok) {
                                        renderDeseosPanel();
                                    }
                                } catch (e) {
                                    console.error("Error al eliminar de deseos:", e);
                                }
                            } else {
                                let localDeseos = JSON.parse(localStorage.getItem("lista_deseos_local")) || [];
                                localDeseos = localDeseos.filter(name => name !== prod.nombre);
                                localStorage.setItem("lista_deseos_local", JSON.stringify(localDeseos));
                                renderDeseosPanel();
                            }
                        });

                        actionsDiv.append(btnAdd, btnRemove);
                        itemDiv.append(img, infoDiv, actionsDiv);
                        deseosLista.appendChild(itemDiv);
                    });
                }
            } catch (e) {
                console.error("Error rendering deseos:", e);
                deseosLista.innerHTML = '<div class="deseos-vacio">Error al cargar favoritos 😔</div>';
            }
        };

        renderDeseosPanel();
    }

    /* ============================================
       📌 5. CARRUSELES
    ============================================ */
    setupInfiniteCarousel('.carousel-images', '.prev', '.next');
    setupInfiniteCarousel('.carousel-images1', '.boton-carrusel1', '.boton-carrusel2');
    setupInfiniteCarousel('.carousel-images2', '.boton-carrusel3', '.boton-carrusel4');
    setupInfiniteCarousel('.carousel-images3', '.boton-carrusel5', '.boton-carrusel6');
    setupInfiniteCarousel('.carousel-images4', '.boton-carrusel7', '.boton-carrusel8');
    setupInfiniteCarousel('.carousel-images5', '.boton-carrusel9', '.boton-carrusel10');

}); // End DOMContentLoaded

/* ============================================
   🔧 UTILITY: Format Currency
============================================ */
function formatCurrency(num) {
    return num.toLocaleString("es-NI", {
        style: "currency",
        currency: "NIO"
    });
}

/* ============================================
   🎠 CARRUSEL INFINITO
============================================ */
function setupInfiniteCarousel(imagesSelector, prevBtnSelector, nextBtnSelector, interval = 3000) {
    const imagesContainer = document.querySelector(imagesSelector);
    if (!imagesContainer) return;

    const slides = Array.from(imagesContainer.children);
    if (slides.length === 0) return;

    let index = 0;

    function showSlide(i) {
        imagesContainer.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
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

    nextBtn?.addEventListener('click', () => {
        nextSlide();
        resetInterval();
    });

    prevBtn?.addEventListener('click', () => {
        prevSlide();
        resetInterval();
    });

    // Rotación automática
    let auto = setInterval(nextSlide, interval);

    function resetInterval() {
        clearInterval(auto);
        auto = setInterval(nextSlide, interval);
    }

    // Pausar al hover
    const carousel = imagesContainer.closest('.carousel, .carousel1, .carousel2, .carousel3, .carousel4, .carousel5');
    carousel?.addEventListener('mouseenter', () => clearInterval(auto));
    carousel?.addEventListener('mouseleave', () => {
        auto = setInterval(nextSlide, interval);
    });
}
