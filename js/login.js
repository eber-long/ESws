/* ============================================
   🔐 ElectroShop — Login (con JWT)
============================================ */

// Escucha el submit del formulario
document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const usuarioInput = document.getElementById("usuario").value.trim();
    const contrasenaInput = document.getElementById("contrasena").value;

    if (!usuarioInput || !contrasenaInput) {
        mostrarError("Por favor completa todos los campos.");
        return;
    }

    try {
        // Login via API — retorna JWT
        const data = await API.post('login', {
            nombre: usuarioInput,
            contrasena: contrasenaInput
        }, false);

        if (data.success && data.token) {
            // Guardar sesión con JWT
            API.saveSession(data.token, data.usuario.nombre, data.usuario.rol);
            
            // Redirección según rol
            if (data.usuario.rol === 'administrador' || data.usuario.rol === 'ventas') {
                window.location.href = "admin.html";
            } else {
                window.location.href = "principal.html";
            }
        } else {
            mostrarError("Respuesta inesperada del servidor.");
        }

    } catch (err) {
        console.error('Error en login:', err);
        if (err.status === 401) {
            mostrarError("Usuario o contraseña incorrectos.");
        } else if (err.status === 400) {
            const detalles = err.data?.detalles;
            mostrarError(detalles ? detalles.join(' ') : "Datos inválidos.");
        } else {
            mostrarError("⚠️ No se pudo conectar con el servidor. Intenta más tarde.");
        }
    }
});

function mostrarError(mensaje) {
    const form = document.getElementById("loginForm");
    form.classList.add("shake");
    setTimeout(() => form.classList.remove("shake"), 500);
    alert(mensaje || "Usuario o contraseña incorrectos");
}
