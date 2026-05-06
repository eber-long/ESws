/* ============================================
   🔐 ElectroShop — Login
============================================ */

// Lista de usuarios
const usuarios = [
  { nombre: "admin", contrasena: "1234", tipo: "administrador" },
  { nombre: "juan", contrasena: "abcd", tipo: "comun" },
  { nombre: "paco", contrasena: "1234", tipo: "comun" }
];

// Escucha el submit del formulario
document.getElementById("loginForm").addEventListener("submit", function(event) {
  event.preventDefault();

  const usuarioInput = document.getElementById("usuario").value.trim();
  const contrasenaInput = document.getElementById("contrasena").value;

  // Busca coincidencia
  const usuarioValido = usuarios.find(
    u => u.nombre === usuarioInput && u.contrasena === contrasenaInput
  );

  if (usuarioValido) {
    // Guardar en sessionStorage (consistente con principal.js)
    sessionStorage.setItem("NombreUsuario", usuarioValido.nombre);
    sessionStorage.setItem("tipoUsuario", usuarioValido.tipo);
    window.location.href = "principal.html";
  } else {
    // Feedback visual en lugar de alert
    const form = document.getElementById("loginForm");
    form.classList.add("shake");
    setTimeout(() => form.classList.remove("shake"), 500);
    alert("Usuario o contraseña incorrectos");
  }
});
