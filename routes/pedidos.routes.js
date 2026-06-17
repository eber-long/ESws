/* ============================================
   🧾 Rutas de Pedidos — CRUD + Stock + Historial + Roadmap v2
   Nuevos: /mis-pedidos, /top-productos
============================================ */
const express = require('express');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { verificarToken, verificarAdmin, verificarVendedorOAdmin } = require('../middlewares/auth.middleware');
const { validarPedido } = require('../validators/pedido.validator');

const router = express.Router();

/* ─────────────────────────────────────────────
   GET /api/pedidos/mis-pedidos — Autenticado
   Historial de pedidos del usuario logueado
───────────────────────────────────────────── */
router.get('/mis-pedidos', verificarToken, asyncHandler(async (req, res) => {
    const userId = req.usuario.id;
    const userName = req.usuario.nombre;

    // Search by usuario_id first, fall back to cliente name
    const result = await pool.query(
        `SELECT * FROM pedidos 
         WHERE usuario_id = $1 OR cliente = $2 
         ORDER BY fecha DESC`,
        [userId, userName]
    );
    res.json(result.rows);
}));

/* ─────────────────────────────────────────────
   GET /api/pedidos/top-productos — Público
   Top 5 productos más vendidos
───────────────────────────────────────────── */
router.get('/top-productos', asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;
    
    // Try pedido_productos table first (accurate)
    try {
        const result = await pool.query(
            `SELECT pp.producto_id, p.nombre, p.imagen, p.precio, p.categoria,
                    COUNT(*) as ventas, SUM(pp.cantidad) as total_vendido
             FROM pedido_productos pp
             JOIN productos p ON pp.producto_id = p.id
             GROUP BY pp.producto_id, p.nombre, p.imagen, p.precio, p.categoria
             ORDER BY total_vendido DESC
             LIMIT $1`,
            [limit]
        );
        
        if (result.rows.length > 0) {
            return res.json(result.rows);
        }
    } catch (e) {
        // pedido_productos might not have data, fall back
    }

    // Fallback: count product appearances in pedidos.productos array
    const result = await pool.query(
        `SELECT unnest(productos) as nombre, COUNT(*) as ventas
         FROM pedidos 
         WHERE estado != 'cancelado'
         GROUP BY unnest(productos)
         ORDER BY ventas DESC
         LIMIT $1`,
        [limit]
    );

    // Enrich with product data
    const enriched = [];
    for (const row of result.rows) {
        const prod = await pool.query(
            'SELECT id, nombre, imagen, precio, categoria FROM productos WHERE nombre = $1',
            [row.nombre]
        );
        if (prod.rows.length > 0) {
            enriched.push({
                ...prod.rows[0],
                ventas: parseInt(row.ventas),
                total_vendido: parseInt(row.ventas)
            });
        }
    }

    res.json(enriched);
}));

/* ─────────────────────────────────────────────
   GET /api/pedidos — Autenticado
───────────────────────────────────────────── */
router.get('/', verificarToken, asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT * FROM pedidos ORDER BY fecha DESC');
    res.json(result.rows);
}));

/* ─────────────────────────────────────────────
   POST /api/pedidos — Autenticado
   • Valida stock de cada producto
   • Descuenta stock automáticamente
   • Registra en historial_estados
───────────────────────────────────────────── */
router.post('/', verificarToken, validarPedido, asyncHandler(async (req, res) => {
    const { codigo, cliente, productos, total } = req.body;

    // Normalizar productos a array
    const productosArray = Array.isArray(productos)
        ? productos
        : (typeof productos === 'string' ? productos.split(',').map(p => p.trim()) : []);

    if (productosArray.length === 0) {
        throw new AppError('Debe incluir al menos un producto', 400);
    }

    // Usar transacción para atomicidad (stock + insert)
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verificar y descontar stock de cada producto
        for (const nombreProd of productosArray) {
            const prodResult = await client.query(
                'SELECT id, nombre, stock FROM productos WHERE nombre = $1 FOR UPDATE',
                [nombreProd]
            );

            if (prodResult.rows.length === 0) {
                throw new AppError(`Producto "${nombreProd}" no encontrado`, 404);
            }

            const prod = prodResult.rows[0];
            if (parseInt(prod.stock) <= 0) {
                throw new AppError(`Sin stock disponible para "${nombreProd}"`, 400);
            }

            // Descontar 1 unidad de stock
            await client.query(
                'UPDATE productos SET stock = stock - 1 WHERE id = $1',
                [prod.id]
            );
        }

        // Historial inicial
        const historial = JSON.stringify([{
            de: null,
            a: 'pendiente',
            fecha: new Date().toISOString()
        }]);

        // Get user ID from JWT
        const usuarioId = req.usuario ? req.usuario.id : null;

        const result = await client.query(
            `INSERT INTO pedidos (codigo, cliente, productos, total, estado, fecha, historial_estados, usuario_id)
             VALUES ($1, $2, $3, $4, 'pendiente', CURRENT_DATE, $5, $6) RETURNING *`,
            [codigo, cliente, productosArray, total, historial, usuarioId]
        );

        await client.query('COMMIT');
        res.status(201).json({ success: true, pedido: result.rows[0] });

        // 🔌 Emitir evento en tiempo real
        const io = req.app.get('io');
        if (io) {
            io.emit('nuevoPedido', result.rows[0]);
            // También notificar cambio de stock de los productos afectados
            for (const nombreProd of productosArray) {
                const updatedProd = await pool.query('SELECT * FROM productos WHERE nombre = $1', [nombreProd]);
                if (updatedProd.rows.length > 0) {
                    io.emit('stockActualizado', updatedProd.rows[0]);
                }
            }
        }

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}));

