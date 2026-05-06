/* ============================================
   🔍 ElectroShop — Buscador Global v2
   ============================================
   - Enlaza con #searchInput y #lupaBtn en el header
   - En catalogo.html: filtra tarjetas inline
   - En otras páginas: navega a buscador.html?q=...
   - En buscador.html: muestra resultados completos
============================================ */
(function () {
  'use strict';

  const productIndex = [];
  let indexed = false;

  const isCatalogo  = location.pathname.endsWith('catalogo.html');
  const isBuscador  = location.pathname.endsWith('buscador.html');

  /* --------------------------------------------------
     INDEXAR PRODUCTOS desde un documento DOM
  -------------------------------------------------- */
  function indexFromDoc(doc) {
    doc.querySelectorAll('.tarjeta-producto').forEach(n => {
      const nombre = (n.dataset.nombre || '').trim();
      if (!nombre) return;
      productIndex.push({
        nombre,
        precio : (n.dataset.precio || '').trim(),
        img    : (n.dataset.img   || '').trim(),
        href   : n.getAttribute('href') || 'detalle-5700x.html'
      });
    });
  }

  /* Fetch una página externa y extrae sus productos */
  async function fetchAndIndex(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      indexFromDoc(doc);
    } catch (e) {
      console.warn('buscador: no se pudo cargar', url);
    }
  }

  /* Construye el índice global (solo una vez) */
  async function buildIndex() {
    if (indexed) return;

    // Indexar desde la página actual
    indexFromDoc(document);

    // Siempre traer catálogo para tener todos los productos
    if (!isCatalogo) {
      await fetchAndIndex('catalogo.html');
    }
    // Traer también principal si no hay suficientes productos
    if (productIndex.length < 5) {
      await fetchAndIndex('principal.html');
    }

    // Deduplicar por nombre (case-insensitive)
    const seen  = new Set();
    const uniq  = [];
    for (const p of productIndex) {
      const key = p.nombre.toLowerCase();
      if (!seen.has(key)) { seen.add(key); uniq.push(p); }
    }
    productIndex.length = 0;
    productIndex.push(...uniq);
    indexed = true;
  }

  /* --------------------------------------------------
     FILTRADO INLINE — solo catalogo.html
  -------------------------------------------------- */
  function filterInline(q) {
    const s          = q.trim().toLowerCase();
    const cards      = document.querySelectorAll('.tarjeta-producto');
    const carruseles = document.querySelectorAll('.carousel');
    const categorias = document.querySelectorAll('.ajustes-barra1');
    const carruselCC = document.querySelectorAll('.carrusel-contenedor');
    const titulo     = document.querySelector('h1');

    if (s) {
      carruseles.forEach(c  => c.style.display = 'none');
      categorias.forEach(c  => c.style.display = 'none');
      carruselCC.forEach(cc => cc.style.height = 'auto');
      if (titulo) titulo.style.display = 'none';

      cards.forEach(card => {
        const match = (card.dataset.nombre || '').toLowerCase().includes(s);
        card.style.display = match ? '' : 'none';
      });
    } else {
      carruseles.forEach(c  => c.style.display = '');
      categorias.forEach(c  => c.style.display = '');
      carruselCC.forEach(cc => cc.style.height = '');
      if (titulo) titulo.style.display = '';
      cards.forEach(card  => card.style.display = '');
    }
  }

  /* --------------------------------------------------
     RENDERIZAR RESULTADOS — buscador.html
  -------------------------------------------------- */
  function renderResults(q, container) {
    const s       = q.trim().toLowerCase();
    const results = s
      ? productIndex.filter(p => p.nombre.toLowerCase().includes(s))
      : productIndex.slice(0, 50);

    // Actualizar conteo
    const countEl = document.getElementById('resultCount');
    if (countEl) {
      countEl.textContent = s
        ? `${results.length} resultado${results.length !== 1 ? 's' : ''} para "${q}"`
        : `${results.length} productos disponibles`;
    }

    container.innerHTML = '';

    if (results.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">🔍</div>
          <h3>Sin resultados</h3>
          <p>No encontramos productos que coincidan con <strong>"${q}"</strong>.</p>
          <p style="color:var(--text-muted);font-size:0.9rem">Prueba con un término diferente.</p>
        </div>`;
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'results-grid';

    results.forEach(p => {
      const precioNum = parseFloat(p.precio);
      const precioFmt = !isNaN(precioNum)
        ? 'C$' + precioNum.toLocaleString('es-NI', { minimumFractionDigits: 2 })
        : '';

      const card = document.createElement('a');
      card.className = 'result-card';
      card.href      = p.href || 'detalle-5700x.html';
      card.innerHTML = `
        <div class="result-img-wrap">
          <img src="${p.img}" alt="${p.nombre}" loading="lazy"
               onerror="this.src='imagen/ES.png'">
        </div>
        <div class="result-info">
          <span class="result-name">${p.nombre}</span>
          <span class="result-price">${precioFmt}</span>
          <button class="boton-carrito result-btn"
                  data-nombre="${p.nombre}"
                  data-precio="${p.precio}"
                  data-img="${p.img}">Agregar al carrito</button>
        </div>`;
      grid.appendChild(card);
    });

    container.appendChild(grid);

    // Conectar botones de carrito (disparar evento que carrito.js escucha)
    container.querySelectorAll('.result-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const nombre = btn.dataset.nombre;
        const precio = parseFloat(btn.dataset.precio) || 0;
        const img    = btn.dataset.img;

        // Reutilizar lógica de carrito.js si está disponible
        const ev = new CustomEvent('agregarAlCarrito', {
          detail: { nombre, precio, img },
          bubbles: true
        });
        btn.dispatchEvent(ev);

        // Feedback visual
        const original = btn.textContent;
        btn.textContent = '✅ Agregado';
        btn.style.background = '#2ecc71';
        setTimeout(() => {
          btn.textContent = original;
          btn.style.background = '';
        }, 1400);
      });
    });
  }

  /* --------------------------------------------------
     INICIALIZACIÓN
  -------------------------------------------------- */
  async function setup() {
    await buildIndex();

    const searchInput    = document.getElementById('searchInput');
    const lupaBtn        = document.getElementById('lupaBtn');
    const resultsContainer = document.getElementById('search-results');

    if (!searchInput) return; // No hay buscador en esta página

    /* ---- Comportamiento según página ---- */

    if (isCatalogo) {
      // Filtrado en tiempo real
      searchInput.addEventListener('input', e => filterInline(e.target.value));
    }

    if (isBuscador && resultsContainer) {
      // Renderizar al escribir
      searchInput.addEventListener('input', e => renderResults(e.target.value, resultsContainer));

      // Leer parámetro ?q= de la URL
      const q = new URLSearchParams(location.search).get('q') || '';
      if (q) {
        searchInput.value = decodeURIComponent(q);
        document.title    = `"${searchInput.value}" — ElectroShop`;
      }
      // Mostrar resultados iniciales (incluso si q está vacío)
      renderResults(searchInput.value, resultsContainer);
    }

    /* ---- Enter en cualquier página ---- */
    searchInput.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const q = searchInput.value.trim();
      if (isBuscador) {
        if (resultsContainer) renderResults(q, resultsContainer);
      } else {
        location.href = 'buscador.html?q=' + encodeURIComponent(q);
      }
    });

    /* ---- Botón lupa en cualquier página ---- */
    if (lupaBtn) {
      lupaBtn.addEventListener('click', () => {
        const q = searchInput.value.trim();
        if (isBuscador) {
          if (resultsContainer) renderResults(q, resultsContainer);
        } else {
          location.href = 'buscador.html?q=' + encodeURIComponent(q);
        }
      });
    }
  }

  /* Iniciar cuando el DOM esté listo */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }

})();
