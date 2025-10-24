document.getElementById("formContacto").addEventListener("submit", function(e) {
  e.preventDefault();
  document.getElementById("confirmacion").style.display = "block";
  this.reset();
});