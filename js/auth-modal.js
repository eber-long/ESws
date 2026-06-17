/* ============================================
   🔐 ElectroShop — Auth Modal + Pending Actions
   Modal de login inline sin redirigir + 
   memoria de acciones pendientes
============================================ */

(function () {
    'use strict';

    // Inject modal HTML if it doesn't exist
    function ensureModal() {
        if (document.getElementById('authModal')) return;

        const modal = document.createElement('div');
        modal.id = 'authModal';
        modal.className = 'auth-modal-overlay';
        modal.innerHTML = `
            <div class="auth-modal-box">
                <button class="auth-modal-close" id="authModalClose">&times;</button>
                <div class="auth-modal-header">
                    <img src="imagen/ES.png" alt="ElectroShop" class="auth-modal-logo">
                    <h2 id="authModalTitle">Inicia sesión para continuar</h2>
                    <p class="auth-modal-subtitle" id="authModalSubtitle">Necesitas una cuenta para realizar esta acción</p>
                </div>
                <form id="authModalForm" class="auth-modal-form">
                    <div class="auth-modal-field">
                        <label for="authModalUser">Nombre de usuario</label>
                        <input type="text" id="authModalUser" required placeholder="Tu nombre de usuario" autocomplete="username">
                    </div>
                    <div class="auth-modal-field">
                        <label for="authModalPass">Contraseña</label>
                        <input type="password" id="authModalPass" required placeholder="Tu contraseña" autocomplete="current-password">
                    </div>
                    <div class="auth-modal-error" id="authModalError" style="display:none;"></div>
                    <button type="submit" class="auth-modal-btn" id="authModalSubmit">Iniciar Sesión</button>
                </form>
                <div class="auth-modal-footer">
                    <p>¿No tienes cuenta? <a href="Registro.html" class="auth-modal-link">Regístrate aquí</a></p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Events
        modal.querySelector('#authModalClose').addEventListener('click', closeAuthModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeAuthModal();
        });

        modal.querySelector('#authModalForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = document.getElementById('authModalUser').value.trim();
            const pass = document.getElementById('authModalPass').value;
            const errorEl = document.getElementById('authModalError');
            const submitBtn = document.getElementById('authModalSubmit');

            if (!user || !pass) {
                errorEl.textContent = 'Completa todos los campos';
                errorEl.style.display = 'block';
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Iniciando sesión...';
            errorEl.style.display = 'none';

            try {
                const data = await API.post('login', { nombre: user, contrasena: pass }, false);

                if (data.success && data.token) {
                    API.saveSession(data.token, data.usuario.nombre, data.usuario.rol);

                    if (typeof showToast !== 'undefined') {
                        showToast(`¡Bienvenido, ${data.usuario.nombre}!`, 'success');
                    }

                    closeAuthModal();

                    // Execute pending action
                    executePendingAction();

                    // Sync local wishlist to server
                    syncLocalWishlist(data.usuario.nombre);

                    // Update header UI
                    updateHeaderForUser(data.usuario.nombre, data.usuario.rol);
                }
            } catch (err) {
                errorEl.textContent = err.status === 401
                    ? 'Usuario o contraseña incorrectos'
                    : 'Error al conectar con el servidor';
                errorEl.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Iniciar Sesión';
            }
        });
    }

    // Inject styles
    if (!document.getElementById('auth-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'auth-modal-styles';
        style.textContent = `
            .auth-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.6);
                backdrop-filter: blur(6px);
                z-index: 99998;
                display: none;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .auth-modal-overlay.active {
                display: flex;
                opacity: 1;
            }
            .auth-modal-box {
                background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 20px;
                padding: 40px 36px;
                max-width: 420px;
                width: 90%;
                position: relative;
                box-shadow: 0 24px 80px rgba(0,0,0,0.5);
                animation: authModalIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes authModalIn {
                from { transform: translateY(30px) scale(0.95); opacity: 0; }
                to { transform: translateY(0) scale(1); opacity: 1; }
            }
            .auth-modal-close {
                position: absolute;
                top: 16px;
                right: 16px;
                background: rgba(255,255,255,0.08);
                border: none;
                color: #aaa;
                font-size: 22px;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .auth-modal-close:hover {
                background: rgba(255,255,255,0.15);
                color: #fff;
            }
            .auth-modal-header {
                text-align: center;
                margin-bottom: 28px;
            }
            .auth-modal-logo {
                width: 56px;
                height: 56px;
                border-radius: 12px;
                margin-bottom: 12px;
            }
            .auth-modal-header h2 {
                color: #fff;
                font-size: 20px;
                margin: 0 0 6px 0;
                font-weight: 700;
            }
            .auth-modal-subtitle {
                color: #8892b0;
                font-size: 13px;
                margin: 0;
            }
            .auth-modal-form {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .auth-modal-field label {
                display: block;
                color: #ccd6f6;
                font-size: 13px;
                font-weight: 600;
                margin-bottom: 6px;
            }
            .auth-modal-field input {
                width: 100%;
                padding: 12px 16px;
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 10px;
                color: #fff;
                font-size: 14px;
                transition: all 0.2s;
                box-sizing: border-box;
            }
            .auth-modal-field input:focus {
                outline: none;
                border-color: #6c63ff;
                box-shadow: 0 0 0 3px rgba(108,99,255,0.15);
            }
            .auth-modal-error {
                background: rgba(239,68,68,0.15);
                border: 1px solid rgba(239,68,68,0.3);
                color: #fca5a5;
                padding: 10px 14px;
                border-radius: 8px;
                font-size: 13px;
                text-align: center;
            }
            .auth-modal-btn {
                padding: 13px;
                background: linear-gradient(135deg, #6c63ff 0%, #5a52e0 100%);
                border: none;
                border-radius: 10px;
                color: #fff;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                margin-top: 4px;
            }
            .auth-modal-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 20px rgba(108,99,255,0.4);
            }
            .auth-modal-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }
            .auth-modal-footer {
                text-align: center;
                margin-top: 20px;
                color: #8892b0;
                font-size: 13px;
            }
            .auth-modal-link {
                color: #6c63ff;
                text-decoration: none;
                font-weight: 600;
            }
            .auth-modal-link:hover {
                text-decoration: underline;
            }
        `;
        document.head.appendChild(style);
    }

    /* ─── Public API ─── */

    window.openAuthModal = function (subtitle) {
        ensureModal();
        const modal = document.getElementById('authModal');
        if (subtitle) {
            document.getElementById('authModalSubtitle').textContent = subtitle;
        }
        // Reset form
        document.getElementById('authModalForm').reset();
        document.getElementById('authModalError').style.display = 'none';
        // Show
        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('active'));
        document.getElementById('authModalUser').focus();
    };

    function closeAuthModal() {
        const modal = document.getElementById('authModal');
        if (!modal) return;
        modal.classList.remove('active');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    }
    window.closeAuthModal = closeAuthModal;

    /* ─── Pending Actions ─── */

    window.setPendingAction = function (action) {
        sessionStorage.setItem('es_pending_action', JSON.stringify(action));
    };

    window.executePendingAction = function () {
        const raw = sessionStorage.getItem('es_pending_action');
        if (!raw) return;
        sessionStorage.removeItem('es_pending_action');

        try {
            const action = JSON.parse(raw);

            if (action.type === 'addToCart') {
                // Add to cart
                if (typeof agregarAlCarrito === 'function') {
                    agregarAlCarrito(action.data);
                    if (typeof showToast !== 'undefined') {
                        showToast('Producto agregado al carrito', 'success');
                    }
                }
            } else if (action.type === 'addToWishlist') {
                // Add to wishlist via API
                const user = API.getUserName();
                if (user && action.data && action.data.nombre) {
                    API.post(`usuarios/${user}/deseos`, { producto: action.data.nombre }).then(() => {
                        if (typeof showToast !== 'undefined') {
                            showToast('Producto agregado a favoritos', 'success');
                        }
                    }).catch(console.error);
                }
            } else if (action.type === 'checkout') {
                window.location.href = 'metpa.html';
            }
        } catch (e) {
            console.error('Error executing pending action:', e);
        }
    };

    /* ─── Require Auth Helper ─── */

    window.requireAuth = function (actionDescription, callback, pendingAction) {
        if (API.isLoggedIn()) {
            callback();
            return;
        }

        // Save pending action
        if (pendingAction) {
            setPendingAction(pendingAction);
        }

        // Show modal
        openAuthModal(actionDescription || 'Inicia sesión para continuar');
    };

    /* ─── Sync Local Wishlist ─── */

    async function syncLocalWishlist(userName) {
        const localDeseos = JSON.parse(localStorage.getItem('lista_deseos_local')) || [];
        if (localDeseos.length === 0) return;

        try {
            // Get current server wishlist
            const serverDeseos = await API.get(`usuarios/${userName}/deseos`);

            // Find items to sync
            const toSync = localDeseos.filter(item => !serverDeseos.includes(item));

            if (toSync.length > 0) {
                // Ask user
                const doSync = confirm(
                    `Tienes ${localDeseos.length} producto(s) en tu lista de deseos local.\n¿Deseas sincronizarlos con tu cuenta?`
                );

                if (doSync) {
                    for (const producto of toSync) {
                        await API.post(`usuarios/${userName}/deseos`, { producto });
                    }
                    if (typeof showToast !== 'undefined') {
                        showToast(`${toSync.length} favorito(s) sincronizados`, 'success');
                    }
                }
            }

            // Clear local wishlist
            localStorage.removeItem('lista_deseos_local');
        } catch (e) {
            console.error('Error syncing wishlist:', e);
        }
    }

    /* ─── Update Header for User ─── */

    window.updateHeaderForUser = function (nombre, rol) {
        const userNameEl = document.getElementById('userName');
        const userTypeEl = document.getElementById('userType');
        const profileImg = document.getElementById('imagen');
        const logoutAction = document.querySelector('.logout-action');
        const loginAction = document.querySelector('.login-action');

        if (userNameEl) userNameEl.textContent = nombre;
        if (userTypeEl) userTypeEl.textContent = rol || 'Común';

        // Switch login button to logout
        if (loginAction) {
            loginAction.textContent = '🚪 Cerrar';
            loginAction.classList.remove('login-action');
            loginAction.classList.add('logout-action');
            loginAction.onclick = () => {
                if (typeof API !== 'undefined') API.logout();
            };
        }

        // Show admin link
        if (rol === 'administrador') {
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
    };
})();
