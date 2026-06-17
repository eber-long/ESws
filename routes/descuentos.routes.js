/* ============================================
   🏷️ Rutas de Descuentos — CRUD por Categoría
============================================ */
const express = require('express');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { verificarToken, verificarAdmin, verificarVendedorOAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

/* ─────────────────────────────────────────────
   GET /api/descuentos — Público
   Devuelve todos los descuentos.
───────────────────────────────────────────── */
router.get('/', asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT * FROM descuentos ORDER BY id');
    res.json(result.rows);
}));

/* ─────────────────────────────────────────────
   POST /api/descuentos — Admin
   Crea un nuevo descuento por categoría.
───────────────────────────────────────────── */
router.post('/', verificarToken, verificarVendedorOAdmin, asyncHandler(async (req, res) => {
    const { categoria, porcentaje, activo } = req.body;

    if (!categoria || porcentaje === undefined || porcentaje === null) {
        throw new AppError('Categoría y porcentaje son requeridos.', 400);
    }

    if (porcentaje < 0 || porcentaje > 100) {
        throw new AppError('El porcentaje debe estar entre 0 y 100.', 400);
    }

    // Verificar que no exista un descuento duplicado para la misma categoría
    const existing = await pool.query('SELECT id FROM descuentos WHERE categoria = $1', [categoria]);
    if (existing.rows.length > 0) {
        throw new AppError(`Ya existe un descuento para la categoría "${categoria}". Edítalo en su lugar.`, 409);
    }

    const result = await pool.query(
        `INSERT INTO descuentos (categoria, porcentaje, activo)
         VALUES ($1, $2, $3) RETURNING *`,
        [categoria, porcentaje, activo !== undefined ? activo : true]
    );

    res.status(201).json({ success: true, descuento: result.rows[0] });

    // 🔌 Emitir evento en tiempo real
    const io = req.app.get('io');
    if (io) io.emit('descuentoActualizado', result.rows[0]);
}));

/* ─────────────────────────────────────────────
   PUT /api/descuentos/:id — Admin
   Actualiza un descuento existente.
───────────────────────────────────────────── */
router.put('/:id', verificarToken, verificarVendedorOAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { categoria, porcentaje, activo } = req.body;

    if (porcentaje !== undefined && (porcentaje < 0 || porcentaje > 100)) {
        throw new AppError('El porcentaje debe estar entre 0 y 100.', 400);
    }

    const result = await pool.query(
        `UPDATE descuentos SET categoria = COALESCE($1, categoria),
         porcentaje = COALESCE($2, porcentaje),
         activo = COALESCE($3, activo)
         WHERE id = $4 RETURNING *`,
        [categoria, porcentaje, activo, id]
    );

    if (result.rows.length === 0) {
        throw new AppError('Descuento no encontrado.', 404);
    }

    res.json({ success: true, descuento: result.rows[0] });

    // 🔌 Emitir evento en tiempo real
    const io = req.app.get('io');
    if (io) io.emit('descuentoActualizado', result.rows[0]);
}));

/* ─────────────────────────────────────────────
   DELETE /api/descuentos/:id — Admin
───────────────────────────────────────────── */
router.delete('/:id', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM descuentos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
        throw new AppError('Descuento no encontrado.', 404);
    }

    res.json({ success: true, message: 'Descuento eliminado', descuento: result.rows[0] });

    // 🔌 Emitir evento en tiempo real
    const io = req.app.get('io');
    if (io) io.emit('descuentoEliminado', result.rows[0]);
}));

module.exports = router;
