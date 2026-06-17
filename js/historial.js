/* ============================================
   📋 ElectroShop — Historial de Pedidos JS
============================================ */

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('historial-container');
    
    // Setup header
    setupHistorialHeader();

    // Check if logged in
    if (!API.isLoggedIn()) {
        container.innerHTML = `
            <div class="login-required">
                <div style="font-size:64px;margin-bottom:16px;">🔐</div>
                <h3>Inicia sesión para ver tus pedidos</h3>
                <p>Necesitas una cuenta para acceder a tu historial de compras</p>
                <button class="btn-login-hist" onclick="openAuthModal('Inicia sesión para ver tus pedidos')">
                    Iniciar Sesión
                </button>
            </div>`;
        return;
    }

    // Show skeleton
    container.innerHTML = `
        <div class="skeleton-order"></div>
        <div class="skeleton-order"></div>
        <div class="skeleton-order"></div>`;

    try {
        const pedidos = await API.get('pedidos/mis-pedidos');

        if (pedidos.length === 0) {
            container.innerHTML = `
                <div class="historial-empty">
                    <div class="empty-icon">📦</div>
                    <h3>No tienes pedidos aún</h3>
                    <p>Cuando realices tu primera compra, aparecerá aquí</p>
                    <a href="catalogo.html">Explorar catálogo</a>
                </div>`;
            return;
        }

        container.innerHTML = '';

        pedidos.forEach((pedido, index) => {
            const card = document.createElement('div');
            card.className = 'order-card';
            card.style.animationDelay = `${index * 0.08}s`;

            const fecha = new Date(pedido.fecha).toLocaleDateString('es-NI', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            const productos = Array.isArray(pedido.productos) ? pedido.productos : [];
            const productsHTML = productos.map(p => `<span class="order-product-tag">${p}</span>`).join('');

            const statusClass = `status-${pedido.estado}`;

            card.innerHTML = `
                <div class="order-header">
                    <div>
                        <span class="order-code">${pedido.codigo}</span>
                        <span class="order-date">${fecha}</span>
                    </div>
                    <span class="order-status ${statusClass}">${pedido.estado}</span>
                </div>
                <div class="order-products">${productsHTML}</div>
                <div class="order-total">C$${parseFloat(pedido.total).toLocaleString('es-NI', {minimumFractionDigits:2})}</div>
            `;

            container.appendChild(card);
        });

    } catch (err) {
        console.error('Error loading orders:', err);
        container.innerHTML = `
            <div class="historial-empty">
                <div class="empty-icon">😔</div>
                <h3>Error al cargar pedidos</h3>
                <p>${err.message || 'Inténtalo de nuevo más tarde'}</p>
            </div>`;
    }
});

function setupHistorialHeader() {
    const userName = sessionStorage.getItem('NombreUsuario');
    const userRol = sessionStorage.getItem('rolUsuario');
    const logoutAction = document.querySelector('.logout-action');
    const profileImg = document.getElementById('imagen');
    const infoBox = document.getElementById('info');

    if (!userName) {
        if (logoutAction) {
            logoutAction.textContent = '🔐 Iniciar Sesión';
            logoutAction.classList.remove('logout-action');
            logoutAction.classList.add('login-action');
            logoutAction.addEventListener('click', () => {
                if (typeof openAuthModal === 'function') openAuthModal();
                else window.location.href = 'index.html';
            });
        }
    } else {
        if (document.getElementById('userName')) document.getElementById('userName').textContent = userName;
        if (document.getElementById('userType')) document.getElementById('userType').textContent = userRol || 'Común';
        
        const logoutBtn = document.getElementById('logoutBtn');
        const logout = () => API.logout();
        if (logoutBtn) logoutBtn.addEventListener('click', logout);
        if (logoutAction) logoutAction.addEventListener('click', logout);

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
