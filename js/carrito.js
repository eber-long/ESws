/* ============================================
   🛒 ElectroShop — Carrito Flotante (Drawer)
============================================ */

let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

document.addEventListener('DOMContentLoaded', () => {
    inicializarCarrito();

    // Escuchar el evento personalizado de agregar al carrito (ej. desde el buscador)
    document.addEventListener('agregarAlCarrito', (e) => {
        if (e.detail) {
            agregarAlCarrito(e.detail);
        }
    });

    // Eventos para botones "Agregar al carrito"
    document.querySelectorAll('.boton-carrito').forEach(boton => {
        boton.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const tarjeta = this.closest('.tarjeta-producto');
            if (!tarjeta) return;

            const producto = {
                nombre: tarjeta.dataset.nombre,
                precio: parseFloat(tarjeta.dataset.precio),
                imagen: tarjeta.dataset.img
            };

            agregarAlCarrito(producto);

            // Visual feedback
            const originalText = this.textContent;
            this.textContent = '✓ Agregado';
            this.style.background = 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)';
            this.style.color = 'white';

            setTimeout(() => {
                this.textContent = originalText;
                this.style.background = '';
                this.style.color = '';
            }, 1200);
        });
    });
});

function inicializarCarrito() {
    const overlay = document.getElementById('cartOverlay');
    const drawer = document.getElementById('cartDrawer');
    const closeBtn = document.getElementById('cartCloseBtn');
    const headerBtn = document.getElementById('headerCartBtn');
    const checkoutBtn = document.getElementById('cartCheckoutBtn');

    // Toggle Drawer
    const toggleDrawer = () => {
        if (drawer) drawer.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
    };

    if (headerBtn) headerBtn.addEventListener('click', toggleDrawer);
    if (closeBtn) closeBtn.addEventListener('click', toggleDrawer);
    if (overlay) overlay.addEventListener('click', toggleDrawer);

    // Ir a pagar
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const currentCart = JSON.parse(localStorage.getItem('carrito')) || [];
            if (currentCart.length === 0) {
                alert('🛒 Tu carrito está vacío');
                return;
            }
            const total = currentCart.reduce((sum, p) => sum + p.precio * (p.cantidad || 1), 0);
            sessionStorage.setItem('carritoTotal', total);
            window.location.href = 'metpa.html';
        });
    }

    renderizarCarrito();
}

function agregarAlCarrito(producto) {
    // Proteger si es invitado/guest
    if (typeof API !== 'undefined' && !API.isLoggedIn()) {
        if (typeof requireAuth === 'function') {
            requireAuth('Inicia sesión para agregar productos al carrito', () => {
                agregarAlCarrito(producto);
            }, { type: 'addToCart', data: producto });
            return;
        }
    }

    const existing = carrito.find(p => p.nombre === producto.nombre);
    if (existing) {
        existing.cantidad = (existing.cantidad || 1) + 1;
    } else {
        producto.cantidad = 1;
        carrito.push(producto);
    }
    localStorage.setItem('carrito', JSON.stringify(carrito));
    renderizarCarrito();
    
    // Abrir drawer automáticamente al agregar
    const overlay = document.getElementById('cartOverlay');
    const drawer = document.getElementById('cartDrawer');
    if (drawer) drawer.classList.add('active');
    if (overlay) overlay.classList.add('active');
}

function renderizarCarrito() {
    const contenedor = document.getElementById('cartDrawerBody');
    const totalElem = document.getElementById('cartDrawerTotal');
    const badge = document.getElementById('headerCartBadge');
    
    carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    // Update Badge
    if (badge) {
        const totalItems = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);
        if (totalItems > 0) {
            badge.textContent = totalItems;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    if (!contenedor) return;

    contenedor.innerHTML = '';
    let suma = 0;

    if (carrito.length === 0) {
        contenedor.innerHTML = '<div class="cart-empty-message">Tu carrito está vacío 😔</div>';
        if (totalElem) totalElem.textContent = 'C$0.00';
        return;
    }

    carrito.forEach((producto, index) => {
        const item = document.createElement('div');
        item.classList.add('cart-item');

        const img = document.createElement('img');
        img.src = producto.imagen;
        img.alt = producto.nombre;

        const details = document.createElement('div');
        details.classList.add('cart-item-details');

        const title = document.createElement('h3');
        title.classList.add('cart-item-title');
        title.textContent = producto.nombre;

        const qty = document.createElement('div');
        qty.classList.add('cart-item-qty');
        qty.textContent = `Cant: ${producto.cantidad || 1}`;

        const price = document.createElement('p');
        price.classList.add('cart-item-price');
        const itemTotal = producto.precio * (producto.cantidad || 1);
        price.textContent = `C$${itemTotal.toLocaleString('es-NI', {minimumFractionDigits: 2})}`;

        const btnRemove = document.createElement('button');
        btnRemove.classList.add('cart-item-remove');
        btnRemove.innerHTML = '🗑️';
        btnRemove.dataset.index = index;

        btnRemove.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.index);
            carrito.splice(idx, 1);
            localStorage.setItem('carrito', JSON.stringify(carrito));
            renderizarCarrito();
        });

        details.append(title, qty, price);
        item.append(img, details, btnRemove);
        contenedor.appendChild(item);

        suma += itemTotal;
    });

    if (totalElem) {
        totalElem.textContent = `C$${suma.toLocaleString('es-NI', {minimumFractionDigits: 2})}`;
    }
}
