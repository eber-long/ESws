/* ============================================
   🏷️ ElectroShop — Descuentos en Tienda
   Aplica descuentos activos a las tarjetas de productos
   según la categoría del producto.
============================================ */
(function () {
    'use strict';

    // Map product names to categories (from the catalog)
    // This is populated from the productos API
    let productCategoryMap = {};
    let activeDiscounts = {};

    /**
     * Fetch active discounts and product categories from the API.
     */
    async function loadDiscounts() {
        try {
            const [descuentos, productos] = await Promise.all([
                fetch('/api/descuentos').then(r => r.ok ? r.json() : []),
                fetch('/api/productos').then(r => r.ok ? r.json() : [])
            ]);

            // Build category map from products in DB
            productos.forEach(p => {
                productCategoryMap[p.nombre.toLowerCase()] = p.categoria;
            });

            // Build active discounts by category
            descuentos
                .filter(d => d.activo)
                .forEach(d => {
                    activeDiscounts[d.categoria] = parseFloat(d.porcentaje);
                });

            if (Object.keys(activeDiscounts).length > 0) {
                console.log('🏷️ Descuentos activos:', activeDiscounts);
                applyDiscountsToCards();
            }
        } catch (err) {
            console.warn('🏷️ No se pudieron cargar descuentos:', err.message);
        }
    }

    /**
     * Find the category for a product card.
     * First tries the DB map, then falls back to section header detection.
     */
    function getCategoryForCard(card) {
        const nombre = (card.dataset.nombre || '').trim();

        // 1. Try from DB product catalog
        if (nombre && productCategoryMap[nombre.toLowerCase()]) {
            return productCategoryMap[nombre.toLowerCase()];
        }

        // 2. Fallback: detect category from section header
        let el = card.closest('.carrusel-contenedor');
        if (el) {
            const sectionHeader = el.previousElementSibling;
            if (sectionHeader && sectionHeader.classList.contains('section-header')) {
                const h2 = sectionHeader.querySelector('h2');
                if (h2) return h2.textContent.trim().replace(/^🎮\s*/, '');
            }
        }

        return null;
    }

    /**
     * Apply discount badges and prices to all product cards on the page.
     */
    function applyDiscountsToCards() {
        const cards = document.querySelectorAll('.tarjeta-producto');

        cards.forEach(card => {
            const categoria = getCategoryForCard(card);
            if (!categoria || !activeDiscounts[categoria]) return;

            const descuento = activeDiscounts[categoria];
            const contenido = card.querySelector('.contenido');
            if (!contenido) return;

            // Don't apply twice
            if (card.classList.contains('has-discount')) return;

            // Get original price
            const precioEl = contenido.querySelector('.precio');
            if (!precioEl) return;

            const precioText = precioEl.textContent.replace(/[^\d.,]/g, '').replace(/,/g, '');
            const precioOriginal = parseFloat(precioText);
            if (isNaN(precioOriginal)) return;

            const precioFinal = precioOriginal * (1 - descuento / 100);

            // Mark card
            card.classList.add('has-discount');

            // Update data-precio for the cart to use discounted price
            card.dataset.precioOriginal = card.dataset.precio;
            card.dataset.precio = precioFinal.toFixed(2);

            // Add discount badge
            const badge = document.createElement('span');
            badge.className = 'discount-badge';
            badge.textContent = `${descuento}% OFF`;
            contenido.insertBefore(badge, contenido.firstChild);

            // Add old price (struck through)
            const oldPrice = document.createElement('p');
            oldPrice.className = 'old-price';
            oldPrice.textContent = `C$${precioOriginal.toLocaleString('es-NI', { minimumFractionDigits: 2 })}`;

            // Add new price
            const newPrice = document.createElement('p');
            newPrice.className = 'new-price';
            newPrice.textContent = `C$${precioFinal.toLocaleString('es-NI', { minimumFractionDigits: 2 })}`;

            // Insert after the original .precio element
            precioEl.after(newPrice);
            precioEl.after(oldPrice);
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadDiscounts);
    } else {
        loadDiscounts();
    }
})();
