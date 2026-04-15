// ======================= CARRITO =======================
const carrito = JSON.parse(localStorage.getItem('carrito')) || [];

document.querySelectorAll('.boton-carrito').forEach(boton => {
  boton.addEventListener('click', function (e) {
    e.preventDefault();
    const tarjeta = this.closest('.tarjeta-producto');
    const producto = {
      nombre: tarjeta.dataset.nombre,
      precio: parseFloat(tarjeta.dataset.precio),
      imagen: tarjeta.dataset.img
    };
    carrito.push(producto);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    alert(`"${producto.nombre}" fue agregado al carrito`);
    mostrarCarrito();
  });
});

// ======================= MOSTRAR CARRITO =======================
function mostrarCarrito() {
  const contenedor = document.querySelector('[data-carrito]');
  const totalElem = document.querySelector('[data-total-carrito]');
  const carritoGuardado = JSON.parse(localStorage.getItem('carrito')) || [];
  const mensajeVacio = document.getElementById('carrito-vacio');

  if (!contenedor) return;

  contenedor.innerHTML = '';
  let suma = 0;

  if (carritoGuardado.length === 0) {
    if (mensajeVacio) mensajeVacio.style.display = 'block';
    totalElem.textContent = 'C$0.00';
    return;
  } else {
    if (mensajeVacio) mensajeVacio.style.display = 'none';
  }

  carritoGuardado.forEach((producto, index) => {
    const contenedorProducto = document.createElement('div');
    contenedorProducto.classList.add('tarjeta-carrito');
    contenedorProducto.innerHTML = `
      <div class="contenido">
        <img src="${producto.imagen}" alt="${producto.nombre}">
        <h3>${producto.nombre}</h3>
        <p class="precio">C$${producto.precio.toFixed(2)}</p>
        <button class="boton-eliminar" data-index="${index}">Quitar del carrito</button>
      </div>
    `;
    contenedor.appendChild(contenedorProducto);
    suma += producto.precio;
  });

  // Mostrar total con comas
  totalElem.textContent = `C$${suma.toLocaleString('es-NI', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  // Eventos de eliminar
  document.querySelectorAll('.boton-eliminar').forEach(boton => {
    boton.addEventListener('click', e => {
      const index = parseInt(e.target.dataset.index);
      const carritoActual = JSON.parse(localStorage.getItem('carrito')) || [];
      carritoActual.splice(index, 1);
      localStorage.setItem('carrito', JSON.stringify(carritoActual));
      mostrarCarrito();
    });
  });
}

window.addEventListener('DOMContentLoaded', mostrarCarrito);

// ======================= FINALIZAR COMPRA =======================
const botonComprar = document.getElementById('comprarBtn');
if (botonComprar) {
  botonComprar.addEventListener('click', () => {
    const carritoGuardado = JSON.parse(localStorage.getItem('carrito')) || [];
    if (carritoGuardado.length === 0) {
      alert('🛒 Tu carrito está vacío');
      return;
    }

    // Guardar total en sessionStorage para la página de pago
    const total = carritoGuardado.reduce((sum, p) => sum + p.precio, 0);
    sessionStorage.setItem('carritoTotal', total);

    // Redirigir a página de pago
    window.location.href = 'metpa.html';
  });
};
