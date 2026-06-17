/* ============================================
   ❤️ ElectroShop — Lista de Deseos
============================================ */

document.addEventListener('DOMContentLoaded', () => {
    inicializarDeseos();
});

let listaDeseos = [];
const currentUser = sessionStorage.getItem('NombreUsuario');

async function inicializarDeseos() {
    if (currentUser) {
        // Obtener la lista del backend
        try {
            listaDeseos = await API.get(`usuarios/${currentUser}/deseos`);

            // Sincronización automática de favoritos locales al perfil del usuario
            const deseosLocales = JSON.parse(localStorage.getItem('lista_deseos_local')) || [];
            if (deseosLocales.length > 0) {
                for (const prod of deseosLocales) {
                    if (!listaDeseos.includes(prod)) {
                        try {
                            const data = await API.post(`usuarios/${currentUser}/deseos`, { producto: prod });
                            listaDeseos = data.lista_deseos || listaDeseos;
                            if (!listaDeseos.includes(prod)) {
                                listaDeseos.push(prod);
                            }
                        } catch (e) {
                            console.error("Error al sincronizar deseo local en el servidor:", e);
                        }
                    }
                }
                localStorage.removeItem('lista_deseos_local');
            }
        } catch (error) {
            console.error("Error obteniendo lista de deseos", error);
        }
    } else {
        // Manejo local temporal si no hay login
        listaDeseos = JSON.parse(localStorage.getItem('lista_deseos_local')) || [];
    }

    inyectarBotonesCorazon();
}

function inyectarBotonesCorazon() {
    // Buscar todas las tarjetas de producto (.producto en inicio y .contenido en catálogo)
    const tarjetas = document.querySelectorAll('.tarjeta-producto .producto, .tarjeta-producto .contenido');

    tarjetas.forEach(prodContainer => {
        // Evitar duplicados
        if (prodContainer.querySelector('.btn-deseo')) return;

        const tarjetaPadre = prodContainer.closest('.tarjeta-producto');
        const nombreProducto = tarjetaPadre.dataset.nombre;

        const btnDeseo = document.createElement('button');
        btnDeseo.classList.add('btn-deseo');

        // Estado inicial
        actualizarIconoCorazon(btnDeseo, nombreProducto);

        // Posicionar relativamente el contenedor de la imagen si no lo está
        prodContainer.style.position = 'relative';

        btnDeseo.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation(); // Evitar navegar al detalle
            await toggleDeseo(nombreProducto, btnDeseo);

            // Si estamos en deseos.html y el producto ya no está en la lista de deseos, remover de la interfaz
            if (window.location.pathname.includes('deseos.html') && !listaDeseos.includes(nombreProducto)) {
                const card = prodContainer.closest('.tarjeta-producto');
                if (card) {
                    card.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(15px) scale(0.95)';
                    
                    setTimeout(() => {
                        card.remove();
                        
                        // Recalcular contador y actualizar vista si queda vacío
                        const grid = document.getElementById('deseosGrid');
                        if (grid) {
                            const remainingCards = grid.querySelectorAll('.tarjeta-producto');
                            const count = remainingCards.length;
                            
                            const contador = document.getElementById('contadorFavoritos');
                            if (contador) {
                                contador.textContent = `${count} ${count === 1 ? 'producto' : 'productos'}`;
                            }
                            
                            if (count === 0) {
                                grid.innerHTML = `
                                    <div class="empty-deseos">
                                        <i class="fi fi-sr-heart"></i>
                                        <h3>Tu lista de favoritos está vacía</h3>
                                        <p>Guarda productos para encontrarlos rápidamente más tarde.</p>
                                        <a href="catalogo.html" class="btn-regresar-catalogo">Ir al Catálogo</a>
                                    </div>
                                `;
                            }
                        }
                    }, 400);
                }
            }
        });

        prodContainer.appendChild(btnDeseo);
    });
}

function actualizarIconoCorazon(boton, nombreProducto) {
    if (listaDeseos.includes(nombreProducto)) {
        boton.innerHTML = '❤️';
        boton.title = "Quitar de lista de deseos";
        boton.style.color = '#ef4444';
    } else {
        boton.innerHTML = '🤍';
        boton.title = "Añadir a lista de deseos";
        boton.style.color = '#fff';
    }
}

async function toggleDeseo(nombreProducto, botonElement) {
    if (!currentUser) {
        // Modalidad local (fallback si no está logueado)
        if (listaDeseos.includes(nombreProducto)) {
            listaDeseos = listaDeseos.filter(p => p !== nombreProducto);
        } else {
            listaDeseos.push(nombreProducto);
            mostrarToastDeseos(`❤️ Añadido a favoritos!`);
        }
        localStorage.setItem('lista_deseos_local', JSON.stringify(listaDeseos));
        actualizarIconoCorazon(botonElement, nombreProducto);
        return;
    }

    // Backend
    try {
        const data = await API.post(`usuarios/${currentUser}/deseos`, { producto: nombreProducto });
        listaDeseos = data.lista_deseos;
        actualizarIconoCorazon(botonElement, nombreProducto);
        if (listaDeseos.includes(nombreProducto)) {
            mostrarToastDeseos(`❤️ ${nombreProducto} guardado en tu perfil.`);
        }
    } catch (error) {
        console.error("Error toggling deseo", error);
    }
}

function mostrarToastDeseos(mensaje) {
    // Reutilizando el contenedor toast si existe, sino crear uno básico
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.background = '#182635';
    toast.style.color = '#fff';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.borderLeft = '4px solid #ef4444';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    toast.style.fontSize = '0.9rem';
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    
    toast.textContent = mensaje;
    container.appendChild(toast);

    // Fade in
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    // Remove after 3s
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
