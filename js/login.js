/* ============================================
   🔐 ElectroShop — Login (con API Backend)
============================================ */

// Usuarios locales como fallback
const usuariosFallback = [
  { nombre: "admin", contrasena: "1234", tipo: "administrador" },
  { nombre: "juan", contrasena: "abcd", tipo: "comun" },
  { nombre: "paco", contrasena: "1234", tipo: "comun" }
];

// Escucha el submit del formulario
document.getElementById("loginForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  const usuarioInput = document.getElementById("usuario").value.trim();
  const contrasenaInput = document.getElementById("contrasena").value;

  try {
    // Intentar login via API
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: usuarioInput, contrasena: contrasenaInput })
    });

    if (response.ok) {
      const usuario = await response.json();
      sessionStorage.setItem("NombreUsuario", usuario.nombre);
      sessionStorage.setItem("tipoUsuario", usuario.tipo);
      window.location.href = "principal.html";
      return;
    }

    // Credenciales incorrectas (401)
    if (response.status === 401) {
      mostrarError();
      return;
    }

    // Otro error del servidor → fallback local
    throw new Error('Error del servidor');

  } catch (err) {
    // Si la API no responde, usar fallback local
    console.warn('⚠️ API no disponible, usando login local:', err.message);

    const usuarioValido = usuariosFallback.find(
      u => u.nombre === usuarioInput && u.contrasena === contrasenaInput
    );

    if (usuarioValido) {
      sessionStorage.setItem("NombreUsuario", usuarioValido.nombre);
      sessionStorage.setItem("tipoUsuario", usuarioValido.tipo);
      window.location.href = "principal.html";
    } else {
      mostrarError();
    }
  }
});

function mostrarError() {
  const form = document.getElementById("loginForm");
  form.classList.add("shake");
  setTimeout(() => form.classList.remove("shake"), 500);
  alert("Usuario o contraseña incorrectos");
}