/* ─────────────────────────────────────────────
   PUT /api/pedidos/:id — Admin: cambiar estado
   • Registra cambio en historial_estados
   • Restaura stock si se cancela
───────────────────────────────────────────── */
router.put('/:id', verificarToken, verificarVendedorOAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['pendiente', 'completado', 'cancelado'];
    if (!estado || !estadosValidos.includes(estado)) {
        throw new AppError('Estado inválido. Use: pendiente, completado o cancelado.', 400);
    }

    // Obtener pedido actual
    const current = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    if (current.rows.length === 0) {
        throw new AppError('Pedido no encontrado', 404);
    }

    const pedido = current.rows[0];
    const estadoAnterior = pedido.estado;

    // Si se cancela un pedido que no estaba cancelado, restaurar stock
    if (estado === 'cancelado' && estadoAnterior !== 'cancelado') {
        const productosArray = Array.isArray(pedido.productos)
            ? pedido.productos
            : [];

        for (const nombreProd of productosArray) {
            await pool.query(
                'UPDATE productos SET stock = stock + 1 WHERE nombre = $1',
                [nombreProd]
            );
        }
    }

    // Actualizar historial
    let historial = [];
    try {
        historial = pedido.historial_estados ? JSON.parse(JSON.stringify(pedido.historial_estados)) : [];
    } catch (e) {
        historial = [];
    }
    // Ensure historial is actually an array
    if (!Array.isArray(historial)) historial = [];

    historial.push({
        de: estadoAnterior,
        a: estado,
        fecha: new Date().toISOString()
    });

    const result = await pool.query(
        'UPDATE pedidos SET estado=$1, historial_estados=$2 WHERE id=$3 RETURNING *',
        [estado, JSON.stringify(historial), id]
    );

    res.json({ success: true, pedido: result.rows[0] });

    // 🔌 Emitir evento en tiempo real
    const io = req.app.get('io');
    if (io) io.emit('pedidoActualizado', result.rows[0]);
}));

/* ─────────────────────────────────────────────
   POST /api/pedidos/:id/confirmar — Vendedor/Admin
   Confirma la venta, cambia estado a completado,
   genera número de factura secuencial y guarda quién confirmó.
───────────────────────────────────────────── */
router.post('/:id/confirmar', verificarToken, verificarVendedorOAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const vendedorId = req.usuario.id;

    // Obtener pedido actual
    const current = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    if (current.rows.length === 0) {
        throw new AppError('Pedido no encontrado', 404);
    }

    const pedido = current.rows[0];

    if (pedido.estado === 'cancelado') {
        throw new AppError('No se puede confirmar un pedido cancelado.', 400);
    }

    if (pedido.estado === 'completado') {
        return res.json({ success: true, message: 'El pedido ya estaba confirmado', pedido });
    }

    // Generar número de factura secuencial
    const year = new Date().getFullYear();
    const lastFacturaRes = await pool.query(
        "SELECT factura_numero FROM pedidos WHERE factura_numero LIKE $1 ORDER BY factura_numero DESC LIMIT 1",
        [`FAC-${year}-%`]
    );
    let nextNum = 1;
    if (lastFacturaRes.rows.length > 0 && lastFacturaRes.rows[0].factura_numero) {
        const parts = lastFacturaRes.rows[0].factura_numero.split('-');
        const lastNumStr = parts[parts.length - 1];
        nextNum = parseInt(lastNumStr, 10) + 1;
    }
    const facturaNumero = `FAC-${year}-${String(nextNum).padStart(4, '0')}`;

    // Actualizar historial
    let historial = [];
    try {
        historial = pedido.historial_estados ? JSON.parse(JSON.stringify(pedido.historial_estados)) : [];
    } catch (e) {
        historial = [];
    }
    if (!Array.isArray(historial)) historial = [];

    historial.push({
        de: pedido.estado,
        a: 'completado',
        fecha: new Date().toISOString()
    });

    const result = await pool.query(
        `UPDATE pedidos 
         SET estado = 'completado', 
             historial_estados = $1, 
             factura_numero = $2, 
             confirmado_por = $3, 
             fecha_confirmacion = NOW() 
         WHERE id = $4 RETURNING *`,
        [JSON.stringify(historial), facturaNumero, vendedorId, id]
    );

    res.json({ success: true, pedido: result.rows[0] });

    // 🔌 Emitir evento en tiempo real
    const io = req.app.get('io');
    if (io) io.emit('pedidoActualizado', result.rows[0]);
}));

module.exports = router;
