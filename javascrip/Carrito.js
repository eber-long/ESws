// ======================= AGREGAR PRODUCTOS AL CARRITO =======================
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

    console.log('✅ Producto agregado al carrito:', producto);
    localStorage.setItem('carrito', JSON.stringify(carrito));

    alert(`"${producto.nombre}" fue agregado al carrito`);

    mostrarCarrito(); // 🔹 Actualiza vista del carrito
  });
});


// ======================= MOSTRAR CARRITO =======================
function mostrarCarrito() {
  const contenedor = document.querySelector('[data-carrito]');
  const totalElem = document.querySelector('[data-total-carrito]');
  const carritoGuardado = JSON.parse(localStorage.getItem('carrito')) || [];
  const mensajeVacio = document.getElementById('carrito-vacio');

  if (!contenedor) return;

  contenedor.innerHTML = ''; // limpiar productos
  let suma = 0;

  // 🔹 Mostrar u ocultar mensaje vacío
  if (carritoGuardado.length === 0) {
    if (mensajeVacio) mensajeVacio.style.display = 'block';
    totalElem.textContent = 'C$0.00';
    return;
  } else {
    if (mensajeVacio) mensajeVacio.style.display = 'none';
  }

  // 🔹 Mostrar productos
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

  totalElem.textContent = `C$${suma.toFixed(2)}`;

  // 🔹 Eventos de eliminar
  document.querySelectorAll('.boton-eliminar').forEach(boton => {
    boton.addEventListener('click', e => {
      const index = parseInt(e.target.dataset.index);
      const carritoActual = JSON.parse(localStorage.getItem('carrito')) || [];
      carritoActual.splice(index, 1);
      localStorage.setItem('carrito', JSON.stringify(carritoActual));
      mostrarCarrito(); // Actualiza vista
    });
  });
}

window.addEventListener('DOMContentLoaded', mostrarCarrito);


// ======================= MODAL DE COMPRA FINALIZADA =======================
const boton = document.getElementById('comprarBtn');
const modal = document.getElementById('modal');
const cerrar = document.getElementById('cerrarBtn');

// 🔹 Mostrar modal al presionar el botón de compra
boton.addEventListener('click', () => {
  const carritoGuardado = JSON.parse(localStorage.getItem('carrito')) || [];

  if (carritoGuardado.length === 0) {
    alert('🛒 Tu carrito está vacío');
    return;
  }

  modal.style.display = 'flex';
});

// 🔹 Cerrar modal y vaciar carrito
cerrar.addEventListener('click', () => {
  modal.style.display = 'none';
  localStorage.removeItem('carrito');
  mostrarCarrito();
});

// 🔹 Cerrar modal si se hace clic fuera del contenido
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
    localStorage.removeItem('carrito');
    mostrarCarrito();
  }
});
