/* ============================================
   📦 ElectroShop — Página de Detalle de Producto
   Carga producto por ?id=X, vistas, relacionados,
   badges, stock en tiempo real
============================================ */

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    const productName = params.get('nombre');

    if (!productId && !productName) {
        document.getElementById('product-container').innerHTML = `
            <div class="product-error">
                <h2>Producto no encontrado</h2>
                <p>No se especificó un producto válido.</p>
                <a href="catalogo.html" class="btn-back">← Volver al catálogo</a>
            </div>`;
        return;
    }

    // Show skeleton while loading
    showSkeleton();

    try {
        let producto;

        if (productId) {
            producto = await API.get(`productos/${productId}`, false);
        } else {
            // Search by name
            const all = await API.get('productos', false);
            producto = all.find(p => p.nombre === decodeURIComponent(productName));
        }

        if (!producto) {
            throw new Error('Producto no encontrado');
        }

        // Increment view count
        if (producto.id) {
            API.post(`productos/${producto.id}/vista`, {}, false).catch(() => {});
        }

        // Fetch related products and discounts in parallel
        const [relacionados, descuentos] = await Promise.all([
            producto.id ? API.get(`productos/${producto.id}/relacionados?limit=4`, false).catch(() => []) : [],
            API.get('descuentos', false).catch(() => [])
        ]);

        renderProduct(producto, descuentos);
        renderRelated(relacionados, descuentos);
        setupSocketIO(producto.id);
        setupActions(producto);

    } catch (err) {
        console.error('Error loading product:', err);
        document.getElementById('product-container').innerHTML = `
            <div class="product-error">
                <h2>Error al cargar el producto</h2>
                <p>${err.message || 'Inténtalo de nuevo más tarde.'}</p>
                <a href="catalogo.html" class="btn-back">← Volver al catálogo</a>
            </div>`;
    }

    // === USER HEADER ===
    setupHeader();
});

function showSkeleton() {
    document.getElementById('product-container').innerHTML = `
        <div class="product-detail skeleton-active">
            <div class="product-image-section">
                <div class="skeleton skeleton-img"></div>
            </div>
            <div class="product-info-section">
                <div class="skeleton skeleton-badge" style="width:80px;height:24px;"></div>
                <div class="skeleton skeleton-title" style="height:32px;margin:12px 0;"></div>
                <div class="skeleton" style="height:16px;width:60%;margin-bottom:20px;"></div>
                <div class="skeleton" style="height:40px;width:50%;margin-bottom:20px;"></div>
                <div class="skeleton" style="height:16px;width:80%;margin-bottom:8px;"></div>
                <div class="skeleton" style="height:16px;width:70%;margin-bottom:8px;"></div>
                <div class="skeleton" style="height:16px;width:60%;margin-bottom:24px;"></div>
                <div style="display:flex;gap:12px;">
                    <div class="skeleton" style="height:48px;flex:1;border-radius:12px;"></div>
                    <div class="skeleton" style="height:48px;width:48px;border-radius:12px;"></div>
                </div>
            </div>
        </div>`;
}

function getBadges(producto, descuentos) {
    const badges = [];
    const stock = parseInt(producto.stock);
    
    // AGOTADO
    if (stock === 0) {
        badges.push({ text: 'AGOTADO', class: 'badge--agotado' });
    }
    // POCO STOCK
    else if (stock > 0 && stock <= 5) {
        badges.push({ text: `¡Solo ${stock}!`, class: 'badge--poco-stock' });
    }

    // NUEVO (less than 7 days)
    if (producto.fecha_creacion) {
        const created = new Date(producto.fecha_creacion);
        const now = new Date();
        const diffDays = (now - created) / (1000 * 60 * 60 * 24);
        if (diffDays <= 7) {
            badges.push({ text: 'NUEVO', class: 'badge--nuevo' });
        }
    }

    // OFERTA
    const descuento = descuentos.find(d => d.categoria === producto.categoria && d.activo);
    if (descuento) {
        badges.push({ text: `-${descuento.porcentaje}%`, class: 'badge--oferta' });
    }

    return badges;
}

