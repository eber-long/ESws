/* ============================================
   🔐 Rutas de Autenticación — Login y Registro
============================================ */
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { validarUsuario } = require('../validators/usuario.validator');

const router = express.Router();
const SALT_ROUNDS = 10;

/* ─────────────────────────────────────────────
   POST /api/login
   Valida credenciales y retorna JWT.
───────────────────────────────────────────── */
router.post('/login', validarUsuario, asyncHandler(async (req, res) => {
    const { nombre, contrasena } = req.body;

    // Buscar usuario solo por nombre
    const result = await pool.query(
        `
SELECT
    u.id,
    u.nombre,
    u.contrasena,
    r.nombre AS rol
FROM usuarios u
JOIN roles r
ON u.rol_id = r.id
WHERE u.nombre = $1
`,
        [nombre]
    );

    if (result.rows.length === 0) {
        throw new AppError('Credenciales incorrectas', 401);
    }

    const usuario = result.rows[0];

    // Comparar contraseña con hash
    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!contrasenaValida) {
        throw new AppError('Credenciales incorrectas', 401);
    }

    // Generar JWT
    const token = jwt.sign(
        {
            id: usuario.id,
            nombre: usuario.nombre,
            rol: usuario.rol
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '8h'
        }
    );

    res.json({
        success: true,
        token,
        usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            rol: usuario.rol
        }
    });
}));

/* ─────────────────────────────────────────────
   POST /api/registro
   Crea usuario con contraseña hasheada.
───────────────────────────────────────────── */
router.post('/registro', validarUsuario, asyncHandler(async (req, res) => {
    const { nombre, contrasena, email } = req.body;

    // Verificar si el usuario ya existe
    const exists = await pool.query('SELECT id FROM usuarios WHERE nombre = $1', [nombre]);
    if (exists.rows.length > 0) {
        throw new AppError('Ya existe un usuario con ese nombre', 409);
    }

    // Hashear contraseña
    const hash = await bcrypt.hash(contrasena, SALT_ROUNDS);

    // Crear usuario con rol 'comun'
    const result = await pool.query(
        `INSERT INTO usuarios (
            nombre,
            contrasena,
            rol_id,
            email
        ) VALUES ($1, $2, $3, $4) RETURNING id, nombre, rol_id, email`,
        [
            nombre,
            hash,
            (
                await pool.query(
                    "SELECT id FROM roles WHERE nombre='comun'"
                )
            ).rows[0].id,
            email || null
        ]
    );

    res.status(201).json({
        success: true,
        usuario: result.rows[0]
    });
}));

module.exports = router;
