/* ============================================
   ✅ Validador de Usuario
   Verifica nombre y contraseña en registro/login.
============================================ */
const AppError = require('../utils/AppError');

/* Validación para registro y login */
function validarUsuario(req, res, next) {
    const { nombre, contrasena } = req.body;
    const errores = [];

    if (!nombre || nombre.trim() === '') {
        errores.push('El nombre es obligatorio.');
    } else if (nombre.trim().length < 3) {
        errores.push('El nombre debe tener al menos 3 caracteres.');
    }

    if (!contrasena || contrasena.trim() === '') {
        errores.push('La contraseña es obligatoria.');
    } else if (contrasena.length < 4) {
        errores.push('La contraseña debe tener al menos 4 caracteres.');
    }

    if (errores.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Datos inválidos',
            detalles: errores
        });
    }

    next();
}

/* Validación para edición (contraseña opcional si no se cambia) */
function validarUsuarioEdicion(req, res, next) {
    const { nombre, contrasena, rol, email } = req.body;
    const errores = [];

    if (!nombre || nombre.trim() === '') {
        errores.push('El nombre es obligatorio.');
    } else if (nombre.trim().length < 3) {
        errores.push('El nombre debe tener al menos 3 caracteres.');
    }

    // Contraseña solo se valida si se envía (para permitir editar sin cambiar)
    if (contrasena && contrasena.length < 4) {
        errores.push('La contraseña debe tener al menos 4 caracteres.');
    }

    if (!rol || !['administrador', 'ventas', 'comun'].includes(rol)) {
        errores.push('El rol de usuario debe ser "administrador", "ventas" o "comun".');
    }

    // Validar email si se proporciona
    if (email && email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            errores.push('El email proporcionado no es válido.');
        }
    }

    if (errores.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Datos inválidos',
            detalles: errores
        });
    }

    next();
}

module.exports = { validarUsuario, validarUsuarioEdicion };