function renderProduct(producto, descuentos) {
    const badges = getBadges(producto, descuentos);
    const stock = parseInt(producto.stock);
    const descuento = descuentos.find(d => d.categoria === producto.categoria && d.activo);
    const precioOriginal = parseFloat(producto.precio);
    const precioFinal = descuento ? precioOriginal * (1 - descuento.porcentaje / 100) : precioOriginal;

    const badgesHTML = badges.map(b => `<span class="product-badge ${b.class}">${b.text}</span>`).join('');

    // Stock indicator
    let stockHTML;
    if (stock === 0) {
        stockHTML = `<div class="stock-indicator stock--agotado"><span class="stock-dot"></span> Sin stock disponible</div>`;
    } else if (stock <= 5) {
        stockHTML = `<div class="stock-indicator stock--bajo"><span class="stock-dot"></span> <span id="stockCount">${stock}</span> unidades disponibles</div>`;
    } else {
        stockHTML = `<div class="stock-indicator stock--ok"><span class="stock-dot"></span> <span id="stockCount">${stock}</span> unidades disponibles</div>`;
    }

    // Format date
    let fechaHTML = '';
    if (producto.fecha_creacion) {
        const fecha = new Date(producto.fecha_creacion);
        fechaHTML = `<div class="product-meta-item"><span class="meta-icon">📅</span> Publicado: ${fecha.toLocaleDateString('es-NI', { year: 'numeric', month: 'long', day: 'numeric' })}</div>`;
    }

    const vistas = producto.vistas || 0;

    document.getElementById('product-container').innerHTML = `
        <a href="catalogo.html" class="btn-breadcrumb">← Catálogo</a>
        <div class="product-detail" data-product-id="${producto.id}">
            <div class="product-image-section">
                <div class="product-image-wrapper">
                    <div class="product-badges">${badgesHTML}</div>
                    <img src="${producto.imagen}" alt="${producto.nombre}" class="product-main-image" id="mainImage">
                </div>
            </div>
            <div class="product-info-section">
                <span class="product-category-tag">${producto.categoria}</span>
                <h1 class="product-title">${producto.nombre}</h1>
                
                <div class="product-price-block">
                    ${descuento 
                        ? `<span class="price-original">C$${precioOriginal.toLocaleString('es-NI', {minimumFractionDigits:2})}</span>
                           <span class="price-final">C$${precioFinal.toLocaleString('es-NI', {minimumFractionDigits:2})}</span>
                           <span class="price-discount">-${descuento.porcentaje}%</span>`
                        : `<span class="price-final">C$${precioOriginal.toLocaleString('es-NI', {minimumFractionDigits:2})}</span>`
                    }
                </div>

                ${stockHTML}

                <div class="product-description">
                    <h3>Descripción</h3>
                    <p>${producto.descripcion || 'Sin descripción disponible.'}</p>
                </div>

                <div class="product-meta">
                    <div class="product-meta-item"><span class="meta-icon">🏷️</span> Categoría: <strong>${producto.categoria}</strong></div>
                    <div class="product-meta-item"><span class="meta-icon">👁️</span> ${vistas.toLocaleString()} vista${vistas !== 1 ? 's' : ''}</div>
                    ${fechaHTML}
                </div>

                <div class="product-actions">
                    <button class="btn-add-cart" id="btnAddCart" ${stock === 0 ? 'disabled' : ''}>
                        <span class="btn-icon">🛒</span>
                        ${stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                    </button>
                    <button class="btn-add-wishlist" id="btnAddWishlist" title="Agregar a favoritos">
                        <span id="wishlistIcon">🤍</span>
                    </button>
                </div>
            </div>
        </div>`;

    // Update page title
    document.title = `${producto.nombre} — ElectroShop`;

    // Check if product is in wishlist
    checkWishlistStatus(producto);
}

function renderRelated(productos, descuentos) {
    const container = document.getElementById('related-container');
    if (!container || productos.length === 0) {
        if (container) container.style.display = 'none';
        return;
    }

    let html = `
        <div class="section-header-home">
            <div>
                <div class="section-title__accent"></div>
                <h2>También te puede interesar</h2>
            </div>
        </div>
        <div class="related-grid">`;

    productos.forEach(prod => {
        const badges = getBadges(prod, descuentos);
        const badgesHTML = badges.map(b => `<span class="product-badge ${b.class}">${b.text}</span>`).join('');
        const precio = parseFloat(prod.precio);
        const descuento = descuentos.find(d => d.categoria === prod.categoria && d.activo);
        const precioFinal = descuento ? precio * (1 - descuento.porcentaje / 100) : precio;

        html += `
            <a href="producto.html?id=${prod.id}" class="related-card">
                <div class="related-img-wrap">
                    <div class="product-badges">${badgesHTML}</div>
                    <img src="${prod.imagen}" alt="${prod.nombre}">
                </div>
                <div class="related-info">
                    <span class="related-cat">${prod.categoria}</span>
                    <h3>${prod.nombre}</h3>
                    <div class="related-price">
                        ${descuento 
                            ? `<span class="price-original-sm">C$${precio.toLocaleString('es-NI', {minimumFractionDigits:2})}</span>
                               <span>C$${precioFinal.toLocaleString('es-NI', {minimumFractionDigits:2})}</span>`
                            : `<span>C$${precio.toLocaleString('es-NI', {minimumFractionDigits:2})}</span>`
                        }
                    </div>
                </div>
            </a>`;
    });

    html += '</div>';
    container.innerHTML = html;
    container.style.display = 'block';
}

