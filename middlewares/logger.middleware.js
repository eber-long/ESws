/* ============================================
   📋 Logger Middleware
   Registra método HTTP, URL y hora en cada petición.
============================================ */
function logger(req, res, next) {
    const ahora = new Date().toLocaleString('es-MX');
    console.log(`📋 [${ahora}] ${req.method} ${req.originalUrl}`);
    next();
}

module.exports = logger;
