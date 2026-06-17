/* ============================================
   🔌 ElectroShop — API Helper Centralizado
   Funciones fetch reutilizables con JWT automático.
   
   Uso:
   <script src="js/api.js"></script>
   
   API.get('productos')
   API.post('login', { nombre, contrasena })
   API.put('productos/1', data)
   API.delete('productos/1')
============================================ */

const API = (() => {
    'use strict';

    const BASE_URL = '/api';

    /* ─── Obtener token de sesión ─── */
    function getToken() {
        return sessionStorage.getItem('authToken');
    }

    /* ─── Headers con JWT ─── */
    function getHeaders(includeAuth = true) {
        const headers = { 'Content-Type': 'application/json' };
        const token = getToken();
        if (includeAuth && token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    /* ─── Manejo de respuesta ─── */
    async function handleResponse(res) {
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            // Token expirado o inválido → redirigir a login
            if (res.status === 401) {
                sessionStorage.removeItem('authToken');
                sessionStorage.removeItem('NombreUsuario');
                sessionStorage.removeItem('rolUsuario');
                // Solo redirigir si no estamos en la página de login/registro
                const page = location.pathname.split('/').pop();
                if (page !== 'index.html' && page !== 'Registro.html' && page !== '') {
                    alert('⏰ Tu sesión ha expirado. Inicia sesión de nuevo.');
                    window.location.href = 'index.html';
                }
            }
            const error = new Error(data.error || data.message || `Error ${res.status}`);
            error.status = res.status;
            error.data = data;
            throw error;
        }

        return data;
    }

    /* ─── Métodos HTTP ─── */
    async function get(endpoint, auth = true) {
        const res = await fetch(`${BASE_URL}/${endpoint}`, {
            method: 'GET',
            headers: getHeaders(auth)
        });
        return handleResponse(res);
    }

    async function post(endpoint, body, auth = true) {
        const res = await fetch(`${BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers: getHeaders(auth),
            body: JSON.stringify(body)
        });
        return handleResponse(res);
    }

    async function put(endpoint, body, auth = true) {
        const res = await fetch(`${BASE_URL}/${endpoint}`, {
            method: 'PUT',
            headers: getHeaders(auth),
            body: JSON.stringify(body)
        });
        return handleResponse(res);
    }

    async function del(endpoint, auth = true) {
        const res = await fetch(`${BASE_URL}/${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders(auth)
        });
        return handleResponse(res);
    }

    /* ─── Upload de archivos (sin JSON header) ─── */
    async function upload(endpoint, formData) {
        const headers = {};
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers,
            body: formData
        });
        return handleResponse(res);
    }

    /* ─── Helpers de sesión ─── */
    function isLoggedIn() {
        return !!getToken();
    }

    function getUserName() {
        return sessionStorage.getItem('NombreUsuario');
    }

    function getUserRol() {
        return sessionStorage.getItem('rolUsuario');
    }

    function isAdmin() {
        return getUserRol() === 'administrador';
    }

    function isVendedor() {
        return getUserRol() === 'ventas';
    }

    function isStaff() {
        const rol = getUserRol();
        return rol === 'administrador' || rol === 'ventas';
    }

    function logout() {
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('NombreUsuario');
        sessionStorage.removeItem('rolUsuario');
        localStorage.removeItem('usuario');
        window.location.href = 'index.html';
    }

    function saveSession(token, nombre, rol) {
        sessionStorage.setItem('authToken', token);
        sessionStorage.setItem('NombreUsuario', nombre);
        sessionStorage.setItem('rolUsuario', rol);
    }

    return {
        get,
        post,
        put,
        delete: del,
        upload,
        isLoggedIn,
        getUserName,
        getUserRol,
        isAdmin,
        isVendedor,
        isStaff,
        logout,
        saveSession,
        getToken
    };
})();
