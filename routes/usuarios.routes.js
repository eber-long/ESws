/* ============================================
   👥 Rutas de Usuarios — CRUD + Lista de Deseos
============================================ */
const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { verificarToken, verificarAdmin } = require('../middlewares/auth.middleware');
const { validarUsuario, validarUsuarioEdicion } = require('../validators/usuario.validator');

const router = express.Router();
const SALT_ROUNDS = 10;

// Asegurar que la columna lista_deseos existe
pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS lista_deseos TEXT[] DEFAULT '{}'`)
    .then(() => console.log('✅ Migración lista_deseos verificada'))
    .catch(err => console.error('❌ Error verificando lista_deseos:', err.message));

/* ─────────────────────────────────────────────
   GET /api/usuarios — Admin
   No devuelve contraseñas.
───────────────────────────────────────────── */
router.get('/', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
    const result = await pool.query(`
        SELECT u.id, u.nombre, u.email, r.nombre AS rol
        FROM usuarios u
        LEFT JOIN roles r ON u.rol_id = r.id
        ORDER BY u.id
    `);
    res.json(result.rows);
}));

/* ─────────────────────────────────────────────
   POST /api/usuarios — Admin: Crear usuario
───────────────────────────────────────────── */
router.post('/', verificarToken, verificarAdmin, validarUsuario, asyncHandler(async (req, res) => {
    const { nombre, contrasena, rol, email } = req.body;
    const valorRol = rol || 'comun';

    // Verificar duplicados
    const exists = await pool.query('SELECT id FROM usuarios WHERE nombre = $1', [nombre]);
    if (exists.rows.length > 0) {
        throw new AppError('Ya existe un usuario con ese nombre', 409);
    }

    // Hashear contraseña
    const hash = await bcrypt.hash(contrasena, SALT_ROUNDS);

    // Obtener rol_id
    const rolRes = await pool.query('SELECT id FROM roles WHERE nombre = $1', [valorRol]);
    const rolId = rolRes.rows.length > 0 ? rolRes.rows[0].id : (await pool.query("SELECT id FROM roles WHERE nombre = 'comun'")).rows[0].id;

    const result = await pool.query(
        'INSERT INTO usuarios (nombre, contrasena, rol_id, email) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email',
        [nombre, hash, rolId, email || null]
    );

    res.status(201).json({
        success: true,
        usuario: {
            id: result.rows[0].id,
            nombre: result.rows[0].nombre,
            email: result.rows[0].email,
            rol: valorRol
        }
    });
}));

/* ─────────────────────────────────────────────
   PUT /api/usuarios/:id — Admin: Editar usuario
   Si no se envía contraseña, no se cambia.
───────────────────────────────────────────── */
router.put('/:id', verificarToken, verificarAdmin, validarUsuarioEdicion, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { nombre, contrasena, rol, email } = req.body;
    const valorRol = rol || 'comun';

    // Obtener rol_id
    const rolRes = await pool.query('SELECT id FROM roles WHERE nombre = $1', [valorRol]);
    const rolId = rolRes.rows.length > 0 ? rolRes.rows[0].id : (await pool.query("SELECT id FROM roles WHERE nombre = 'comun'")).rows[0].id;

    // Si se envía contraseña, hashearla; si no, mantener la actual
    let query, params;
    if (contrasena && contrasena.trim() !== '') {
        const hash = await bcrypt.hash(contrasena, SALT_ROUNDS);
        query = 'UPDATE usuarios SET nombre=$1, contrasena=$2, rol_id=$3, email=$4 WHERE id=$5 RETURNING id, nombre, email';
        params = [nombre, hash, rolId, email || null, id];
    } else {
        query = 'UPDATE usuarios SET nombre=$1, rol_id=$2, email=$3 WHERE id=$4 RETURNING id, nombre, email';
        params = [nombre, rolId, email || null, id];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
        throw new AppError('Usuario no encontrado', 404);
    }

    res.json({
        success: true,
        usuario: {
            id: result.rows[0].id,
            nombre: result.rows[0].nombre,
            email: result.rows[0].email,
            rol: valorRol
        }
    });
}));

/* ─────────────────────────────────────────────
   DELETE /api/usuarios/:id — Admin
───────────────────────────────────────────── */
router.delete('/:id', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM usuarios WHERE id=$1 RETURNING id, nombre', [id]);

    if (result.rows.length === 0) {
        throw new AppError('Usuario no encontrado', 404);
    }

    res.json({ success: true, message: 'Usuario eliminado', usuario: result.rows[0] });
}));

/* ─────────────────────────────────────────────
   ❤️ Lista de Deseos
───────────────────────────────────────────── */

// GET /api/usuarios/:nombre/deseos
router.get('/:nombre/deseos', verificarToken, asyncHandler(async (req, res) => {
    const { nombre } = req.params;
    const result = await pool.query('SELECT lista_deseos FROM usuarios WHERE nombre = $1', [nombre]);

    if (result.rows.length === 0) {
        throw new AppError('Usuario no encontrado', 404);
    }

    res.json(result.rows[0].lista_deseos || []);
}));

// POST /api/usuarios/:nombre/deseos — Toggle deseo
router.post('/:nombre/deseos', verificarToken, asyncHandler(async (req, res) => {
    const { nombre } = req.params;
    const { producto } = req.body;

    if (!producto) {
        throw new AppError('Falta el nombre del producto', 400);
    }

    const userRes = await pool.query('SELECT id, lista_deseos FROM usuarios WHERE nombre = $1', [nombre]);
    if (userRes.rows.length === 0) {
        throw new AppError('Usuario no encontrado', 404);
    }

    let deseos = userRes.rows[0].lista_deseos || [];

    // Toggle
    if (deseos.includes(producto)) {
        deseos = deseos.filter(p => p !== producto);
    } else {
        deseos.push(producto);
    }

    await pool.query('UPDATE usuarios SET lista_deseos = $1 WHERE nombre = $2', [deseos, nombre]);
    res.json({ success: true, lista_deseos: deseos });
}));

module.exports = router;
