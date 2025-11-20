(function(){
  // buscador.js - indexa productos y permite búsqueda global
  // - Busca .tarjeta-producto en el DOM y crea un índice.
  // - Si no hay productos en la página intenta cargar `catalogo.html` y `principal.html`.
  // - En páginas con tarjetas (p.ej. catalogo/principal) oculta/enseña tarjetas.
  // - En la página `buscador.html` (tiene #search-results) muestra una lista de coincidencias.

  const productIndex = [];
  let indexed = false;

  function indexFromDocument(doc){
    const nodes = doc.querySelectorAll('.tarjeta-producto');
    nodes.forEach(n => {
      const nombre = n.dataset.nombre || n.getAttribute('data-nombre') || '';
      const precio = n.dataset.precio || n.getAttribute('data-precio') || '';
      const img = n.dataset.img || n.getAttribute('data-img') || '';
      const href = n.getAttribute('href') || '';
      if(!nombre) return;
      productIndex.push({nombre: nombre.trim(), precio: precio.trim(), img: img.trim(), href: href});
    });
  }

  async function tryFetchAndIndex(url){
    try{
      const res = await fetch(url);
      if(!res.ok) return;
      const text = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      indexFromDocument(doc);
    }catch(e){
      // fetch can fail on file://; ignore silently
      console.warn('buscador: could not fetch', url, e);
    }
  }

  async function buildIndex(){
    if(indexed) return;
    // index from current page
    indexFromDocument(document);
    // if no products found, try to fetch catalogo and principal
    if(productIndex.length === 0){
      await Promise.all([tryFetchAndIndex('catalogo.html'), tryFetchAndIndex('principal.html')]);
    }
    // dedupe by name
    const seen = new Set();
    const unique = [];
    for(const p of productIndex){
      const key = p.nombre.toLowerCase();
      if(seen.has(key)) continue;
      seen.add(key);
      unique.push(p);
    }
    productIndex.length = 0;
    productIndex.push(...unique);
    indexed = true;
  }

  function renderSearchResults(results, container){
    container.innerHTML = '';
    if(results.length === 0){
      container.innerHTML = '<p>No se encontraron productos.</p>';
      return;
    }
    const ul = document.createElement('div');
    ul.className = 'search-results-grid';
    results.forEach(p => {
      const a = document.createElement('a');
      a.className = 'search-item';
      a.href = p.href || 'detalle-5700x.html';
      a.innerHTML = `
        <div class="search-thumb"><img src="${p.img}" alt="${p.nombre}" style="width:80px;height:80px;object-fit:cover"></div>
        <div class="search-meta">
          <strong>${p.nombre}</strong>
          <div class="price">${p.precio ? 'C$'+p.precio : ''}</div>
        </div>
      `;
      ul.appendChild(a);
    });
    container.appendChild(ul);
  }

  function filterProducts(q){
    const s = (q||'').toLowerCase().trim();
    if(!s) return productIndex.slice(0, 50);
    return productIndex.filter(p => p.nombre.toLowerCase().includes(s) );
  }

  // Wire up inputs and behavior
  async function setup(){
    await buildIndex();

    // inputs to bind: #buscador (header and catalog pages), #search-input (buscador.html), .site-search
    const headerInput = document.getElementById('buscador');
    const siteInputs = Array.from(document.querySelectorAll('.site-search'));
    const searchInput = document.getElementById('search-input');

    const inputs = [];
    if(headerInput) inputs.push(headerInput);
    if(searchInput) inputs.push(searchInput);
    siteInputs.forEach(i => { if(!inputs.includes(i)) inputs.push(i); });

    function onInput(e){
      const q = e.target.value;
      const results = filterProducts(q);
      // ==========================
// OCULTAR / MOSTRAR SECCIONES EXTRA
// ==========================

const carruseles = document.querySelectorAll(".carousel");
const categorias = document.querySelectorAll(".ajustes-barra1, h1");
const filas = document.querySelectorAll(".fila-productos");
const carruselCont = document.querySelectorAll(".carrusel-contenedor");

if(q.trim() !== ""){
    // Ocultar carruseles
    carruseles.forEach(c => c.style.display = "none");

    // Ocultar títulos de categorías y h1
    categorias.forEach(c => c.style.display = "none");

    // Evitar espacios vacíos horizontales
    filas.forEach(f => f.style.flexDirection = "column");

    // Asegurar que los contenedores no ocupen altura innecesaria
    carruselCont.forEach(cc => cc.style.height = "auto");

} else {
    // Restaurar si no se está buscando
    carruseles.forEach(c => c.style.display = "");
    categorias.forEach(c => c.style.display = "");
    filas.forEach(f => f.style.flexDirection = "");
    carruselCont.forEach(cc => cc.style.height = "");
}
  

      // If this page contains tarjeta-producto elements, show/hide them
      const pageCards = document.querySelectorAll('.tarjeta-producto');
      if(pageCards && pageCards.length>0){
        pageCards.forEach(card => {
          const name = (card.dataset.nombre||'').toLowerCase();
          const show = !q || name.includes(q.toLowerCase());
          card.style.display = show ? '' : 'none';
        });
      }

      // If there is a #search-results container (buscador.html) render results there
      const resultsContainer = document.getElementById('search-results') || document.querySelector('#search-results');
      if(resultsContainer){
        renderSearchResults(results.slice(0,50), resultsContainer);
      }
    }

    inputs.forEach(i => {
      i.addEventListener('input', onInput);
      // optional: submit on Enter to go to buscador.html with query param
      i.addEventListener('keydown', function(ev){
        if(ev.key === 'Enter'){
          const q = encodeURIComponent(i.value.trim());
          if(location.pathname.endsWith('buscador.html')){
            // already on buscador page
            i.blur();
          } else {
            location.href = 'buscador.html?q=' + q;
          }
        }
      });
    });

    // If page is buscador.html and has ?q=... prefill and run
    if(location.pathname.endsWith('buscador.html')){
      const params = new URLSearchParams(location.search);
      const q = params.get('q') || params.get('q'.toUpperCase()) || '';
      const targetInput = searchInput || headerInput || document.querySelector('.site-search');
      if(targetInput && q){
        targetInput.value = decodeURIComponent(q);
        // trigger input event
        targetInput.dispatchEvent(new Event('input'));
      }
    }
  }

  // Initialize on DOM ready and after headerInserted
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }

  document.addEventListener('headerInserted', function(){
    // header insertion may add the header input; rebuild index and rebind
    setTimeout(setup, 0);
  });

})();
