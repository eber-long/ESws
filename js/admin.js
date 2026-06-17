/* ============================================
   🛡️ ElectroShop — Admin Panel JS (con JWT)
============================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ============================================
       🔐 ACCESS CONTROL — Verificar JWT
    ============================================ */
    const userName = API.getUserName();
    const userRol = API.getUserRol();

    if (!API.isLoggedIn() || !API.isStaff()) {
        alert('⛔ Acceso denegado. No tienes permisos para acceder a este panel.');
        window.location.href = 'index.html';
        return;
    }

    // Show admin name
    const adminNameEl = document.getElementById('adminName');
    if (adminNameEl) adminNameEl.textContent = userName;

    /* ============================================
       📦 DATA
    ============================================ */
    let products = [];
    let users = [];
    let orders = [];
    let discounts = [];

    /* ============================================
       🔄 CARGAR DATOS DESDE API
    ============================================ */
    async function loadAllData() {
        try {
            const prods = await API.get('productos', false);
            const ords = await API.get('pedidos');
            const discs = await API.get('descuentos', false);

            let usrs = [];
            if (userRol === 'administrador') {
                try {
                    usrs = await API.get('usuarios');
                } catch (usrErr) {
                    console.error('No se pudieron cargar los usuarios:', usrErr);
                }
            }

            products = prods;
            users = usrs;
            orders = ords;
            discounts = discs;
            console.log('✅ Datos cargados desde API');
        } catch (err) {
            console.error('❌ Error cargando datos:', err.message);
            alert('Error al cargar datos. Verifica tu conexión.');
            return;
        }

        // Restricciones visuales de rol Vendedor
        if (userRol === 'ventas') {
            const usersLink = document.querySelector('.nav-link[data-section="users"]');
            if (usersLink) usersLink.style.display = 'none';

            const usersCard = document.querySelector('.stat-card:nth-child(2)');
            if (usersCard) usersCard.style.display = 'none';
        } else if (userRol === 'administrador') {
            const navAuditoria = document.getElementById('navAuditoria');
            if (navAuditoria) navAuditoria.style.display = 'flex';
        }

        updateDashboard();
        renderProducts();
        renderUsers();
        renderOrders();
        renderDiscounts();
        renderCharts();
        startOrderPolling();
    }

    /* ============================================
       📊 DASHBOARD
    ============================================ */
    function updateDashboard() {
        document.getElementById('statProducts').textContent = products.length;
        document.getElementById('statUsers').textContent = users.length;
        document.getElementById('statOrders').textContent = orders.length;

        const totalRevenue = orders
            .filter(o => o.estado === 'completado')
            .reduce((sum, o) => sum + parseFloat(o.total), 0);
        document.getElementById('statRevenue').textContent = `C$${totalRevenue.toLocaleString('es-NI')}`;

        // Stock alert banner
        const lowStockProducts = products.filter(p => parseInt(p.stock) < 5);
        const alertBanner = document.getElementById('stockAlertBanner');
        const alertCount = document.getElementById('stockAlertCount');
        const alertDesc = document.getElementById('stockAlertDesc');
        if (alertBanner) {
            if (lowStockProducts.length > 0) {
                alertBanner.style.display = 'flex';
                alertCount.textContent = lowStockProducts.length;
                const names = lowStockProducts.map(p => p.nombre).slice(0, 3).join(', ');
                const extra = lowStockProducts.length > 3 ? ` y ${lowStockProducts.length - 3} más` : '';
                alertDesc.textContent = `Stock bajo: ${names}${extra}`;
            } else {
                alertBanner.style.display = 'none';
            }
        }

        // Recent orders
        const tbody = document.getElementById('recentOrdersBody');
        tbody.innerHTML = '';
        orders.slice(0, 5).forEach(order => {
            const tr = document.createElement('tr');

            const statusClass = order.estado === 'completado' ? 'completed' :
                order.estado === 'pendiente' ? 'pending' : 'cancelled';
            const statusText = order.estado.charAt(0).toUpperCase() + order.estado.slice(1);
            const orderCode = order.codigo || order.id;

            tr.innerHTML = `
                <td><strong>${orderCode}</strong></td>
                <td>${order.cliente}</td>
                <td>C$${parseFloat(order.total).toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
                <td><span class="order-status"><span class="status-dot ${statusClass}"></span> ${statusText}</span></td>
                <td>${order.fecha}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    /* ============================================
       📦 PRODUCTS TABLE
    ============================================ */
    function renderProducts() {
        const tbody = document.getElementById('productsTableBody');
        tbody.innerHTML = '';

        products.forEach((prod, index) => {
            const tr = document.createElement('tr');
            const stockNum = parseInt(prod.stock);
            const isLowStock = stockNum < 5;

            if (isLowStock) {
                tr.classList.add('stock-low');
            }

            const stockDisplay = isLowStock
                ? `<span class="stock-badge-low ${stockNum === 0 ? 'stock-badge-critical' : ''}">⚠️ ${prod.stock}</span>`
                : `${prod.stock}`;

            tr.innerHTML = `
                <td>
                    <div class="product-cell">
                        <img src="${prod.imagen}" alt="${prod.nombre}" onerror="this.src='imagen/ES.png'">
                        <div>
                            <strong>${prod.nombre}</strong>
                            <div style="font-size:0.78rem;color:var(--admin-text-muted)">${prod.descripcion || ''}</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge badge-category">${prod.categoria}</span></td>
                <td>C$${parseFloat(prod.precio).toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
                <td>${stockDisplay}</td>
                <td>
                    <button class="btn btn-ghost btn-sm btn-edit-product" data-index="${index}">✏️</button>
                    ${userRol === 'administrador' 
                        ? `<button class="btn btn-danger btn-sm btn-delete-product" data-index="${index}">🗑️</button>` 
                        : ''
                    }
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Edit buttons
        document.querySelectorAll('.btn-edit-product').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index);
                openProductModal(idx);
            });
        });

        // Delete buttons
        document.querySelectorAll('.btn-delete-product').forEach(btn => {
            btn.addEventListener('click', async () => {
                const idx = parseInt(btn.dataset.index);
                if (!confirm(`¿Eliminar "${products[idx].nombre}"?`)) return;

                try {
                    if (products[idx].id) {
                        await API.delete(`productos/${products[idx].id}`);
                    }
                    products.splice(idx, 1);
                    renderProducts();
                    updateDashboard();
                } catch (err) {
                    console.error('Error eliminando producto:', err);
                    alert('Error al eliminar producto: ' + err.message);
                }
            });
        });
    }

    /* ============================================
       👥 USERS TABLE
    ============================================ */
    function renderUsers() {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';

        users.forEach((user, index) => {
            const tr = document.createElement('tr');
            const badgeClass = user.rol === 'administrador' ? 'badge-admin' : 
                               (user.rol === 'ventas' ? 'badge-vendedor' : 'badge-user');
            const typeLabel = user.rol === 'administrador' ? 'Admin' : 
                              (user.rol === 'ventas' ? 'Ventas' : 'Común');

            tr.innerHTML = `
                <td><strong>${user.nombre}</strong></td>
                <td><span class="badge ${badgeClass}">${typeLabel}</span></td>
                <td><span class="badge badge-active">Activo</span></td>
                <td>
                    <button class="btn btn-ghost btn-sm btn-edit-user" data-index="${index}">✏️</button>
                    <button class="btn btn-danger btn-sm btn-delete-user" data-index="${index}">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Edit buttons
        document.querySelectorAll('.btn-edit-user').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index);
                openUserModal(idx);
            });
        });

        // Delete buttons
        document.querySelectorAll('.btn-delete-user').forEach(btn => {
            btn.addEventListener('click', async () => {
                const idx = parseInt(btn.dataset.index);
                if (users[idx].nombre === userName) {
                    alert('⚠️ No puedes eliminarte a ti mismo.');
                    return;
                }
                if (!confirm(`¿Eliminar usuario "${users[idx].nombre}"?`)) return;

                try {
                    if (users[idx].id) {
                        await API.delete(`usuarios/${users[idx].id}`);
                    }
                    users.splice(idx, 1);
                    renderUsers();
                    updateDashboard();
                } catch (err) {
                    console.error('Error eliminando usuario:', err);
                    alert('Error al eliminar usuario: ' + err.message);
                }
            });
        });
    }

    /* ============================================
       🧾 ORDERS TABLE
    ============================================ */
    function renderOrders() {
        const tbody = document.getElementById('ordersTableBody');
        tbody.innerHTML = '';

        orders.forEach((order, index) => {
            const tr = document.createElement('tr');
            const statusClass = order.estado === 'completado' ? 'completed' :
                order.estado === 'pendiente' ? 'pending' : 'cancelled';
            const statusText = order.estado.charAt(0).toUpperCase() + order.estado.slice(1);
            const orderCode = order.codigo || order.id;
            const productsList = Array.isArray(order.productos) ? order.productos.join(', ') : order.productos;

            const actionsHTML = `
                <div style="display: inline-flex; gap: 8px; align-items: center;">
                    <select class="btn btn-ghost btn-sm order-status-select" data-index="${index}" style="padding:4px 8px;font-size:0.75rem;">
                        <option value="pendiente" ${order.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="completado" ${order.estado === 'completado' ? 'selected' : ''}>Completado</option>
                        <option value="cancelado" ${order.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                    </select>
                    ${order.estado === 'pendiente' 
                        ? `<button class="btn btn-primary btn-sm btn-confirm-order" data-index="${index}" style="padding: 4px 8px; font-size: 0.75rem;">Confirmar</button>` 
                        : ''
                    }
                    ${order.estado === 'completado' 
                        ? `<button class="btn btn-ghost btn-sm btn-download-invoice" data-index="${index}" style="padding: 4px 8px; font-size: 0.75rem;" title="Descargar Factura">📥 PDF</button>
                           <button class="btn btn-ghost btn-sm btn-send-invoice" data-index="${index}" style="padding: 4px 8px; font-size: 0.75rem;" title="Enviar por Correo">✉️ Enviar</button>` 
                        : ''
                    }
                </div>
            `;

            tr.innerHTML = `
                <td><strong>${orderCode}</strong></td>
                <td>${order.cliente}</td>
                <td>${productsList}</td>
                <td>C$${parseFloat(order.total).toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
                <td><span class="order-status"><span class="status-dot ${statusClass}"></span> ${statusText}</span></td>
                <td>${order.fecha}</td>
                <td>${actionsHTML}</td>
            `;
            tbody.appendChild(tr);
        });

        // Status change
        document.querySelectorAll('.order-status-select').forEach(sel => {
            sel.addEventListener('change', async () => {
                const idx = parseInt(sel.dataset.index);
                const newEstado = sel.value;

                try {
                    if (orders[idx].id) {
                        const result = await API.put(`pedidos/${orders[idx].id}`, { estado: newEstado });
                        orders[idx] = result.pedido || { ...orders[idx], estado: newEstado };
                    } else {
                        orders[idx].estado = newEstado;
                    }
                    renderOrders();
                    updateDashboard();
                } catch (err) {
                    console.error('Error actualizando pedido:', err);
                    alert('Error al actualizar estado del pedido: ' + err.message);
                }
            });
        });

        // Confirm order buttons
        document.querySelectorAll('.btn-confirm-order').forEach(btn => {
            btn.addEventListener('click', async () => {
                const idx = parseInt(btn.dataset.index);
                const order = orders[idx];

                if (!confirm(`¿Confirmar venta para el pedido ${order.codigo || order.id}?`)) return;

                btn.disabled = true;
                btn.textContent = 'Procesando...';

                try {
                    const res = await API.post(`pedidos/${order.id}/confirmar`, {});
                    if (res.success) {
                        alert('✅ Venta confirmada correctamente.');
                        orders[idx] = res.pedido;
                        renderOrders();
                        updateDashboard();
                    }
                } catch (err) {
                    console.error('Error al confirmar pedido:', err);
                    alert('Error al confirmar pedido: ' + err.message);
                    btn.disabled = false;
                    btn.textContent = 'Confirmar';
                }
            });
        });

        // Download invoice buttons
        document.querySelectorAll('.btn-download-invoice').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index);
                const order = orders[idx];
                window.open(`/api/facturas/${order.id}?token=${API.getToken()}`, '_blank');
            });
        });

        // Send invoice buttons
        document.querySelectorAll('.btn-send-invoice').forEach(btn => {
            btn.addEventListener('click', async () => {
                const idx = parseInt(btn.dataset.index);
                const order = orders[idx];

                btn.disabled = true;
                btn.textContent = 'Enviando...';

                try {
                    const res = await API.post(`facturas/${order.id}/enviar`, {});
                    alert(res.message || 'Factura enviada correctamente.');
                } catch (err) {
                    console.error('Error al enviar factura:', err);
                    alert('Error al enviar factura: ' + err.message);
                } finally {
                    btn.disabled = false;
                    btn.textContent = '✉️ Enviar';
                }
            });
        });
    }

    /* ============================================
       📋 NAVIGATION
    ============================================ */
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    const sections = document.querySelectorAll('.admin-section');
    const pageTitle = document.getElementById('pageTitle');

    const sectionTitles = {
        dashboard: 'Dashboard',
        products: 'Productos',
        users: 'Usuarios',
        orders: 'Pedidos',
        discounts: 'Descuento'
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.section;

            // Update active nav
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show section
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(`section-${target}`)?.classList.add('active');

            // Update title
            pageTitle.textContent = sectionTitles[target] || 'Dashboard';

            // Close mobile sidebar
            document.getElementById('adminSidebar').classList.remove('open');
            document.getElementById('sidebarOverlay').classList.remove('active');
        });
    });

    /* ============================================
       📱 MOBILE SIDEBAR
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
       📦 PRODUCT MODAL
    ============================================ */
    const productModal = document.getElementById('productModal');
    const productForm = document.getElementById('productForm');
    let selectedImageFile = null;
    let imageUploadMode = 'file'; // 'file' or 'url'

    // Upload mode toggle
    const btnModeUpload = document.getElementById('btnModeUpload');
    const btnModeUrl = document.getElementById('btnModeUrl');
    const uploadModeFile = document.getElementById('uploadModeFile');
    const uploadModeUrl = document.getElementById('uploadModeUrl');

    btnModeUpload?.addEventListener('click', () => {
        imageUploadMode = 'file';
        btnModeUpload.classList.add('active');
        btnModeUrl.classList.remove('active');
        uploadModeFile.style.display = 'block';
        uploadModeUrl.style.display = 'none';
    });

    btnModeUrl?.addEventListener('click', () => {
        imageUploadMode = 'url';
        btnModeUrl.classList.add('active');
        btnModeUpload.classList.remove('active');
        uploadModeFile.style.display = 'none';
        uploadModeUrl.style.display = 'block';
    });

    // Image file input + preview + drag & drop
    const imageFileInput = document.getElementById('prodImageFile');
    const imagePreview = document.getElementById('imagePreview');
    const imageDropzone = document.getElementById('imageDropzone');

    imageFileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedImageFile = file;
            const reader = new FileReader();
            reader.onload = (ev) => {
                imagePreview.src = ev.target.result;
                imagePreview.classList.add('active');
                imageDropzone.classList.add('has-image');
            };
            reader.readAsDataURL(file);
        }
    });

    imageDropzone?.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageDropzone.classList.add('dragover');
    });
    imageDropzone?.addEventListener('dragleave', () => {
        imageDropzone.classList.remove('dragover');
    });
    imageDropzone?.addEventListener('drop', (e) => {
        e.preventDefault();
        imageDropzone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            selectedImageFile = file;
            imageFileInput.files = e.dataTransfer.files;
            const reader = new FileReader();
            reader.onload = (ev) => {
                imagePreview.src = ev.target.result;
                imagePreview.classList.add('active');
                imageDropzone.classList.add('has-image');
            };
            reader.readAsDataURL(file);
        }
    });

    async function uploadImage(file) {
        const formData = new FormData();
        formData.append('imagen', file);
        const data = await API.upload('productos/upload', formData);
        return data.path;
    }

    function resetImageUpload() {
        selectedImageFile = null;
        if (imagePreview) {
            imagePreview.src = '';
            imagePreview.classList.remove('active');
        }
        if (imageDropzone) imageDropzone.classList.remove('has-image');
        if (imageFileInput) imageFileInput.value = '';
    }

    function openProductModal(editIndex = -1) {
        document.getElementById('prodEditIndex').value = editIndex;
        resetImageUpload();

        if (editIndex >= 0) {
            const prod = products[editIndex];
            document.getElementById('productModalTitle').textContent = 'Editar Producto';
            document.getElementById('prodName').value = prod.nombre;
            document.getElementById('prodCategory').value = prod.categoria;
            document.getElementById('prodPrice').value = prod.precio;
            document.getElementById('prodStock').value = prod.stock;
            document.getElementById('prodDesc').value = prod.descripcion || '';
            // Show current image in preview
            if (prod.imagen) {
                imagePreview.src = prod.imagen;
                imagePreview.classList.add('active');
                imageDropzone?.classList.add('has-image');
            }
            const prodImageEl = document.getElementById('prodImage');
            if (prodImageEl) prodImageEl.value = prod.imagen || '';
        } else {
            document.getElementById('productModalTitle').textContent = 'Agregar Producto';
            productForm.reset();
        }

        // Reset to file upload mode
        imageUploadMode = 'file';
        btnModeUpload?.classList.add('active');
        btnModeUrl?.classList.remove('active');
        if (uploadModeFile) uploadModeFile.style.display = 'block';
        if (uploadModeUrl) uploadModeUrl.style.display = 'none';

        productModal.classList.add('active');
    }

    function closeProductModalFn() {
        productModal.classList.remove('active');
        productForm.reset();
        resetImageUpload();
    }

    document.getElementById('btnAddProduct')?.addEventListener('click', () => openProductModal());
    document.getElementById('closeProductModal')?.addEventListener('click', closeProductModalFn);
    document.getElementById('cancelProductModal')?.addEventListener('click', closeProductModalFn);

    document.getElementById('saveProduct')?.addEventListener('click', async () => {
        const name = document.getElementById('prodName').value.trim();
        const category = document.getElementById('prodCategory').value;
        const price = parseFloat(document.getElementById('prodPrice').value);
        const stock = parseInt(document.getElementById('prodStock').value);
        const desc = document.getElementById('prodDesc').value.trim();
        const editIdx = parseInt(document.getElementById('prodEditIndex').value);

        if (!name || !category || isNaN(price) || isNaN(stock)) {
            alert('Por favor completa todos los campos requeridos.');
            return;
        }

        let imagePath = 'imagen/ES.png';

        try {
            // Upload image if file selected
            if (imageUploadMode === 'file' && selectedImageFile) {
                imagePath = await uploadImage(selectedImageFile);
            } else if (imageUploadMode === 'url') {
                const urlVal = document.getElementById('prodImage')?.value.trim();
                imagePath = urlVal || 'imagen/ES.png';
            } else if (editIdx >= 0 && products[editIdx].imagen) {
                imagePath = products[editIdx].imagen;
            }

            const productData = {
                nombre: name,
                categoria: category,
                precio: price,
                stock: stock,
                imagen: imagePath,
                descripcion: desc
            };

            if (editIdx >= 0 && products[editIdx].id) {
                const result = await API.put(`productos/${products[editIdx].id}`, productData);
                products[editIdx] = result.producto || result;
            } else {
                const result = await API.post('productos', productData);
                products.push(result.producto || result);
            }

            renderProducts();
            updateDashboard();
            renderCharts();
            closeProductModalFn();
        } catch (err) {
            console.error('Error guardando producto:', err);
            alert('Error al guardar producto: ' + err.message);
        }
    });

    /* ============================================
       👤 USER MODAL
    ============================================ */
    const userModal = document.getElementById('userModal');
    const userForm = document.getElementById('userForm');

    function openUserModal(editIndex = -1) {
        document.getElementById('userEditIndex').value = editIndex;

        if (editIndex >= 0) {
            const user = users[editIndex];
            document.getElementById('userModalTitle').textContent = 'Editar Usuario';
            document.getElementById('userNameInput').value = user.nombre;
            document.getElementById('userPass').value = ''; // No mostrar contraseña hasheada
            document.getElementById('userPass').placeholder = 'Dejar vacío para no cambiar';
            document.getElementById('userTypeSelect').value = user.rol || 'comun';
        } else {
            document.getElementById('userModalTitle').textContent = 'Agregar Usuario';
            document.getElementById('userPass').placeholder = 'Contraseña';
            userForm.reset();
        }

        userModal.classList.add('active');
    }

    function closeUserModalFn() {
        userModal.classList.remove('active');
        userForm.reset();
    }

    document.getElementById('btnAddUser')?.addEventListener('click', () => openUserModal());
    document.getElementById('closeUserModal')?.addEventListener('click', closeUserModalFn);
    document.getElementById('cancelUserModal')?.addEventListener('click', closeUserModalFn);

    document.getElementById('saveUser')?.addEventListener('click', async () => {
        const name = document.getElementById('userNameInput').value.trim();
        const pass = document.getElementById('userPass').value;
        const type = document.getElementById('userTypeSelect').value;
        const editIdx = parseInt(document.getElementById('userEditIndex').value);

        if (!name || !type) {
            alert('Por favor completa nombre y rol.');
            return;
        }

        // Para nuevo usuario, contraseña es obligatoria
        if (editIdx < 0 && !pass) {
            alert('La contraseña es obligatoria para nuevos usuarios.');
            return;
        }

        const userData = { nombre: name, rol: type };
        // Solo enviar contraseña si se escribió una
        if (pass) userData.contrasena = pass;

        try {
            if (editIdx >= 0 && users[editIdx].id) {
                const result = await API.put(`usuarios/${users[editIdx].id}`, userData);
                users[editIdx] = result.usuario || result;
            } else {
                const result = await API.post('usuarios', userData);
                users.push(result.usuario || result);
            }

            renderUsers();
            updateDashboard();
            closeUserModalFn();
        } catch (err) {
            console.error('Error guardando usuario:', err);
            alert('Error al guardar usuario: ' + err.message);
        }
    });

    /* ============================================
       🚪 LOGOUT
    ============================================ */
    document.getElementById('adminLogout')?.addEventListener('click', (e) => {
        e.preventDefault();
        API.logout();
    });

    /* ============================================
       🏷️ DISCOUNTS TABLE
    ============================================ */
    function renderDiscounts() {
        const tbody = document.getElementById('discountsTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (discounts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4">
                        <div class="discounts-empty">
                            <div class="empty-icon">🏷️</div>
                            <p>No hay descuentos configurados</p>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        discounts.forEach((disc) => {
            const tr = document.createElement('tr');
            const isActive = disc.activo;
            const statusBadge = isActive
                ? '<span class="badge badge-discount-active">Activo</span>'
                : '<span class="badge badge-discount-inactive">Inactivo</span>';

            tr.innerHTML = `
                <td><span class="badge badge-category">${disc.categoria}</span></td>
                <td><span class="discount-percent">🏷️ ${parseFloat(disc.porcentaje)}% OFF</span></td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-toggle-discount" data-id="${disc.id}" title="${isActive ? 'Desactivar' : 'Activar'}">
                        ${isActive ? '⏸️ Pausar' : '▶️ Activar'}
                    </button>
                    <button class="btn btn-ghost btn-sm btn-edit-discount" data-id="${disc.id}">✏️</button>
                    <button class="btn btn-danger btn-sm btn-delete-discount" data-id="${disc.id}">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Toggle active/inactive
        document.querySelectorAll('.btn-toggle-discount').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const disc = discounts.find(d => String(d.id) === id);
                if (!disc) return;

                try {
                    const result = await API.put(`descuentos/${id}`, { activo: !disc.activo });
                    const idx = discounts.findIndex(d => String(d.id) === id);
                    if (idx >= 0) discounts[idx] = result.descuento || result;
                    renderDiscounts();
                    showToast('🏷️ Descuento actualizado', `${disc.categoria} ${!disc.activo ? 'activado' : 'pausado'}`, 'success');
                } catch (err) {
                    console.error('Error toggling descuento:', err);
                    alert('Error al actualizar descuento: ' + err.message);
                }
            });
        });

        // Edit buttons
        document.querySelectorAll('.btn-edit-discount').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const disc = discounts.find(d => String(d.id) === id);
                if (disc) openDiscountModal(disc);
            });
        });

        // Delete buttons
        document.querySelectorAll('.btn-delete-discount').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const disc = discounts.find(d => String(d.id) === id);
                if (!disc) return;
                if (!confirm(`¿Eliminar descuento de "${disc.categoria}"?`)) return;

                try {
                    await API.delete(`descuentos/${id}`);
                    discounts = discounts.filter(d => String(d.id) !== id);
                    renderDiscounts();
                    showToast('🗑️ Descuento eliminado', disc.categoria, 'success');
                } catch (err) {
                    console.error('Error eliminando descuento:', err);
                    alert('Error al eliminar descuento: ' + err.message);
                }
            });
        });
    }

    /* ============================================
       🏷️ DISCOUNT MODAL
    ============================================ */
    const discountModal = document.getElementById('discountModal');
    const discountForm = document.getElementById('discountForm');
    const discountActiveCheckbox = document.getElementById('discountActive');
    const discountActiveLabel = document.getElementById('discountActiveLabel');

    // Update toggle label text
    discountActiveCheckbox?.addEventListener('change', () => {
        if (discountActiveLabel) {
            discountActiveLabel.textContent = discountActiveCheckbox.checked ? 'Activo' : 'Inactivo';
        }
    });

    function openDiscountModal(editDiscount = null) {
        if (editDiscount) {
            document.getElementById('discountModalTitle').textContent = 'Editar Descuento';
            document.getElementById('discountCategory').value = editDiscount.categoria;
            document.getElementById('discountPercent').value = editDiscount.porcentaje;
            discountActiveCheckbox.checked = editDiscount.activo;
            document.getElementById('discountEditId').value = editDiscount.id;
        } else {
            document.getElementById('discountModalTitle').textContent = 'Agregar Descuento';
            discountForm.reset();
            discountActiveCheckbox.checked = true;
            document.getElementById('discountEditId').value = '-1';
        }

        if (discountActiveLabel) {
            discountActiveLabel.textContent = discountActiveCheckbox.checked ? 'Activo' : 'Inactivo';
        }

        discountModal.classList.add('active');
    }

    function closeDiscountModalFn() {
        discountModal.classList.remove('active');
        discountForm.reset();
    }

    document.getElementById('btnAddDiscount')?.addEventListener('click', () => openDiscountModal());
    document.getElementById('closeDiscountModal')?.addEventListener('click', closeDiscountModalFn);
    document.getElementById('cancelDiscountModal')?.addEventListener('click', closeDiscountModalFn);

    document.getElementById('saveDiscount')?.addEventListener('click', async () => {
        const categoria = document.getElementById('discountCategory').value;
        const porcentaje = parseFloat(document.getElementById('discountPercent').value);
        const activo = discountActiveCheckbox.checked;
        const editId = document.getElementById('discountEditId').value;

        if (!categoria) {
            alert('Por favor selecciona una categoría.');
            return;
        }
        if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
            alert('El porcentaje debe ser un número entre 0 y 100.');
            return;
        }

        const discountData = { categoria, porcentaje, activo };

        try {
            if (editId !== '-1') {
                const result = await API.put(`descuentos/${editId}`, discountData);
                const idx = discounts.findIndex(d => String(d.id) === editId);
                if (idx >= 0) discounts[idx] = result.descuento || result;
                showToast('✅ Descuento actualizado', `${categoria}: ${porcentaje}% OFF`, 'success');
            } else {
                const result = await API.post('descuentos', discountData);
                discounts.push(result.descuento || result);
                showToast('✅ Descuento creado', `${categoria}: ${porcentaje}% OFF`, 'success');
            }

            renderDiscounts();
            closeDiscountModalFn();
        } catch (err) {
            console.error('Error guardando descuento:', err);
            alert('Error al guardar descuento: ' + err.message);
        }
    });

    /* ============================================
       📊 CHARTS — Ventas Generales y por Categoría
    ============================================ */
    let salesChartInstance = null;
    let categoryChartInstance = null;

    function renderCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js no está cargado');
            return;
        }

        renderSalesChart();
        renderCategoryChart();
    }

    function renderSalesChart() {
        const canvas = document.getElementById('salesChart');
        if (!canvas) return;

        if (salesChartInstance) salesChartInstance.destroy();

        // Group completed orders by month
        const completedOrders = orders.filter(o => o.estado === 'completado');
        const monthlyData = {};
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        completedOrders.forEach(o => {
            const date = new Date(o.fecha);
            const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
            const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            if (!monthlyData[key]) monthlyData[key] = { label, total: 0 };
            monthlyData[key].total += parseFloat(o.total);
        });

        const sorted = Object.keys(monthlyData).sort();
        const labels = sorted.map(k => monthlyData[k].label);
        const data = sorted.map(k => monthlyData[k].total);

        // If no data, show total as single bar
        if (labels.length === 0) {
            labels.push('Sin ventas');
            data.push(0);
        }

        salesChartInstance = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Ingresos (C$)',
                    data,
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#182635',
                        titleColor: '#e0e6ed',
                        bodyColor: '#e0e6ed',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        callbacks: {
                            label: ctx => `C$ ${ctx.raw.toLocaleString('es-NI', { minimumFractionDigits: 2 })}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: {
                            color: '#7a8a9e',
                            callback: v => `C$${(v / 1000).toFixed(0)}k`
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#7a8a9e' }
                    }
                }
            }
        });
    }

    function renderCategoryChart() {
        const canvas = document.getElementById('categoryChart');
        if (!canvas) return;

        if (categoryChartInstance) categoryChartInstance.destroy();

        // Calculate sales by category from completed orders
        const completedOrders = orders.filter(o => o.estado === 'completado');
        const categoryTotals = {};

        completedOrders.forEach(order => {
            const orderProducts = Array.isArray(order.productos) ? order.productos : [];
            orderProducts.forEach(prodName => {
                const prod = products.find(p => p.nombre === prodName);
                if (prod) {
                    if (!categoryTotals[prod.categoria]) categoryTotals[prod.categoria] = 0;
                    categoryTotals[prod.categoria] += parseFloat(prod.precio);
                }
            });
        });

        // If no category data, use product catalog distribution
        if (Object.keys(categoryTotals).length === 0) {
            products.forEach(p => {
                if (!categoryTotals[p.categoria]) categoryTotals[p.categoria] = 0;
                categoryTotals[p.categoria] += parseFloat(p.precio);
            });
        }

        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);

        const colors = [
            'rgba(59, 130, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(20, 184, 166, 0.8)',
        ];

        categoryChartInstance = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: '#182635',
                    borderWidth: 3,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#7a8a9e',
                            padding: 16,
                            usePointStyle: true,
                            pointStyleWidth: 12,
                            font: { size: 12, family: 'Inter' }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#182635',
                        titleColor: '#e0e6ed',
                        bodyColor: '#e0e6ed',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        callbacks: {
                            label: ctx => ` ${ctx.label}: C$ ${ctx.raw.toLocaleString('es-NI', { minimumFractionDigits: 2 })}`
                        }
                    }
                }
            }
        });
    }

    /* ============================================
       🔌 SOCKET.IO — Tiempo Real (reemplaza polling)
    ============================================ */
    function startOrderPolling() {
        // Socket.IO reemplaza el polling, pero mantenemos la función
        // por si se llama en loadAllData()
        if (typeof io === 'undefined') {
            console.warn('⚠️ Socket.IO no disponible, usando polling como fallback');
            startFallbackPolling();
            return;
        }

        const socket = io();
        console.log('🔌 Conectando Socket.IO al panel admin...');

        socket.on('connect', () => {
            console.log('✅ Socket.IO conectado:', socket.id);
        });

        /* ── Nuevos pedidos ── */
        socket.on('nuevoPedido', (pedido) => {
            console.log('🛒 Nuevo pedido recibido en tiempo real:', pedido);
            orders.unshift(pedido);

            renderOrders();
            updateDashboard();
            renderCharts();

            showToast(
                '🛒 Nuevo Pedido',
                `${pedido.cliente} — C$${parseFloat(pedido.total).toLocaleString('es-NI', { minimumFractionDigits: 2 })}`,
                'success'
            );
            playNotificationSound();

            // Highlight new row
            setTimeout(() => {
                const rows = document.querySelectorAll('#ordersTableBody tr');
                if (rows.length > 0) rows[0].classList.add('new-order-highlight');
            }, 100);
        });

        /* ── Pedido actualizado (cambio de estado) ── */
        socket.on('pedidoActualizado', (pedido) => {
            const idx = orders.findIndex(o => o.id === pedido.id);
            if (idx >= 0) orders[idx] = pedido;
            renderOrders();
            updateDashboard();
            renderCharts();
        });

        /* ── Nuevo producto ── */
        socket.on('nuevoProducto', (producto) => {
            // Solo agregar si no fue creado desde esta sesión
            if (!products.find(p => p.id === producto.id)) {
                products.push(producto);
                renderProducts();
                updateDashboard();
                renderCharts();
                showToast('📦 Nuevo Producto', producto.nombre, 'info');
            }
        });

        /* ── Producto actualizado ── */
        socket.on('productoActualizado', (producto) => {
            const idx = products.findIndex(p => p.id === producto.id);
            if (idx >= 0) {
                products[idx] = producto;
                renderProducts();
                updateDashboard();
                renderCharts();
            }
        });

        /* ── Producto eliminado ── */
        socket.on('productoEliminado', (producto) => {
            products = products.filter(p => p.id !== producto.id);
            renderProducts();
            updateDashboard();
            renderCharts();
        });

        /* ── Stock actualizado ── */
        socket.on('stockActualizado', (producto) => {
            const idx = products.findIndex(p => p.id === producto.id);
            if (idx >= 0) {
                products[idx] = producto;
                renderProducts();
                updateDashboard();

                // Alerta si stock bajo
                if (parseInt(producto.stock) < 5) {
                    showToast('⚠️ Stock Bajo', `${producto.nombre}: ${producto.stock} unidades`, 'warning');
                }
            }
        });

        /* ── Descuento actualizado ── */
        socket.on('descuentoActualizado', (descuento) => {
            const idx = discounts.findIndex(d => d.id === descuento.id);
            if (idx >= 0) {
                discounts[idx] = descuento;
            } else {
                discounts.push(descuento);
            }
            renderDiscounts();
            showToast('🏷️ Descuento', `${descuento.categoria}: ${descuento.porcentaje}% ${descuento.activo ? 'activo' : 'pausado'}`, 'info');
        });

        /* ── Descuento eliminado ── */
        socket.on('descuentoEliminado', (descuento) => {
            discounts = discounts.filter(d => d.id !== descuento.id);
            renderDiscounts();
        });

        /* ── Reconexión ── */
        socket.on('disconnect', () => {
            console.warn('🔌 Socket.IO desconectado, intentando reconectar...');
        });

        socket.on('reconnect', () => {
            console.log('🔌 Socket.IO reconectado, recargando datos...');
            loadAllData();
        });
    }

    /* Fallback: polling si Socket.IO no está disponible */
    function startFallbackPolling() {
        let lastOrderCount = orders.length;
        setInterval(async () => {
            try {
                const newOrders = await API.get('pedidos');
                if (newOrders.length > lastOrderCount) {
                    const diff = newOrders.length - lastOrderCount;
                    const newest = newOrders.slice(0, diff);
                    orders = newOrders;
                    lastOrderCount = newOrders.length;
                    renderOrders();
                    updateDashboard();
                    renderCharts();
                    newest.forEach(o => {
                        showToast('🛒 Nuevo Pedido', `${o.cliente} — C$${parseFloat(o.total).toLocaleString('es-NI', { minimumFractionDigits: 2 })}`, 'success');
                    });
                    playNotificationSound();
                } else {
                    orders = newOrders;
                    lastOrderCount = newOrders.length;
                }
            } catch (err) {
                console.warn('Polling error:', err.message);
            }
        }, 10000);
    }

    /* ============================================
       🔔 TOAST NOTIFICATIONS
    ============================================ */
    function showToast(title, message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-body">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;
        container.appendChild(toast);

        // Auto-dismiss after 5s
        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    /* ============================================
       🔊 NOTIFICATION SOUND
    ============================================ */
    function playNotificationSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) { /* Audio not available */ }
    }

    /* ============================================
       🔄 INITIAL LOAD — Cargar datos desde API
    ============================================ */
    loadAllData();
});
