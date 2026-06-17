/* ============================================
   🚨 Error Middleware — Manejador global de errores
   Express lo reconoce por sus 4 parámetros.
   Va AL FINAL, después de todas las rutas.
============================================ */
function manejadorDeErrores(err, req, res, next) {
    // Si ya se envió una respuesta, delegar a Express
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;
    const isOperational = err.isOperational || false;

    // Loguear solo errores inesperados con stack completo
    if (!isOperational) {
        console.error('🚨 Error no manejado:', err.stack || err.message || err);
    } else {
        console.warn(`⚠️ [${statusCode}] ${err.message}`);
    }

    res.status(statusCode).json({
        success: false,
        error: isOperational ? err.message : 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && !isOperational && { stack: err.stack })
    });
}

module.exports = manejadorDeErrores;
