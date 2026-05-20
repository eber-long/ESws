/* ============================================
   🚀 ElectroShop — Servidor Express + PostgreSQL
   ============================================ */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 3000;

/* ============================================
   ⚙️ MIDDLEWARE
============================================ */
app.use(cors());
app.use(express.json());

// Servir TODOS los archivos estáticos (HTML, CSS, JS, imágenes)
app.use(express.static(path.join(__dirname)));

// Crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Servir archivos subidos
app.use('/uploads', express.static(uploadsDir));

// Configurar Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|avif/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        cb(null, ext && mime);
    }
});

/* ============================================
   🗄️ CONEXIÓN A POSTGRESQL
============================================ */
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'ElectroShopDB',
    password: '1femboys1',
    port: 5432,
});

// Verificar conexión al iniciar
pool.query('SELECT NOW()')
    .then(() => console.log('✅ Conectado a PostgreSQL (ElectroShopDB)'))
    .catch(err => console.error('❌ Error de conexión a PostgreSQL:', err.message));

/* ============================================
   🔐 LOGIN
============================================ */
app.post('/api/login', async (req, res) => {
    try {
        const { nombre, contrasena } = req.body;

        if (!nombre || !contrasena) {
            return res.status(400).json({ error: 'Nombre y contraseña son requeridos' });
        }

        const result = await pool.query(
            'SELECT id, nombre, tipo FROM usuarios WHERE nombre = $1 AND contrasena = $2',
            [nombre, contrasena]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/* ============================================
   📝 REGISTRO DE USUARIO
============================================ */
app.post('/api/registro', async (req, res) => {
    try {
        const { nombre, contrasena } = req.body;

        if (!nombre || !contrasena) {
            return res.status(400).json({ error: 'Nombre y contraseña son requeridos' });
        }

        if (nombre.length < 3) {
            return res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres' });
        }

        if (contrasena.length < 4) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
        }

        // Verificar si el usuario ya existe
        const exists = await pool.query('SELECT id FROM usuarios WHERE nombre = $1', [nombre]);
        if (exists.rows.length > 0) {
            return res.status(409).json({ error: 'Ya existe un usuario con ese nombre' });
        }

        // Crear usuario con tipo 'comun' (el registro público siempre es usuario común)
        const result = await pool.query(
            'INSERT INTO usuarios (nombre, contrasena, tipo) VALUES ($1, $2, $3) RETURNING id, nombre, contrasena, tipo',
            [nombre, contrasena, 'comun']
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error en registro:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/* ============================================
   📦 API — PRODUCTOS
============================================ */

// GET todos los productos
app.get('/api/productos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener productos:', err);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// POST crear producto
app.post('/api/productos', async (req, res) => {
    try {
        const { nombre, categoria, precio, stock, imagen, descripcion } = req.body;
        const result = await pool.query(
            `INSERT INTO productos (nombre, categoria, precio, stock, imagen, descripcion)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [nombre, categoria, precio, stock, imagen || 'imagen/ES.png', descripcion || '']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al crear producto:', err);
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

// PUT editar producto
app.put('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, categoria, precio, stock, imagen, descripcion } = req.body;
        const result = await pool.query(
            `UPDATE productos SET nombre=$1, categoria=$2, precio=$3, stock=$4, imagen=$5, descripcion=$6
             WHERE id=$7 RETURNING *`,
            [nombre, categoria, precio, stock, imagen, descripcion, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al editar producto:', err);
        res.status(500).json({ error: 'Error al editar producto' });
    }
});

// DELETE eliminar producto
app.delete('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM productos WHERE id=$1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ message: 'Producto eliminado', producto: result.rows[0] });
    } catch (err) {
        console.error('Error al eliminar producto:', err);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

/* ============================================
   👥 API — USUARIOS
============================================ */

// GET todos los usuarios
app.get('/api/usuarios', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre, contrasena, tipo FROM usuarios ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener usuarios:', err);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// POST crear usuario
app.post('/api/usuarios', async (req, res) => {
    try {
        const { nombre, contrasena, tipo } = req.body;

        // Verificar duplicados
        const exists = await pool.query('SELECT id FROM usuarios WHERE nombre = $1', [nombre]);
        if (exists.rows.length > 0) {
            return res.status(409).json({ error: 'Ya existe un usuario con ese nombre' });
        }

        const result = await pool.query(
            'INSERT INTO usuarios (nombre, contrasena, tipo) VALUES ($1, $2, $3) RETURNING id, nombre, contrasena, tipo',
            [nombre, contrasena, tipo]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al crear usuario:', err);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

// PUT editar usuario
app.put('/api/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, contrasena, tipo } = req.body;
        const result = await pool.query(
            'UPDATE usuarios SET nombre=$1, contrasena=$2, tipo=$3 WHERE id=$4 RETURNING id, nombre, contrasena, tipo',
            [nombre, contrasena, tipo, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al editar usuario:', err);
        res.status(500).json({ error: 'Error al editar usuario' });
    }
});

// DELETE eliminar usuario
app.delete('/api/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM usuarios WHERE id=$1 RETURNING id, nombre', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json({ message: 'Usuario eliminado', usuario: result.rows[0] });
    } catch (err) {
        console.error('Error al eliminar usuario:', err);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});

/* ============================================
   ❤️ API — LISTA DE DESEOS
============================================ */
// Asegurar que la columna existe (Migración automática)
pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS lista_deseos TEXT[] DEFAULT '{}'`)
    .then(() => console.log('✅ Migración lista_deseos verificada'))
    .catch(err => console.error('❌ Error verificando lista_deseos:', err.message));

// GET deseos de un usuario
app.get('/api/usuarios/:nombre/deseos', async (req, res) => {
    try {
        const { nombre } = req.params;
        const result = await pool.query('SELECT lista_deseos FROM usuarios WHERE nombre = $1', [nombre]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(result.rows[0].lista_deseos || []);
    } catch (err) {
        console.error('Error al obtener deseos:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST agregar/quitar deseo
app.post('/api/usuarios/:nombre/deseos', async (req, res) => {
    try {
        const { nombre } = req.params;
        const { producto } = req.body; // Nombre del producto
        if (!producto) return res.status(400).json({ error: 'Falta producto' });

        const userRes = await pool.query('SELECT id, lista_deseos FROM usuarios WHERE nombre = $1', [nombre]);
        if (userRes.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

        let deseos = userRes.rows[0].lista_deseos || [];
        
        // Toggle
        if (deseos.includes(producto)) {
            deseos = deseos.filter(p => p !== producto);
        } else {
            deseos.push(producto);
        }

        await pool.query('UPDATE usuarios SET lista_deseos = $1 WHERE nombre = $2', [deseos, nombre]);
        res.json({ lista_deseos: deseos });
    } catch (err) {
        console.error('Error al actualizar deseos:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


/* ============================================
   📸 API — UPLOAD DE IMÁGENES
============================================ */
app.post('/api/upload', upload.single('imagen'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se recibió ninguna imagen válida' });
    }
    res.json({ path: `uploads/${req.file.filename}` });
});

/* ============================================
   🧾 API — PEDIDOS
============================================ */

// GET todos los pedidos
app.get('/api/pedidos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM pedidos ORDER BY fecha DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener pedidos:', err);
        res.status(500).json({ error: 'Error al obtener pedidos' });
    }
});

// POST nuevo pedido
app.post('/api/pedidos', async (req, res) => {
    try {
        const { codigo, cliente, productos, total } = req.body;
        if (!codigo || !cliente || !productos || total == null) {
            return res.status(400).json({ error: 'Faltan datos requeridos' });
        }

        const result = await pool.query(
            `INSERT INTO pedidos (codigo, cliente, productos, total, estado, fecha) 
             VALUES ($1, $2, $3, $4, 'pendiente', CURRENT_DATE) RETURNING *`,
            [codigo, cliente, productos, total]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al crear pedido:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT cambiar estado de pedido
app.put('/api/pedidos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        const result = await pool.query(
            'UPDATE pedidos SET estado=$1 WHERE id=$2 RETURNING *',
            [estado, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al actualizar pedido:', err);
        res.status(500).json({ error: 'Error al actualizar pedido' });
    }
});

/* ============================================
   🌐 FALLBACK — Servir index.html para rutas no-API
============================================ */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

/* ============================================
   🚀 INICIAR SERVIDOR
============================================ */
app.listen(PORT, () => {
    console.log(`🚀 Servidor ElectroShop corriendo en http://localhost:${PORT}`);
    console.log(`📂 Archivos estáticos: ${__dirname}`);
});
