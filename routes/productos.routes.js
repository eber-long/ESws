/* ============================================
   📦 Rutas de Productos — CRUD + Upload + Roadmap v2
   Nuevos endpoints: /:id, /recientes, /buscar,
   /stats, /populares, /:id/vista, /:id/relacionados
============================================ */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { verificarToken, verificarAdmin, verificarVendedorOAdmin } = require('../middlewares/auth.middleware');
const { validarProducto } = require('../validators/producto.validator');

const router = express.Router();

/* ─────────────────────────────────────────────
   📸 Configuración de Multer
───────────────────────────────────────────── */
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|avif/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) {
            cb(null, true);
        } else {
            cb(new AppError('Formato de imagen no válido. Usa: jpg, png, gif, webp o avif.', 400));
        }
    }
});

/* ─────────────────────────────────────────────
   Función auxiliar: eliminar imagen del disco
───────────────────────────────────────────── */
function eliminarImagen(imagenPath) {
    if (!imagenPath || !imagenPath.startsWith('uploads/')) return;
    const fullPath = path.join(__dirname, '..', imagenPath);
    if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (err) => {
            if (err) console.error('Error al eliminar imagen:', err.message);
            else console.log('🗑️ Imagen eliminada:', imagenPath);
        });
    }
}

/* ─────────────────────────────────────────────
   GET /api/productos/recientes — Público
   Últimos 8 productos agregados
───────────────────────────────────────────── */
router.get('/recientes', asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 8;
    const result = await pool.query(
        'SELECT * FROM productos ORDER BY fecha_creacion DESC NULLS LAST LIMIT $1',
        [limit]
    );
    res.json(result.rows);
}));

/* ─────────────────────────────────────────────
   GET /api/productos/populares — Público
   Top productos por vistas
───────────────────────────────────────────── */
router.get('/populares', asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 8;
    const result = await pool.query(
        'SELECT * FROM productos WHERE vistas > 0 ORDER BY vistas DESC LIMIT $1',
        [limit]
    );
    res.json(result.rows);
}));

/* ─────────────────────────────────────────────
   GET /api/productos/buscar — Público
   Búsqueda inteligente por nombre, categoría, descripción
───────────────────────────────────────────── */
router.get('/buscar', asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
        return res.json([]);
    }
    const searchTerm = `%${q.trim()}%`;
    const result = await pool.query(
        `SELECT * FROM productos 
         WHERE nombre ILIKE $1 
            OR categoria ILIKE $1 
            OR descripcion ILIKE $1
         ORDER BY 
            CASE WHEN nombre ILIKE $1 THEN 0 ELSE 1 END,
            nombre ASC
         LIMIT 20`,
        [searchTerm]
    );
    res.json(result.rows);
}));

/* ─────────────────────────────────────────────
   GET /api/productos/stats — Admin
   Métricas del dashboard
───────────────────────────────────────────── */
router.get('/stats', asyncHandler(async (req, res) => {
    const [totalRes, agotadosRes, bajoStockRes, popularesRes] = await Promise.all([
        pool.query('SELECT COUNT(*) as total FROM productos'),
        pool.query('SELECT COUNT(*) as total FROM productos WHERE stock = 0'),
        pool.query('SELECT * FROM productos WHERE stock > 0 AND stock <= 5 ORDER BY stock ASC'),
        pool.query('SELECT * FROM productos WHERE vistas > 0 ORDER BY vistas DESC LIMIT 5')
    ]);

    res.json({
        total: parseInt(totalRes.rows[0].total),
        agotados: parseInt(agotadosRes.rows[0].total),
        bajo_stock: bajoStockRes.rows,
        populares: popularesRes.rows
    });
}));

/* ─────────────────────────────────────────────
   GET /api/productos/auditoria-stock — Admin
   Historial de cambios de stock
───────────────────────────────────────────── */
router.get(
    '/auditoria-stock',
    verificarToken,
    verificarAdmin,
    asyncHandler(async (req, res) => {
        const result = await pool.query(
`
SELECT
    a.id,
    p.nombre AS producto,
    u.nombre AS usuario,
    a.stock_anterior,
    a.stock_nuevo,
    a.diferencia,
    a.fecha
FROM auditoria_stock a
JOIN productos p
ON p.id=a.producto_id
JOIN usuarios u
ON u.id=a.usuario_id
ORDER BY a.fecha DESC
`
        );
        res.json(result.rows);
    })
);

/* ─────────────────────────────────────────────
   GET /api/productos — Público
───────────────────────────────────────────── */
router.get('/', asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT * FROM productos ORDER BY id');
    res.json(result.rows);
}));

/* ─────────────────────────────────────────────
   GET /api/productos/:id — Público
   Obtener un producto por ID
───────────────────────────────────────────── */
router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    // Validate that id is a number
    if (isNaN(parseInt(id))) {
        throw new AppError('ID de producto inválido', 400);
    }
    const result = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
    if (result.rows.length === 0) {
        throw new AppError('Producto no encontrado', 404);
    }
    res.json(result.rows[0]);
}));

