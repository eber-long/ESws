// Lista de usuarios
const usuarios = [
  { nombre: "admin", contrasena: "1234", tipo: "administrador" },
  { nombre: "juan", contrasena: "abcd", tipo: "comun" }
];

// Escucha el submit del formulario
document.getElementById("loginForm").addEventListener("submit", function(event) {
  event.preventDefault(); // evita recargar la página

  const usuarioInput = document.getElementById("usuario").value;
  const contrasenaInput = document.getElementById("contrasena").value;

  // Busca coincidencia
  const usuarioValido = usuarios.find(u => u.nombre === usuarioInput && u.contrasena === contrasenaInput);

  if (usuarioValido) {
    sessionStorage.setItem("NombreUsuario", usuarioValido.nombre);
    sessionStorage.setItem("tipoUsuario", usuarioValido.tipo); // guarda tipo de usuario
    window.location.href = "principal.html"; // redirige a la página principal
  } else {
    alert("Usuario o contraseña incorrectos"); // mensaje de error
  }
});
