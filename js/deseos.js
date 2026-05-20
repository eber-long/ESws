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
            const res = await fetch(`/api/usuarios/${currentUser}/deseos`);
            if (res.ok) {
                listaDeseos = await res.json();
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
    // Buscar todas las tarjetas de producto
    const tarjetas = document.querySelectorAll('.tarjeta-producto .producto');

    tarjetas.forEach(prodContainer => {
        // Evitar duplicados
        if (prodContainer.querySelector('.btn-deseo')) return;

        const tarjetaPadre = prodContainer.closest('.tarjeta-producto');
        const nombreProducto = tarjetaPadre.dataset.nombre;

        const btnDeseo = document.createElement('button');
        btnDeseo.classList.add('btn-deseo');
        
        // Estilos para el botón flotante
        btnDeseo.style.position = 'absolute';
        btnDeseo.style.top = '10px';
        btnDeseo.style.right = '10px';
        btnDeseo.style.background = 'rgba(15, 25, 35, 0.6)';
        btnDeseo.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        btnDeseo.style.borderRadius = '50%';
        btnDeseo.style.width = '35px';
        btnDeseo.style.height = '35px';
        btnDeseo.style.display = 'flex';
        btnDeseo.style.alignItems = 'center';
        btnDeseo.style.justifyContent = 'center';
        btnDeseo.style.cursor = 'pointer';
        btnDeseo.style.fontSize = '1.2rem';
        btnDeseo.style.backdropFilter = 'blur(4px)';
        btnDeseo.style.transition = 'all 0.2s';
        btnDeseo.style.zIndex = '10';

        // Estado inicial
        actualizarIconoCorazon(btnDeseo, nombreProducto);

        // Posicionar relativamente el contenedor de la imagen si no lo está
        prodContainer.style.position = 'relative';

        btnDeseo.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation(); // Evitar navegar al detalle
            await toggleDeseo(nombreProducto, btnDeseo);
        });

        // Hover anim
        btnDeseo.addEventListener('mouseenter', () => btnDeseo.style.transform = 'scale(1.1)');
        btnDeseo.addEventListener('mouseleave', () => btnDeseo.style.transform = 'scale(1)');

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
        const res = await fetch(`/api/usuarios/${currentUser}/deseos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ producto: nombreProducto })
        });

        if (res.ok) {
            const data = await res.json();
            listaDeseos = data.lista_deseos;
            actualizarIconoCorazon(botonElement, nombreProducto);
            if (listaDeseos.includes(nombreProducto)) {
                mostrarToastDeseos(`❤️ ${nombreProducto} guardado en tu perfil.`);
            }
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
    
    toast.innerHTML = mensaje;
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
