/* ============================================
   🚨 AppError — Clase de error personalizada
   Permite lanzar errores con código de estado HTTP.
   Uso: throw new AppError('No encontrado', 404)
============================================ */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // Distingue errores esperados de bugs
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
