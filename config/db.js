const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    })
    : new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT) || 5432,
    });

const initialProducts = [
    { nombre: 'AMD Ryzen 7 5700X', categoria: 'Procesadores', precio: 7708.27, stock: 15, imagen: 'imagen/7.webp', descripcion: '8 núcleos / 16 hilos' },
    { nombre: 'Intel Core i7-12700K', categoria: 'Procesadores', precio: 9850.00, stock: 10, imagen: 'imagen/intelcorei7.jpg', descripcion: '12 núcleos / 20 hilos' },
    { nombre: 'Intel Core i5-12400F', categoria: 'Procesadores', precio: 5950.00, stock: 20, imagen: 'imagen/intelcorei5.jpg', descripcion: '6 núcleos / 12 hilos' },
    { nombre: 'HP Pavilion 15', categoria: 'Laptops', precio: 17500.00, stock: 8, imagen: 'imagen/HPpavilion.avif', descripcion: '8 GB RAM / 512 GB SSD' },
    { nombre: 'Dell Inspiron 14', categoria: 'Laptops', precio: 22300.00, stock: 5, imagen: 'imagen/Dellinspiron.webp', descripcion: '16 GB RAM / 512 GB SSD' },
    { nombre: 'Lenovo IdeaPad 3', categoria: 'Laptops', precio: 15800.00, stock: 12, imagen: 'imagen/ideaPad3.webp', descripcion: '8 GB RAM / 256 GB SSD' },
    { nombre: 'Samsung Galaxy S25', categoria: 'Dispositivos Móviles', precio: 44500.00, stock: 7, imagen: 'imagen/samsung-galaxy-s25-5g-256-gb-icyblue.jpg', descripcion: '12 GB RAM / 512 GB' },
    { nombre: 'Xiaomi 15 Pro', categoria: 'Dispositivos Móviles', precio: 22900.00, stock: 10, imagen: 'imagen/Xiaomi15Pro.webp', descripcion: '12 GB RAM / 512 GB' },
    { nombre: 'iPhone 16e', categoria: 'Dispositivos Móviles', precio: 29800.00, stock: 6, imagen: 'imagen/Iphone16e.webp', descripcion: '6 GB RAM / 256 GB' },
    { nombre: 'Mouse Redragon M607', categoria: 'Accesorios', precio: 890.00, stock: 50, imagen: 'imagen/MouseRedragon.webp', descripcion: 'DPI: 7200 ajustable' },
    { nombre: 'Audífonos JBL 510BT', categoria: 'Accesorios', precio: 1750.00, stock: 30, imagen: 'imagen/Audífonos JBL 510BT.jpeg', descripcion: 'Bluetooth / 40h batería' },
    { nombre: 'ASUS TUF VG249Q1A', categoria: 'Monitores', precio: 890.00, stock: 18, imagen: 'imagen/monitorasus.png', descripcion: '24" IPS 165Hz' },
    { nombre: 'Epson PowerLite X49', categoria: 'Proyectores', precio: 9800.00, stock: 4, imagen: 'imagen/Epson PowerLite X49.png', descripcion: 'HDMI / VGA / USB' },
    { nombre: 'Lenovo LOQ Gen 9', categoria: 'Laptops', precio: 20500.00, stock: 9, imagen: 'imagen/Lenovo LOQ Gen 9.png', descripcion: 'Laptop Gaming' },
    { nombre: 'G213 Prodigy', categoria: 'Accesorios', precio: 5500.00, stock: 25, imagen: 'imagen/G213 Prodigy.png', descripcion: 'Teclado Gaming RGB' },
    { nombre: 'G502 X PLUS', categoria: 'Accesorios', precio: 3000.00, stock: 20, imagen: 'imagen/G502 X PLUS.png', descripcion: 'Mouse inalámbrico' },
    { nombre: 'RYZEN 7 9800X3D', categoria: 'Procesadores', precio: 12200.00, stock: 8, imagen: 'imagen/RYZEN 7 9800X3D.png', descripcion: 'Procesador Gaming' },
    { nombre: 'Intel Core i7-12700K Ultra', categoria: 'Procesadores', precio: 10450.00, stock: 10, imagen: 'imagen/IntelcoreI7ultra.avif', descripcion: '12 núcleos / 20 hilos' },
    { nombre: 'Acer Aspire 5', categoria: 'Laptops', precio: 18900.00, stock: 15, imagen: 'imagen/AcerAsoire5.png', descripcion: '16 GB RAM / 512 GB SSD' },
    { nombre: 'Google Pixel 9 Pro', categoria: 'Dispositivos Móviles', precio: 24600.00, stock: 8, imagen: 'imagen/google-pixel-9-pro_1024x.webp', descripcion: '12 GB RAM / 256 GB' },
    { nombre: 'RedMagic Gaming Laptop 16 Pro', categoria: 'Laptops', precio: 62000.00, stock: 5, imagen: 'imagen/RedMagic-Gaming-Laptop-16-Pro.jpg', descripcion: 'RTX 4070 / 32 GB RAM' },
    { nombre: 'Audífonos Gamer Pro', categoria: 'Accesorios', precio: 8500.00, stock: 12, imagen: 'imagen/Audifonosgamer.png', descripcion: '7.1 Surround / RGB' },
    { nombre: 'Cargador Xiaomi 33W', categoria: 'Accesorios', precio: 680.00, stock: 40, imagen: 'imagen/cargadorxiaomi.webp', descripcion: 'USB-A + USB-C' },
    { nombre: 'Estuche rígido disco', categoria: 'Accesorios', precio: 270.00, stock: 35, imagen: 'imagen/estuche.webp', descripcion: 'Estuche rígido disco' },
    { nombre: 'LG Ultr27GN75aGear', categoria: 'Monitores', precio: 6750.00, stock: 14, imagen: 'imagen/Lgmonitor.jpg', descripcion: 'FreeSync / IPS / 1ms' },
    { nombre: 'Dell P2422H Monitor', categoria: 'Monitores', precio: 6100.00, stock: 10, imagen: 'imagen/Dell led moniot.jpg', descripcion: 'Panel IPS / DisplayPort' },
    { nombre: 'AOC Gamer 24G2E5', categoria: 'Monitores', precio: 5200.00, stock: 16, imagen: 'imagen/AOCMonitor.png', descripcion: 'Panel IPS / sin marco' },
    { nombre: 'LBenQ TH575 Full HD', categoria: 'Proyectores', precio: 11900.00, stock: 6, imagen: 'imagen/LBenQ TH575 Full HD.png', descripcion: 'Modo gaming / 16ms' },
    { nombre: 'ViewSonic PA503S', categoria: 'Proyectores', precio: 7950.00, stock: 8, imagen: 'imagen/ViewSonic PA503S.webp', descripcion: 'HDMI / VGA / Audio' },
    { nombre: 'LG CineBeam PF50KA', categoria: 'Proyectores', precio: 10200.00, stock: 5, imagen: 'imagen/LG CineBeam PF50KA.webp', descripcion: 'Wi-Fi / USB-C / HDMI' },
    { nombre: 'Lenovo LOQ 15IAX9I', categoria: 'Laptops', precio: 44400.00, stock: 6, imagen: 'imagen/Lenovo LOQ 15IAX9I Gaming Laptop.png', descripcion: 'Laptop Gaming' },
    { nombre: 'ASTRO A40 TR', categoria: 'Accesorios', precio: 5000.00, stock: 18, imagen: 'imagen/ASTRO A40 TR.png', descripcion: 'Audífonos' },
    { nombre: 'Crucial Kit Pro DDR5 RAM de 32 GB', categoria: 'Accesorios', precio: 5500.00, stock: 22, imagen: 'imagen/Crucial Kit Pro DDR5 RAM de 32 GB.png', descripcion: 'Memoria RAM' },
    { nombre: 'Samsung Galaxy Z Flip7', categoria: 'Dispositivos Móviles', precio: 40500.00, stock: 7, imagen: 'imagen/Galaxy Z Flip7.png', descripcion: 'Smartphone' },
    { nombre: 'Galaxy Watch 6 Classic', categoria: 'Accesorios', precio: 8215.00, stock: 11, imagen: 'imagen/watch6.jpeg', descripcion: 'Smartwatch' },
    { nombre: 'Mouse Redragon Gaming', categoria: 'Accesorios', precio: 1800.00, stock: 25, imagen: 'imagen/MouseRedragon.webp', descripcion: 'Mouse Gaming' },
    { nombre: 'AOC Monitor', categoria: 'Monitores', precio: 9800.00, stock: 9, imagen: 'imagen/AOCMonitor.png', descripcion: 'Monitor' },
    { nombre: 'BenQ EX2510S MOBIUZ', categoria: 'Monitores', precio: 13500.00, stock: 10, imagen: 'imagen/BenQ EX2510S MOBIUZ.avif', descripcion: 'Monitor Gaming' },
    { nombre: 'Logitech MX Master 3S', categoria: 'Accesorios', precio: 4800.00, stock: 15, imagen: 'imagen/Mouse Logitech MX Master 3S.jpg', descripcion: 'Mouse' },
    { nombre: 'JBL PartyBox Encore Essential', categoria: 'Accesorios', precio: 11200.00, stock: 8, imagen: 'imagen/Bocina JBL PartyBox Encore Essential.jpg', descripcion: 'Audio' }
];

async function seedProducts(poolInstance) {
    try {
        // Verificar si la tabla de productos existe
        const tableCheck = await poolInstance.query(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'productos')"
        );
        if (!tableCheck.rows[0].exists) {
            console.log('⚠️ Tabla "productos" no existe aún. Saltando semillero.');
            return;
        }

        console.log('🌱 Ejecutando semillero automático de productos...');
        for (const prod of initialProducts) {
            await poolInstance.query(
                `INSERT INTO productos (nombre, categoria, precio, stock, imagen, descripcion)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (nombre) DO NOTHING`,
                [prod.nombre, prod.categoria, prod.precio, prod.stock, prod.imagen, prod.descripcion]
            );
        }
        console.log('🌱 Semillero de productos completado con éxito.');
    } catch (err) {
        console.error('❌ Error ejecutando semillero de productos:', err.message);
    }
}

pool.query('SELECT NOW()')
    .then(async () => {
        const dbName = process.env.DATABASE_URL ? 'Supabase (remoto)' : process.env.DB_NAME;
        console.log(`✅ Conectado a PostgreSQL (${dbName})`);
        await seedProducts(pool);
    })
    .catch(err => console.error('❌ Error de conexión a PostgreSQL:', err.message));

module.exports = pool;