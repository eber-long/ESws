  // Creamos un array para guardar los productos
const carrito = JSON.parse(localStorage.getItem('carrito')) || [];

document.querySelectorAll('.boton-carrito').forEach(boton => {
    boton.addEventListener('click', function(e) {
      e.preventDefault(); 

      const tarjeta = this.closest('.tarjeta-producto');

      const producto = {
        nombre: tarjeta.dataset.nombre,
        precio: parseFloat(tarjeta.dataset.precio),
        imagen: tarjeta.dataset.img
      };

      carrito.push(producto);

      console.log('✅ Producto agregado al carrito:', producto);
      console.log('🛒 Carrito actual:', carrito);

      localStorage.setItem('carrito', JSON.stringify(carrito));
    });
});

  

function mostrarCarrito() {
  const contenedor = document.querySelector('[data-carrito]');
  const total = document.querySelector('[data-total-carrito]');
  const carritoGuardado = JSON.parse(localStorage.getItem('carrito')) || [];

  if (!contenedor) return;

  contenedor.innerHTML = '';
  let suma = 0;

  carritoGuardado.forEach(producto => {
    const tarjeta = document.createElement('a');
    tarjeta.href = "detalle-5700x.html";
    tarjeta.className = "tarjeta-producto";
    tarjeta.dataset.nombre = producto.nombre;
    tarjeta.dataset.precio = producto.precio;
    tarjeta.dataset.img = producto.imagen;

    tarjeta.innerHTML = `
      <div class="contenido">
        <img src="${producto.imagen}" alt="${producto.nombre}">
        <h3>${producto.nombre}</h3>
        <p class="precio">C$${producto.precio.toFixed(2)}</p>
        <button class="boton-carrito">Quitar</button>
      </div>
    `;

    contenedor.appendChild(tarjeta);
    suma += producto.precio;
  });

  total.textContent = `Total: C$${suma.toFixed(2)}`;
}

window.addEventListener('DOMContentLoaded', mostrarCarrito);

