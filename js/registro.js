/* ============================================
   📝 ElectroShop — Registro de Usuario
============================================ */

document.getElementById("registerForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const nombre = document.getElementById("usuario").value.trim();
    const contrasena1 = document.getElementById("contrasena1").value;
    const contrasena2 = document.getElementById("contrasena2").value;

    // Validaciones del lado del cliente
    if (!nombre || !contrasena1 || !contrasena2) {
        mostrarMensaje("Por favor completa todos los campos.", "error");
        return;
    }

    if (nombre.length < 3) {
        mostrarMensaje("El nombre debe tener al menos 3 caracteres.", "error");
        return;
    }

    if (contrasena1.length < 4) {
        mostrarMensaje("La contraseña debe tener al menos 4 caracteres.", "error");
        return;
    }

    if (contrasena1 !== contrasena2) {
        mostrarMensaje("Las contraseñas no coinciden.", "error");
        return;
    }

    try {
        const response = await fetch('/api/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, contrasena: contrasena1 })
        });

        const data = await response.json();

        if (response.ok) {
            mostrarMensaje("✅ ¡Cuenta creada exitosamente! Redirigiendo...", "success");

            // Guardar sesión y redirigir al login después de 1.5 segundos
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1500);
        } else {
            // Error del servidor (409 = usuario duplicado, 400 = validación)
            mostrarMensaje(data.error || "Error al registrar usuario.", "error");
        }

    } catch (err) {
        console.error("Error de conexión:", err);
        mostrarMensaje("⚠️ No se pudo conectar con el servidor. Intenta más tarde.", "error");
    }
});

/* ============================================
   💬 Mostrar mensaje visual
============================================ */
function mostrarMensaje(texto, tipo) {
    // Eliminar mensaje anterior si existe
    const prevMsg = document.querySelector('.registro-mensaje');
    if (prevMsg) prevMsg.remove();

    const msg = document.createElement('div');
    msg.className = `registro-mensaje ${tipo}`;
    msg.textContent = texto;

    const form = document.getElementById("registerForm");
    form.insertBefore(msg, form.querySelector('input[type="submit"]'));

    // Auto-remover después de 5 segundos
    setTimeout(() => msg.remove(), 5000);
}
