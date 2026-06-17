/* ============================================
   🎟️ Rutas de Cupones — Validación + CRUD Admin
============================================ */
const express = require('express');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { verificarToken, verificarAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Ensure cupones table exists
pool.query(`
    CREATE TABLE IF NOT EXISTS cupones (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(50) UNIQUE NOT NULL,
        porcentaje INTEGER NOT NULL CHECK (porcentaje > 0 AND porcentaje <= 100),
        activo BOOLEAN DEFAULT true,
        usos_maximos INTEGER DEFAULT NULL,
        usos_actuales INTEGER DEFAULT 0,
        fecha_expiracion DATE DEFAULT NULL,
        fecha_creacion TIMESTAMP DEFAULT NOW()
    )
`).then(() => console.log('✅ Tabla cupones verificada'))
  .catch(err => console.error('❌ Error verificando tabla cupones:', err.message));

/* ─────────────────────────────────────────────
   GET /api/cupones/validar/:codigo — Público
   Valida un cupón y devuelve el porcentaje
───────────────────────────────────────────── */
router.get('/validar/:codigo', asyncHandler(async (req, res) => {
    const { codigo } = req.params;
    const result = await pool.query(
        'SELECT * FROM cupones WHERE UPPER(codigo) = UPPER($1)',
        [codigo]
    );

    if (result.rows.length === 0) {
        throw new AppError('Cupón no encontrado', 404);
    }

    const cupon = result.rows[0];

    // Check if active
    if (!cupon.activo) {
        throw new AppError('Este cupón está desactivado', 400);
    }

    // Check expiration
    if (cupon.fecha_expiracion && new Date(cupon.fecha_expiracion) < new Date()) {
        throw new AppError('Este cupón ha expirado', 400);
    }

    // Check max uses
    if (cupon.usos_maximos !== null && cupon.usos_actuales >= cupon.usos_maximos) {
        throw new AppError('Este cupón ha alcanzado su límite de usos', 400);
    }

    res.json({
        success: true,
        cupon: {
            codigo: cupon.codigo,
            porcentaje: cupon.porcentaje
        }
    });
}));

/* ─────────────────────────────────────────────
   POST /api/cupones/usar/:codigo — Autenticado
   Marcar un cupón como usado (+1 uso)
───────────────────────────────────────────── */
router.post('/usar/:codigo', verificarToken, asyncHandler(async (req, res) => {
    const { codigo } = req.params;
    const result = await pool.query(
        `UPDATE cupones SET usos_actuales = usos_actuales + 1 
         WHERE UPPER(codigo) = UPPER($1) AND activo = true
         RETURNING *`,
        [codigo]
    );

    if (result.rows.length === 0) {
        throw new AppError('Cupón no encontrado o desactivado', 404);
    }

    res.json({ success: true, cupon: result.rows[0] });
}));

/* ─────────────────────────────────────────────
   GET /api/cupones — Admin
───────────────────────────────────────────── */
router.get('/', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT * FROM cupones ORDER BY id');
    res.json(result.rows);
}));

/* ─────────────────────────────────────────────
   POST /api/cupones — Admin: Crear cupón
───────────────────────────────────────────── */
router.post('/', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
    const { codigo, porcentaje, activo, usos_maximos, fecha_expiracion } = req.body;

    if (!codigo || !porcentaje) {
        throw new AppError('Código y porcentaje son requeridos', 400);
    }

    const result = await pool.query(
        `INSERT INTO cupones (codigo, porcentaje, activo, usos_maximos, fecha_expiracion)
         VALUES (UPPER($1), $2, $3, $4, $5) RETURNING *`,
        [codigo, porcentaje, activo !== undefined ? activo : true, usos_maximos || null, fecha_expiracion || null]
    );

    res.status(201).json({ success: true, cupon: result.rows[0] });
}));

/* ─────────────────────────────────────────────
   PUT /api/cupones/:id — Admin: Editar cupón
───────────────────────────────────────────── */
router.put('/:id', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { codigo, porcentaje, activo, usos_maximos, fecha_expiracion } = req.body;

    const result = await pool.query(
        `UPDATE cupones SET 
            codigo = COALESCE(UPPER($1), codigo),
            porcentaje = COALESCE($2, porcentaje),
            activo = COALESCE($3, activo),
            usos_maximos = $4,
            fecha_expiracion = $5
         WHERE id = $6 RETURNING *`,
        [codigo, porcentaje, activo, usos_maximos || null, fecha_expiracion || null, id]
    );

    if (result.rows.length === 0) {
        throw new AppError('Cupón no encontrado', 404);
    }

    res.json({ success: true, cupon: result.rows[0] });
}));

/* ─────────────────────────────────────────────
   DELETE /api/cupones/:id — Admin
───────────────────────────────────────────── */
router.delete('/:id', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM cupones WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
        throw new AppError('Cupón no encontrado', 404);
    }

    res.json({ success: true, message: 'Cupón eliminado' });
}));

module.exports = router;
