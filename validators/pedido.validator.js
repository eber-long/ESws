/* ============================================
   ✅ Validador de Pedido
   Verifica código, cliente, productos y total.
============================================ */
const AppError = require('../utils/AppError');

function validarPedido(req, res, next) {
    const { codigo, cliente, productos, total } = req.body;
    const errores = [];

    if (!codigo || codigo.trim() === '') {
        errores.push('El código del pedido es obligatorio.');
    }
    if (!cliente || cliente.trim() === '') {
        errores.push('El nombre del cliente es obligatorio.');
    }

    // Productos puede ser un array o un string
    if (!productos) {
        errores.push('Los productos son obligatorios.');
    } else if (Array.isArray(productos) && productos.length === 0) {
        errores.push('Debe incluir al menos un producto.');
    } else if (typeof productos === 'string' && productos.trim() === '') {
        errores.push('Los productos son obligatorios.');
    }

    if (total == null || isNaN(total) || Number(total) <= 0) {
        errores.push('El total debe ser un número mayor a 0.');
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

module.exports = { validarPedido };