function setupSocketIO(productId) {
    if (typeof io === 'undefined') return;

    const socket = io();

    socket.on('stockActualizado', (data) => {
        if (data.id === productId) {
            const stockEl = document.getElementById('stockCount');
            const indicator = document.querySelector('.stock-indicator');
            const btn = document.getElementById('btnAddCart');
            const newStock = parseInt(data.stock);

            if (stockEl) {
                stockEl.textContent = newStock;

                // Flash animation
                stockEl.style.transition = 'none';
                stockEl.style.background = '#fbbf24';
                stockEl.style.color = '#000';
                stockEl.style.padding = '2px 8px';
                stockEl.style.borderRadius = '6px';
                setTimeout(() => {
                    stockEl.style.transition = 'all 0.5s ease';
                    stockEl.style.background = '';
                    stockEl.style.color = '';
                    stockEl.style.padding = '';
                }, 1500);
            }

            // Update indicator class
            if (indicator) {
                indicator.className = 'stock-indicator';
                if (newStock === 0) {
                    indicator.classList.add('stock--agotado');
                    indicator.innerHTML = '<span class="stock-dot"></span> Sin stock disponible';
                    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="btn-icon">🛒</span> Sin Stock'; }
                } else if (newStock <= 5) {
                    indicator.classList.add('stock--bajo');
                    indicator.innerHTML = `<span class="stock-dot"></span> <span id="stockCount">${newStock}</span> unidades disponibles`;
                    if (btn) { btn.disabled = false; btn.innerHTML = '<span class="btn-icon">🛒</span> Agregar al Carrito'; }
                } else {
                    indicator.classList.add('stock--ok');
                    indicator.innerHTML = `<span class="stock-dot"></span> <span id="stockCount">${newStock}</span> unidades disponibles`;
                    if (btn) { btn.disabled = false; btn.innerHTML = '<span class="btn-icon">🛒</span> Agregar al Carrito'; }
                }
            }

            if (typeof showToast !== 'undefined') {
                showToast(`Stock actualizado: ${newStock} unidades`, 'info');
            }
        }
    });
}

function setupActions(producto) {
    // Add to cart
    document.addEventListener('click', (e) => {
        const cartBtn = e.target.closest('#btnAddCart');
        if (!cartBtn || cartBtn.disabled) return;

        const productData = {
            nombre: producto.nombre,
            precio: parseFloat(producto.precio),
            imagen: producto.imagen
        };

        if (typeof API !== 'undefined' && !API.isLoggedIn()) {
            if (typeof requireAuth === 'function') {
                requireAuth('Inicia sesión para agregar productos al carrito', () => {
                    if (typeof agregarAlCarrito === 'function') {
                        agregarAlCarrito(productData);
                    } else {
                        let cart = JSON.parse(localStorage.getItem('carrito')) || [];
                        const existing = cart.find(p => p.nombre === productData.nombre);
                        if (existing) {
                            existing.cantidad = (existing.cantidad || 1) + 1;
                        } else {
                            productData.cantidad = 1;
                            cart.push(productData);
                        }
                        localStorage.setItem('carrito', JSON.stringify(cart));
                    }
                    if (typeof showToast !== 'undefined') {
                        showToast('Producto agregado al carrito', 'success');
                    }
                    cartBtn.innerHTML = '<span class="btn-icon">✓</span> Agregado';
                    cartBtn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
                    setTimeout(() => {
                        cartBtn.innerHTML = '<span class="btn-icon">🛒</span> Agregar al Carrito';
                        cartBtn.style.background = '';
                    }, 1500);
                }, { type: 'addToCart', data: productData });
                return;
            }
        }

        // Si ya está logueado, agregar directamente
        if (typeof agregarAlCarrito === 'function') {
            agregarAlCarrito(productData);
        } else {
            // Fallback: add directly to localStorage
            let cart = JSON.parse(localStorage.getItem('carrito')) || [];
            const existing = cart.find(p => p.nombre === productData.nombre);
            if (existing) {
                existing.cantidad = (existing.cantidad || 1) + 1;
            } else {
                productData.cantidad = 1;
                cart.push(productData);
            }
            localStorage.setItem('carrito', JSON.stringify(cart));
        }

        if (typeof showToast !== 'undefined') {
            showToast('Producto agregado al carrito', 'success');
        }

        // Visual feedback
        cartBtn.innerHTML = '<span class="btn-icon">✓</span> Agregado';
        cartBtn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
        setTimeout(() => {
            cartBtn.innerHTML = '<span class="btn-icon">🛒</span> Agregar al Carrito';
            cartBtn.style.background = '';
        }, 1500);
    });

    // Add to wishlist
    document.addEventListener('click', (e) => {
        const wishBtn = e.target.closest('#btnAddWishlist');
        if (!wishBtn) return;

        const productName = producto.nombre;

        if (API.isLoggedIn()) {
            toggleWishlist(productName, wishBtn);
        } else {
            // Save to local wishlist
            let localDeseos = JSON.parse(localStorage.getItem('lista_deseos_local')) || [];
            if (localDeseos.includes(productName)) {
                localDeseos = localDeseos.filter(n => n !== productName);
                document.getElementById('wishlistIcon').textContent = '🤍';
                if (typeof showToast !== 'undefined') showToast('Eliminado de favoritos', 'info');
            } else {
                localDeseos.push(productName);
                document.getElementById('wishlistIcon').textContent = '❤️';
                if (typeof showToast !== 'undefined') showToast('Agregado a favoritos', 'success');
            }
            localStorage.setItem('lista_deseos_local', JSON.stringify(localDeseos));
        }
    });
}

