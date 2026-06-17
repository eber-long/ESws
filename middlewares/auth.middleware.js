/* ============================================
   🔐 Auth Middleware — JWT y control de acceso
============================================ */
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

/* ─────────────────────────────────────────────
   Verificar Token JWT
   Extrae el token del header Authorization: Bearer <token>
   y lo decodifica. Guarda los datos del usuario en req.usuario.
───────────────────────────────────────────── */
function verificarToken(req, res, next) {
    let token;
    const authHeader = req.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        throw new AppError('No autorizado. Token no proporcionado.', 401);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded; // { id, nombre, rol }
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw new AppError('Sesión expirada. Inicia sesión de nuevo.', 401);
        }
        throw new AppError('Token inválido.', 401);
    }
}

/* ─────────────────────────────────────────────
   Verificar Admin
   Se usa DESPUÉS de verificarToken.
   Comprueba que req.usuario.rol === 'administrador'.
───────────────────────────────────────────── */
function verificarAdmin(req, res, next) {
    if (!req.usuario || req.usuario.rol !== 'administrador') {
        throw new AppError('Acceso denegado. Solo administradores pueden realizar esta acción.', 403);
    }
    next();
}

/* ─────────────────────────────────────────────
   Verificar Vendedor o Admin
   Se usa DESPUÉS de verificarToken.
   Permite acceso a usuarios con rol 'ventas' o 'administrador'.
───────────────────────────────────────────── */
function verificarVendedorOAdmin(req, res, next) {
    if (!req.usuario || !['administrador', 'ventas'].includes(req.usuario.rol)) {
        throw new AppError('Acceso denegado. Solo personal de ventas o administradores pueden realizar esta acción.', 403);
    }
    next();
}

module.exports = { verificarToken, verificarAdmin, verificarVendedorOAdmin };
