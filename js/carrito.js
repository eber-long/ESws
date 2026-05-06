/* ============================================
   🛒 ElectroShop — Carrito (Add to Cart)
   Handles adding products on catalog/principal pages
============================================ */

const carrito = JSON.parse(localStorage.getItem('carrito')) || [];

document.querySelectorAll('.boton-carrito').forEach(boton => {
  boton.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation(); // Prevent navigation when inside <a> tag

    const tarjeta = this.closest('.tarjeta-producto');
    if (!tarjeta) return;

    const producto = {
      nombre: tarjeta.dataset.nombre,
      precio: parseFloat(tarjeta.dataset.precio),
      imagen: tarjeta.dataset.img
    };

    // Check if already in cart
    const existing = carrito.find(p => p.nombre === producto.nombre);
    if (existing) {
      existing.cantidad = (existing.cantidad || 1) + 1;
    } else {
      producto.cantidad = 1;
      carrito.push(producto);
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));

    // Visual feedback instead of alert
    const originalText = this.textContent;
    this.textContent = '✓ Agregado';
    this.style.background = 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)';
    this.style.color = 'white';

    setTimeout(() => {
      this.textContent = originalText;
      this.style.background = '';
      this.style.color = '';
    }, 1200);

    mostrarCarrito();
  });
});

/* ============================================
   📋 MOSTRAR CARRITO (Safe DOM creation)
============================================ */
function mostrarCarrito() {
  const contenedor = document.querySelector('[data-carrito]');
  const totalElem = document.querySelector('[data-total-carrito]');
  const carritoGuardado = JSON.parse(localStorage.getItem('carrito')) || [];
  const mensajeVacio = document.getElementById('carrito-vacio');

  if (!contenedor) return;

  contenedor.innerHTML = '';
  let suma = 0;

  if (carritoGuardado.length === 0) {
    if (mensajeVacio) mensajeVacio.style.display = 'flex';
    if (totalElem) totalElem.textContent = 'C$0.00';
    return;
  } else {
    if (mensajeVacio) mensajeVacio.style.display = 'none';
  }

  carritoGuardado.forEach((producto, index) => {
    const card = document.createElement('div');
    card.classList.add('tarjeta-carrito');

    const content = document.createElement('div');
    content.classList.add('contenido');

    const img = document.createElement('img');
    img.src = producto.imagen;
    img.alt = producto.nombre;

    const h3 = document.createElement('h3');
    h3.textContent = producto.nombre;

    const qty = document.createElement('p');
    qty.textContent = `Cantidad: ${producto.cantidad || 1}`;
    qty.style.color = '#555770';

    const precio = document.createElement('p');
    precio.classList.add('precio');
    const total = producto.precio * (producto.cantidad || 1);
    precio.textContent = `C$${total.toLocaleString('es-NI', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

    const btn = document.createElement('button');
    btn.classList.add('boton-eliminar');
    btn.textContent = 'Quitar del carrito';
    btn.dataset.index = index;

    content.append(img, h3, qty, precio, btn);
    card.appendChild(content);
    contenedor.appendChild(card);
    suma += total;
  });

  // Mostrar total
  if (totalElem) {
    totalElem.textContent = `C$${suma.toLocaleString('es-NI', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  }

  // Eventos de eliminar
  document.querySelectorAll('.boton-eliminar').forEach(boton => {
    boton.addEventListener('click', e => {
      const idx = parseInt(e.target.dataset.index);
      const carritoActual = JSON.parse(localStorage.getItem('carrito')) || [];
      carritoActual.splice(idx, 1);
      localStorage.setItem('carrito', JSON.stringify(carritoActual));
      mostrarCarrito();
    });
  });
}

window.addEventListener('DOMContentLoaded', mostrarCarrito);

/* ============================================
   💳 FINALIZAR COMPRA
============================================ */
const botonComprar = document.getElementById('comprarBtn');
if (botonComprar) {
  botonComprar.addEventListener('click', () => {
    const carritoGuardado = JSON.parse(localStorage.getItem('carrito')) || [];
    if (carritoGuardado.length === 0) {
      alert('🛒 Tu carrito está vacío');
      return;
    }

    // Guardar total para la página de pago
    const total = carritoGuardado.reduce((sum, p) => sum + p.precio * (p.cantidad || 1), 0);
    sessionStorage.setItem('carritoTotal', total);

    // Redirigir a página de pago
    window.location.href = 'metpa.html';
  });
}