/* ─────────────────────────────────────────────
   POST /api/productos/:id/vista — Público
   Incrementar contador de vistas
───────────────────────────────────────────── */
router.post('/:id/vista', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await pool.query(
        'UPDATE productos SET vistas = COALESCE(vistas, 0) + 1 WHERE id = $1 RETURNING vistas',
        [id]
    );
    if (result.rows.length === 0) {
        throw new AppError('Producto no encontrado', 404);
    }
    res.json({ success: true, vistas: result.rows[0].vistas });
}));

/* ─────────────────────────────────────────────
   GET /api/productos/:id/relacionados — Público
   Productos de la misma categoría (excluyendo el actual)
───────────────────────────────────────────── */
router.get('/:id/relacionados', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 4;

    // Get the product's category first
    const prodResult = await pool.query('SELECT categoria FROM productos WHERE id = $1', [id]);
    if (prodResult.rows.length === 0) {
        throw new AppError('Producto no encontrado', 404);
    }

    const categoria = prodResult.rows[0].categoria;
    const result = await pool.query(
        'SELECT * FROM productos WHERE categoria = $1 AND id != $2 ORDER BY RANDOM() LIMIT $3',
        [categoria, id, limit]
    );
    res.json(result.rows);
}));

/* ─────────────────────────────────────────────
   POST /api/productos — Admin
───────────────────────────────────────────── */
router.post('/', verificarToken, verificarVendedorOAdmin, validarProducto, asyncHandler(async (req, res) => {
    const { nombre, categoria, precio, stock, imagen, descripcion } = req.body;
    const result = await pool.query(
        `INSERT INTO productos (nombre, categoria, precio, stock, imagen, descripcion, fecha_creacion)
         VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
        [nombre, categoria, precio, stock, imagen || 'imagen/ES.png', descripcion || '']
    );
    res.status(201).json({ success: true, producto: result.rows[0] });

    // 🔌 Emitir evento en tiempo real
    const io = req.app.get('io');
    if (io) io.emit('nuevoProducto', result.rows[0]);
}));

/* ─────────────────────────────────────────────
   PUT /api/productos/:id — Admin
───────────────────────────────────────────── */
router.put('/:id', verificarToken, verificarVendedorOAdmin, validarProducto, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { nombre, categoria, precio, stock, imagen, descripcion } = req.body;

    // Si cambió la imagen, eliminar la anterior
    const current = await pool.query(
`
SELECT imagen, stock
FROM productos
WHERE id=$1
`,
[id]
    );

    if (current.rows.length === 0) {
        throw new AppError('Producto no encontrado', 404);
    }

    const stockAnterior = current.rows[0].stock;

    if (imagen && current.rows[0].imagen !== imagen) {
        eliminarImagen(current.rows[0].imagen);
    }

    const result = await pool.query(
        `UPDATE productos SET nombre=$1, categoria=$2, precio=$3, stock=$4, imagen=$5, descripcion=$6
         WHERE id=$7 RETURNING *`,
        [nombre, categoria, precio, stock, imagen, descripcion, id]
    );

    if (result.rows.length === 0) {
        throw new AppError('Producto no encontrado', 404);
    }

    const stockNuevo = result.rows[0].stock;

    if (stockAnterior !== stockNuevo) {
        await pool.query(
        `
        INSERT INTO auditoria_stock(
            producto_id,
            usuario_id,
            accion,
            stock_anterior,
            stock_nuevo,
            diferencia,
            motivo
        )
        VALUES($1,$2,$3,$4,$5,$6,$7)
        `,
        [
            id,
            req.usuario.id,
            'MODIFICACION_STOCK',
            stockAnterior,
            stockNuevo,
            stockNuevo - stockAnterior,
            'Actualización manual'
        ]
        );
    }

    res.json({ success: true, producto: result.rows[0] });

    // 🔌 Emitir evento en tiempo real
    const io = req.app.get('io');
    if (io) {
        io.emit('productoActualizado', result.rows[0]);
        // Si cambió el stock, emitir evento específico
        if (current.rows.length > 0 && current.rows[0].stock !== undefined) {
            io.emit('stockActualizado', result.rows[0]);
        }
    }
}));

/* ─────────────────────────────────────────────
   DELETE /api/productos/:id — Admin
   Elimina también la imagen asociada.
───────────────────────────────────────────── */
router.delete('/:id', verificarToken, verificarAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM productos WHERE id=$1 RETURNING *', [id]);

    if (result.rows.length === 0) {
        throw new AppError('Producto no encontrado', 404);
    }

    // Eliminar imagen del disco
    eliminarImagen(result.rows[0].imagen);

    res.json({ success: true, message: 'Producto eliminado', producto: result.rows[0] });

    // 🔌 Emitir evento en tiempo real
    const io = req.app.get('io');
    if (io) io.emit('productoEliminado', result.rows[0]);
}));

/* ─────────────────────────────────────────────
   POST /api/upload — Subida de imagen
───────────────────────────────────────────── */
router.post('/upload', upload.single('imagen'), (req, res) => {
    if (!req.file) {
        throw new AppError('No se recibió ninguna imagen válida', 400);
    }
    res.json({ success: true, path: `uploads/${req.file.filename}` });
});

module.exports = router;