async function toggleWishlist(productName, btn) {
    const user = API.getUserName();
    try {
        const result = await API.post(`usuarios/${user}/deseos`, { producto: productName });
        const isInList = result.lista_deseos.includes(productName);
        document.getElementById('wishlistIcon').textContent = isInList ? '❤️' : '🤍';
        if (typeof showToast !== 'undefined') {
            showToast(isInList ? 'Agregado a favoritos' : 'Eliminado de favoritos', isInList ? 'success' : 'info');
        }
    } catch (err) {
        console.error('Error toggling wishlist:', err);
    }
}

async function checkWishlistStatus(producto) {
    try {
        let isInList = false;
        if (API.isLoggedIn()) {
            const user = API.getUserName();
            const deseos = await API.get(`usuarios/${user}/deseos`);
            isInList = deseos.includes(producto.nombre);
        } else {
            const localDeseos = JSON.parse(localStorage.getItem('lista_deseos_local')) || [];
            isInList = localDeseos.includes(producto.nombre);
        }
        const icon = document.getElementById('wishlistIcon');
        if (icon) icon.textContent = isInList ? '❤️' : '🤍';
    } catch (e) {
        // Silently fail
    }
}

function setupHeader() {
    const userName = sessionStorage.getItem('NombreUsuario');
    const userRol = sessionStorage.getItem('rolUsuario');
    const logoutAction = document.querySelector('.logout-action');
    const profileImg = document.getElementById('imagen');
    const infoBox = document.getElementById('info');

    if (!userName) {
        // Guest mode
        if (logoutAction) {
            logoutAction.textContent = '🔐 Iniciar Sesión';
            logoutAction.classList.remove('logout-action');
            logoutAction.classList.add('login-action');
            logoutAction.addEventListener('click', () => {
                if (typeof openAuthModal === 'function') {
                    openAuthModal('Inicia sesión en ElectroShop');
                } else {
                    window.location.href = 'index.html';
                }
            });
        }
        if (document.getElementById('userName')) {
            document.getElementById('userName').textContent = 'Invitado';
        }
    } else {
        if (document.getElementById('userName')) document.getElementById('userName').textContent = userName;
        if (document.getElementById('userType')) document.getElementById('userType').textContent = userRol || 'Común';
        
        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        const logout = () => API.logout();
        if (logoutBtn) logoutBtn.addEventListener('click', logout);
        if (logoutAction) logoutAction.addEventListener('click', logout);

        // Admin link
        if (userRol === 'administrador') {
            const navBar = document.querySelector('.Ajustes-barra');
            if (navBar && !navBar.querySelector('[href="admin.html"]')) {
                const adminLink = document.createElement('a');
                adminLink.href = 'admin.html';
                adminLink.className = 'nav-button-style';
                adminLink.textContent = '🛡️ Admin';
                adminLink.style.color = '#ffb700';
                adminLink.style.fontWeight = '600';
                navBar.appendChild(adminLink);
            }
        }
    }

    // Profile dropdown toggle
    profileImg?.addEventListener('click', (e) => {
        e.stopPropagation();
        infoBox?.classList.toggle('visible');
    });
    document.addEventListener('click', (e) => {
        if (infoBox && !infoBox.contains(e.target) && e.target !== profileImg) {
            infoBox.classList.remove('visible');
        }
    });
}
