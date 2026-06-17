/* ============================================
   🚀 ElectroShop — Servidor Express + PostgreSQL
   + Socket.IO para tiempo real
   ============================================ */

// Cargar variables de entorno ANTES que todo
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');


// 🛡️ Importar middlewares
const logger = require('./middlewares/logger.middleware');
const manejadorDeErrores = require('./middlewares/error.middleware');

// 📂 Importar rutas
const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const descuentosRoutes = require('./routes/descuentos.routes');
const cuponesRoutes = require('./routes/cupones.routes');
const facturasRoutes = require('./routes/facturas.routes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.SERVER_PORT || 3000;

/* ============================================
   🔌 SOCKET.IO — Tiempo Real
============================================ */
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Compartir io con las rutas via app.set
app.set('io', io);

io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`🔌 Cliente desconectado: ${socket.id}`);
    });
});

/* ============================================
   ⚙️ MIDDLEWARE GLOBALES
============================================ */
app.use(helmet({ contentSecurityPolicy: false })); // Headers de seguridad HTTP
app.use(compression());                            // Gzip para respuestas
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));    // Soporte para formularios
app.use(logger);

// Servir archivos estáticos con cache de 1 día (HTML, CSS, JS, imágenes)
app.use(express.static(path.join(__dirname), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    etag: true
}));

// Servir archivos subidos con cache
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
    etag: true
}));

/* ============================================
   📡 RUTAS DE LA API
============================================ */
app.use('/api', authRoutes);           // Login, Registro
app.use('/api/productos', productosRoutes); // CRUD Productos + Upload
app.use('/api/usuarios', usuariosRoutes);   // CRUD Usuarios + Deseos
app.use('/api/pedidos', pedidosRoutes);      // CRUD Pedidos
app.use('/api/descuentos', descuentosRoutes); // CRUD Descuentos
app.use('/api/cupones', cuponesRoutes);         // Cupones de descuento
app.use('/api/facturas', facturasRoutes);       // Facturas (Descargar y Enviar)

/* ============================================
   🌐 FALLBACK — Servir index.html
============================================ */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

/* ============================================
   🚨 MANEJADOR GLOBAL DE ERRORES
   Debe ir AL FINAL, después de todas las rutas.
============================================ */
app.use(manejadorDeErrores);

/* ============================================
   🚀 INICIAR SERVIDOR (HTTP + Socket.IO)
============================================ */
server.listen(PORT, () => {
    console.log(`🚀 Servidor ElectroShop corriendo en http://localhost:${PORT}`);
    console.log(`🔌 Socket.IO activo para tiempo real`);
    console.log(`📂 Archivos estáticos: ${__dirname}`);
});

