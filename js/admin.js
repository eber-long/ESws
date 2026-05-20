/* ============================================
   🛡️ ElectroShop — Admin Panel JS (con API Backend)
============================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ============================================
       🔐 ACCESS CONTROL
    ============================================ */
    const userName = sessionStorage.getItem('NombreUsuario');
    const userType = sessionStorage.getItem('tipoUsuario');

    if (!userName || userType !== 'administrador') {
        alert('⛔ Acceso denegado. Solo administradores pueden acceder a este panel.');
        window.location.href = 'index.html';
        return;
    }

    // Show admin name
    const adminNameEl = document.getElementById('adminName');
    if (adminNameEl) adminNameEl.textContent = userName;

    /* ============================================
       🔌 API HELPER
    ============================================ */
    const API = {
        async get(endpoint) {
            const res = await fetch(`/api/${endpoint}`);
            if (!res.ok) throw new Error(`GET /api/${endpoint} → ${res.status}`);
            return res.json();
        },
        async post(endpoint, data) {
            const res = await fetch(`/api/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `POST /api/${endpoint} → ${res.status}`);
            }
            return res.json();
        },
        async put(endpoint, data) {
            const res = await fetch(`/api/${endpoint}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error(`PUT /api/${endpoint} → ${res.status}`);
            return res.json();
        },
        async delete(endpoint) {
            const res = await fetch(`/api/${endpoint}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(`DELETE /api/${endpoint} → ${res.status}`);
            return res.json();
        }
    };

    /* ============================================
       📦 DATA (cargado desde API)
    ============================================ */
    let products = [];
    let users = [];
    let orders = [];

    // Defaults como fallback
    const defaultProducts = [
        { nombre: "AMD Ryzen 7 5700X", categoria: "Procesadores", precio: 7708.27, stock: 15, imagen: "imagen/7.webp", descripcion: "8 núcleos / 16 hilos" },
        { nombre: "Intel Core i7-12700K", categoria: "Procesadores", precio: 9850, stock: 10, imagen: "imagen/intelcorei7.jpg", descripcion: "12 núcleos / 20 hilos" },
        { nombre: "Intel Core i5-12400F", categoria: "Procesadores", precio: 5950, stock: 20, imagen: "imagen/intelcorei5.jpg", descripcion: "6 núcleos / 12 hilos" },
        { nombre: "HP Pavilion 15", categoria: "Laptops", precio: 17500, stock: 8, imagen: "imagen/HPpavilion.avif", descripcion: "8 GB RAM / 512 GB SSD" },
        { nombre: "Dell Inspiron 14", categoria: "Laptops", precio: 22300, stock: 5, imagen: "imagen/Dellinspiron.webp", descripcion: "16 GB RAM / 512 GB SSD" },
        { nombre: "Lenovo IdeaPad 3", categoria: "Laptops", precio: 15800, stock: 12, imagen: "imagen/ideaPad3.webp", descripcion: "8 GB RAM / 256 GB SSD" },
        { nombre: "Samsung Galaxy S25", categoria: "Dispositivos Móviles", precio: 44500, stock: 7, imagen: "imagen/samsung-galaxy-s25-5g-256-gb-icyblue.jpg", descripcion: "12 GB RAM / 512 GB" },
        { nombre: "Xiaomi 15 Pro", categoria: "Dispositivos Móviles", precio: 22900, stock: 10, imagen: "imagen/Xiaomi15Pro.webp", descripcion: "12 GB RAM / 512 GB" },
        { nombre: "iPhone 16e", categoria: "Dispositivos Móviles", precio: 29800, stock: 6, imagen: "imagen/Iphone16e.webp", descripcion: "6 GB RAM / 256 GB" },
        { nombre: "Mouse Redragon M607", categoria: "Accesorios", precio: 890, stock: 50, imagen: "imagen/MouseRedragon.webp", descripcion: "DPI: 7200 ajustable" },
        { nombre: "Audífonos JBL 510BT", categoria: "Accesorios", precio: 1750, stock: 30, imagen: "imagen/Audífonos JBL 510BT.jpeg", descripcion: "Bluetooth / 40h batería" },
        { nombre: "ASUS TUF VG249Q1A", categoria: "Monitores", precio: 890, stock: 18, imagen: "imagen/monitorasus.png", descripcion: "24\" IPS 165Hz" },
        { nombre: "Epson PowerLite X49", categoria: "Proyectores", precio: 9800, stock: 4, imagen: "imagen/Epson PowerLite X49.png", descripcion: "HDMI / VGA / USB" },
        { nombre: "Lenovo LOQ Gen 9", categoria: "Laptops", precio: 20500, stock: 9, imagen: "imagen/Lenovo LOQ Gen 9.png", descripcion: "Laptop Gaming" },
        { nombre: "G213 Prodigy", categoria: "Accesorios", precio: 5500, stock: 25, imagen: "imagen/G213 Prodigy.png", descripcion: "Teclado Gaming RGB" },
        { nombre: "G502 X PLUS", categoria: "Accesorios", precio: 3000, stock: 20, imagen: "imagen/G502 X PLUS.png", descripcion: "Mouse inalámbrico" },
        { nombre: "RYZEN 7 9800X3D", categoria: "Procesadores", precio: 12200, stock: 8, imagen: "imagen/RYZEN 7 9800X3D.png", descripcion: "Procesador Gaming" },
    ];

    const defaultUsers = [
        { nombre: "admin", contrasena: "1234", tipo: "administrador" },
        { nombre: "juan", contrasena: "abcd", tipo: "comun" },
        { nombre: "paco", contrasena: "1234", tipo: "comun" }
    ];

    const defaultOrders = [
        { id: 1, codigo: "ES-001", cliente: "juan", productos: ["AMD Ryzen 7 5700X", "Mouse Redragon M607"], total: 8598.27, estado: "completado", fecha: "2025-04-18" },
        { id: 2, codigo: "ES-002", cliente: "paco", productos: ["HP Pavilion 15"], total: 17500, estado: "pendiente", fecha: "2025-04-19" },
        { id: 3, codigo: "ES-003", cliente: "juan", productos: ["Samsung Galaxy S25", "Audífonos JBL 510BT"], total: 46250, estado: "completado", fecha: "2025-04-17" },
        { id: 4, codigo: "ES-004", cliente: "paco", productos: ["G502 X PLUS"], total: 3000, estado: "cancelado", fecha: "2025-04-16" },
        { id: 5, codigo: "ES-005", cliente: "juan", productos: ["Lenovo LOQ Gen 9"], total: 20500, estado: "completado", fecha: "2025-04-15" },
    ];

    // Controla si estamos usando API o fallback
    let usingAPI = false;

    /* ============================================
       🔄 CARGAR DATOS DESDE API
    ============================================ */
    async function loadAllData() {
        try {
            const [prods, usrs, ords] = await Promise.all([
                API.get('productos'),
                API.get('usuarios'),
                API.get('pedidos')
            ]);

            products = prods;
            users = usrs;
            orders = ords;
            usingAPI = true;
            console.log('✅ Datos cargados desde API');
        } catch (err) {
            console.warn('⚠️ API no disponible, usando datos locales:', err.message);
            products = [...defaultProducts];
            users = [...defaultUsers];
            orders = [...defaultOrders];
            usingAPI = false;
        }

        updateDashboard();
        renderProducts();
        renderUsers();
        renderOrders();
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
                        <img src="${prod.imagen}" alt="${prod.nombre}">
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
                    <button class="btn btn-danger btn-sm btn-delete-product" data-index="${index}">🗑️</button>
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
                    if (usingAPI && products[idx].id) {
                        await API.delete(`productos/${products[idx].id}`);
                    }
                    products.splice(idx, 1);
                    renderProducts();
                    updateDashboard();
                } catch (err) {
                    console.error('Error eliminando producto:', err);
                    alert('Error al eliminar producto');
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
            const badgeClass = user.tipo === 'administrador' ? 'badge-admin' : 'badge-user';
            const typeLabel = user.tipo === 'administrador' ? 'Admin' : 'Usuario';

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
                    if (usingAPI && users[idx].id) {
                        await API.delete(`usuarios/${users[idx].id}`);
                    }
                    users.splice(idx, 1);
                    renderUsers();
                    updateDashboard();
                } catch (err) {
                    console.error('Error eliminando usuario:', err);
                    alert('Error al eliminar usuario');
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

            tr.innerHTML = `
                <td><strong>${orderCode}</strong></td>
                <td>${order.cliente}</td>
                <td>${productsList}</td>
                <td>C$${parseFloat(order.total).toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
                <td><span class="order-status"><span class="status-dot ${statusClass}"></span> ${statusText}</span></td>
                <td>${order.fecha}</td>
                <td>
                    <select class="btn btn-ghost btn-sm order-status-select" data-index="${index}" style="padding:4px 8px;font-size:0.75rem;">
                        <option value="pendiente" ${order.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="completado" ${order.estado === 'completado' ? 'selected' : ''}>Completado</option>
                        <option value="cancelado" ${order.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                    </select>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Status change
        document.querySelectorAll('.order-status-select').forEach(sel => {
            sel.addEventListener('change', async () => {
                const idx = parseInt(sel.dataset.index);
                const newEstado = sel.value;

                try {
                    if (usingAPI && orders[idx].id) {
                        await API.put(`pedidos/${orders[idx].id}`, { estado: newEstado });
                    }
                    orders[idx].estado = newEstado;
                    renderOrders();
                    updateDashboard();
                } catch (err) {
                    console.error('Error actualizando pedido:', err);
                    alert('Error al actualizar estado del pedido');
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
        orders: 'Pedidos'
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
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Error al subir imagen');
        const data = await res.json();
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

            if (usingAPI) {
                if (editIdx >= 0 && products[editIdx].id) {
                    const updated = await API.put(`productos/${products[editIdx].id}`, productData);
                    products[editIdx] = updated;
                } else {
                    const created = await API.post('productos', productData);
                    products.push(created);
                }
            } else {
                if (editIdx >= 0) {
                    products[editIdx] = productData;
                } else {
                    products.push(productData);
                }
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
            document.getElementById('userPass').value = user.contrasena || '';
            document.getElementById('userTypeSelect').value = user.tipo;
        } else {
            document.getElementById('userModalTitle').textContent = 'Agregar Usuario';
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

        if (!name || !pass || !type) {
            alert('Por favor completa todos los campos.');
            return;
        }

        const userData = { nombre: name, contrasena: pass, tipo: type };

        try {
            if (usingAPI) {
                if (editIdx >= 0 && users[editIdx].id) {
                    const updated = await API.put(`usuarios/${users[editIdx].id}`, userData);
                    users[editIdx] = updated;
                } else {
                    const created = await API.post('usuarios', userData);
                    users.push(created);
                }
            } else {
                if (editIdx >= 0) {
                    users[editIdx] = userData;
                } else {
                    if (users.some(u => u.nombre === name)) {
                        alert('Ya existe un usuario con ese nombre.');
                        return;
                    }
                    users.push(userData);
                }
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
        sessionStorage.removeItem('NombreUsuario');
        sessionStorage.removeItem('tipoUsuario');
        window.location.href = 'index.html';
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
       🔔 REAL-TIME POLLING — Pedidos cada 10s
    ============================================ */
    let pollingInterval = null;
    let lastOrderCount = 0;

    function startOrderPolling() {
        lastOrderCount = orders.length;

        if (pollingInterval) clearInterval(pollingInterval);

        pollingInterval = setInterval(async () => {
            if (!usingAPI) return;

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

                    // Toast notification
                    newest.forEach(o => {
                        showToast(
                            '🛒 Nuevo Pedido',
                            `${o.cliente} — C$${parseFloat(o.total).toLocaleString('es-NI', { minimumFractionDigits: 2 })}`,
                            'success'
                        );
                    });

                    // Audio notification
                    playNotificationSound();

                    // Highlight new rows
                    setTimeout(() => {
                        const rows = document.querySelectorAll('#ordersTableBody tr');
                        for (let i = 0; i < Math.min(diff, rows.length); i++) {
                            rows[i].classList.add('new-order-highlight');
                        }
                    }, 100);
                } else {
                    // Update order states silently
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
