/* ============================================
   ✅ Validador de Producto
   Verifica campos obligatorios al crear/editar.
============================================ */
const AppError = require('../utils/AppError');

function validarProducto(req, res, next) {
    const { nombre, categoria, precio, stock } = req.body;
    const errores = [];

    if (!nombre || nombre.trim() === '') {
        errores.push('El nombre del producto es obligatorio.');
    }
    if (!categoria || categoria.trim() === '') {
        errores.push('La categoría es obligatoria.');
    }
    if (precio == null || isNaN(precio) || Number(precio) <= 0) {
        errores.push('El precio debe ser un número mayor a 0.');
    }
    if (stock == null || isNaN(stock) || Number(stock) < 0) {
        errores.push('El stock debe ser un número mayor o igual a 0.');
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

module.exports = { validarProducto };
