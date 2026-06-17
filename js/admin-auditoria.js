/* ============================================
   🛡️ ElectroShop — Admin Auditoría JS (con JWT)
============================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ============================================
       🔐 ACCESS CONTROL — Verificar JWT y Admin
    ============================================ */
    const userName = API.getUserName();
    const userRol = API.getUserRol();

    if (!API.isLoggedIn() || userRol !== 'administrador') {
        alert('⛔ Acceso denegado. Solo administradores pueden acceder al panel de auditoría.');
        window.location.href = 'index.html';
        return;
    }

    // Mostrar nombre del admin
    const adminNameEl = document.getElementById('adminName');
    if (adminNameEl) adminNameEl.textContent = userName;

    /* ============================================
       🔄 CARGAR DATOS DE AUDITORÍA
    ============================================ */
    async function loadAuditLogs() {
        const tbody = document.getElementById('auditTableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--admin-text-muted);">
                    Cargando historial de auditoría...
                </td>
            </tr>
        `;

        try {
            const logs = await API.get('productos/auditoria-stock');
            renderAuditLogs(logs);
        } catch (err) {
            console.error('❌ Error cargando logs de auditoría:', err.message);
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: var(--admin-danger);">
                        ⚠️ Error al cargar los datos de auditoría: ${err.message}
                    </td>
                </tr>
            `;
        }
    }

    /* ============================================
       📊 RENDERIZAR TABLA DE AUDITORÍA
    ============================================ */
    function renderAuditLogs(logs) {
        const tbody = document.getElementById('auditTableBody');
        tbody.innerHTML = '';

        if (!logs || logs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: var(--admin-text-muted);">
                        No hay registros de auditoría de stock disponibles.
                    </td>
                </tr>
            `;
            return;
        }

        logs.forEach(log => {
            const tr = document.createElement('tr');
            
            // Formatear Fecha
            const fechaObj = new Date(log.fecha);
            const fechaFormateada = fechaObj.toLocaleString('es-NI', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            // Formatear Diferencia con Badge
            const dif = parseInt(log.diferencia);
            let diffHtml = '';
            if (dif > 0) {
                diffHtml = `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; font-weight: 600;">+${dif}</span>`;
            } else if (dif < 0) {
                diffHtml = `<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #f87171; font-weight: 600;">${dif}</span>`;
            } else {
                diffHtml = `<span class="badge" style="background: rgba(156, 163, 175, 0.15); color: #9ca3af; font-weight: 600;">0</span>`;
            }

            tr.innerHTML = `
                <td>${fechaFormateada}</td>
                <td><strong>${log.usuario || 'Sistema'}</strong></td>
                <td>${log.producto}</td>
                <td>${log.stock_anterior}</td>
                <td>${log.stock_nuevo}</td>
                <td>${diffHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Refresh button listener
    document.getElementById('btnRefreshAudit')?.addEventListener('click', loadAuditLogs);

    /* ============================================
       📱 MOBILE MENU
    ============================================ */
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');

    mobileMenuBtn?.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    });

    overlay?.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });

    /* ============================================
       🚪 LOGOUT
    ============================================ */
    document.getElementById('adminLogout')?.addEventListener('click', (e) => {
        e.preventDefault();
        API.logout();
    });

    // Cargar los datos al iniciar
    loadAuditLogs();
});
