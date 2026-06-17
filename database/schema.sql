-- ============================================
-- 🗄️ ElectroShop — Schema de Base de Datos
-- Base de datos: ElectroShopDB
-- ============================================

-- =====================
-- TABLA: productos
-- =====================
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) UNIQUE NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    precio NUMERIC(10,2) NOT NULL CHECK (precio > 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    imagen VARCHAR(300) DEFAULT 'imagen/ES.png',
    descripcion TEXT DEFAULT ''
);

-- =====================
-- TABLA: usuarios
-- =====================
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(200) NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'comun' CHECK (tipo IN ('administrador', 'vendedor', 'comun')),
    email VARCHAR(200),
    lista_deseos TEXT[] DEFAULT '{}'
);

-- =====================
-- TABLA: pedidos
-- =====================
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    cliente VARCHAR(100) NOT NULL,
    productos TEXT[] NOT NULL,
    total NUMERIC(12,2) NOT NULL CHECK (total > 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completado', 'cancelado')),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    historial_estados JSONB DEFAULT '[]',
    factura_numero VARCHAR(30),
    confirmado_por INTEGER REFERENCES usuarios(id),
    fecha_confirmacion TIMESTAMP
);

-- =====================
-- TABLA: pedido_productos (relación N:M)
-- =====================
CREATE TABLE IF NOT EXISTS pedido_productos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario > 0)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_pedido_productos_pedido ON pedido_productos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_productos_producto ON pedido_productos(producto_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);


-- ============================================
-- 📦 DATOS DE EJEMPLO — PRODUCTOS (40)
-- ============================================
INSERT INTO productos (nombre, categoria, precio, stock, imagen, descripcion) VALUES
('AMD Ryzen 7 5700X',          'Procesadores',          7708.27, 15, 'imagen/7.webp',                              '8 núcleos / 16 hilos'),
('Intel Core i7-12700K',       'Procesadores',          9850.00, 10, 'imagen/intelcorei7.jpg',                     '12 núcleos / 20 hilos'),
('Intel Core i5-12400F',       'Procesadores',          5950.00, 20, 'imagen/intelcorei5.jpg',                     '6 núcleos / 12 hilos'),
('HP Pavilion 15',             'Laptops',              17500.00,  8, 'imagen/HPpavilion.avif',                     '8 GB RAM / 512 GB SSD'),
('Dell Inspiron 14',           'Laptops',              22300.00,  5, 'imagen/Dellinspiron.webp',                   '16 GB RAM / 512 GB SSD'),
('Lenovo IdeaPad 3',           'Laptops',              15800.00, 12, 'imagen/ideaPad3.webp',                       '8 GB RAM / 256 GB SSD'),
('Samsung Galaxy S25',         'Dispositivos Móviles', 44500.00,  7, 'imagen/samsung-galaxy-s25-5g-256-gb-icyblue.jpg', '12 GB RAM / 512 GB'),
('Xiaomi 15 Pro',              'Dispositivos Móviles', 22900.00, 10, 'imagen/Xiaomi15Pro.webp',                    '12 GB RAM / 512 GB'),
('iPhone 16e',                 'Dispositivos Móviles', 29800.00,  6, 'imagen/Iphone16e.webp',                      '6 GB RAM / 256 GB'),
('Mouse Redragon M607',        'Accesorios',             890.00, 50, 'imagen/MouseRedragon.webp',                  'DPI: 7200 ajustable'),
('Audífonos JBL 510BT',        'Accesorios',            1750.00, 30, 'imagen/Audífonos JBL 510BT.jpeg',            'Bluetooth / 40h batería'),
('ASUS TUF VG249Q1A',          'Monitores',              890.00, 18, 'imagen/monitorasus.png',                     '24" IPS 165Hz'),
('Epson PowerLite X49',        'Proyectores',           9800.00,  4, 'imagen/Epson PowerLite X49.png',             'HDMI / VGA / USB'),
('Lenovo LOQ Gen 9',           'Laptops',              20500.00,  9, 'imagen/Lenovo LOQ Gen 9.png',                'Laptop Gaming'),
('G213 Prodigy',               'Accesorios',            5500.00, 25, 'imagen/G213 Prodigy.png',                    'Teclado Gaming RGB'),
('G502 X PLUS',                'Accesorios',            3000.00, 20, 'imagen/G502 X PLUS.png',                     'Mouse inalámbrico'),
('RYZEN 7 9800X3D',            'Procesadores',         12200.00,  8, 'imagen/RYZEN 7 9800X3D.png',                 'Procesador Gaming'),
('Intel Core i7-12700K Ultra', 'Procesadores',         10450.00, 10, 'imagen/IntelcoreI7ultra.avif',                 '12 núcleos / 20 hilos'),
('Acer Aspire 5',              'Laptops',              18900.00, 15, 'imagen/AcerAsoire5.png',                     '16 GB RAM / 512 GB SSD'),
('Google Pixel 9 Pro',         'Dispositivos Móviles', 24600.00,  8, 'imagen/google-pixel-9-pro_1024x.webp',         '12 GB RAM / 256 GB'),
('RedMagic Gaming Laptop 16 Pro', 'Laptops',           62000.00,  5, 'imagen/RedMagic-Gaming-Laptop-16-Pro.jpg',      'RTX 4070 / 32 GB RAM'),
('Audífonos Gamer Pro',        'Accesorios',            8500.00, 12, 'imagen/Audifonosgamer.png',                  '7.1 Surround / RGB'),
('Cargador Xiaomi 33W',        'Accesorios',             680.00, 40, 'imagen/cargadorxiaomi.webp',                  'USB-A + USB-C'),
('Estuche rígido disco',       'Accesorios',             270.00, 35, 'imagen/estuche.webp',                          'Estuche rígido disco'),
('LG Ultr27GN75aGear',         'Monitores',             6750.00, 14, 'imagen/Lgmonitor.jpg',                       'FreeSync / IPS / 1ms'),
('Dell P2422H Monitor',        'Monitores',             6100.00, 10, 'imagen/Dell led moniot.jpg',                  'Panel IPS / DisplayPort'),
('AOC Gamer 24G2E5',           'Monitores',             5200.00, 16, 'imagen/AOCMonitor.png',                      'Panel IPS / sin marco'),
('LBenQ TH575 Full HD',        'Proyectores',          11900.00,  6, 'imagen/LBenQ TH575 Full HD.png',                'Modo gaming / 16ms'),
('ViewSonic PA503S',           'Proyectores',           7950.00,  8, 'imagen/ViewSonic PA503S.webp',                  'HDMI / VGA / Audio'),
('LG CineBeam PF50KA',         'Proyectores',          10200.00,  5, 'imagen/LG CineBeam PF50KA.webp',                'Wi-Fi / USB-C / HDMI'),
('Lenovo LOQ 15IAX9I',         'Laptops',              44400.00,  6, 'imagen/Lenovo LOQ 15IAX9I Gaming Laptop.png',   'Laptop Gaming'),
('ASTRO A40 TR',               'Accesorios',            5000.00, 18, 'imagen/ASTRO A40 TR.png',                      'Audífonos'),
('Crucial Kit Pro DDR5 RAM de 32 GB', 'Accesorios',     5500.00, 22, 'imagen/Crucial Kit Pro DDR5 RAM de 32 GB.png', 'Memoria RAM'),
('Samsung Galaxy Z Flip7',     'Dispositivos Móviles', 40500.00,  7, 'imagen/Galaxy Z Flip7.png',                    'Smartphone'),
('Galaxy Watch 6 Classic',     'Accesorios',            8215.00, 11, 'imagen/watch6.jpeg',                           'Smartwatch'),
('Mouse Redragon Gaming',      'Accesorios',            1800.00, 25, 'imagen/MouseRedragon.webp',                  'Mouse Gaming'),
('AOC Monitor',                'Monitores',             9800.00,  9, 'imagen/AOCMonitor.png',                      'Monitor'),
('BenQ EX2510S MOBIUZ',        'Monitores',            13500.00, 10, 'imagen/BenQ EX2510S MOBIUZ.avif',              'Monitor Gaming'),
('Logitech MX Master 3S',      'Accesorios',            4800.00, 15, 'imagen/Mouse Logitech MX Master 3S.jpg',       'Mouse'),
('JBL PartyBox Encore Essential', 'Accesorios',        11200.00,  8, 'imagen/Bocina JBL PartyBox Encore Essential.jpg', 'Audio')
ON CONFLICT (nombre) DO NOTHING;


-- ============================================
-- 👥 DATOS DE EJEMPLO — USUARIOS (3)
-- ⚠️ NOTA: Las contraseñas aquí son texto plano.
-- Ejecutar `node scripts/migrate-passwords.js`
-- después de insertar para hashearlas con bcrypt.
-- ============================================
INSERT INTO usuarios (nombre, contrasena, tipo) VALUES
('admin', '1234', 'administrador'),
('juan',  'abcd', 'comun'),
('paco',  '1234', 'comun')
ON CONFLICT (nombre) DO NOTHING;


-- ============================================
-- 🧾 DATOS DE EJEMPLO — PEDIDOS (5)
-- ============================================
INSERT INTO pedidos (codigo, cliente, productos, total, estado, fecha, historial_estados) VALUES
('ES-001', 'juan', ARRAY['AMD Ryzen 7 5700X', 'Mouse Redragon M607'],             8598.27,  'completado', '2025-04-18', '[{"de":null,"a":"pendiente","fecha":"2025-04-18T10:00:00Z"},{"de":"pendiente","a":"completado","fecha":"2025-04-18T15:00:00Z"}]'),
('ES-002', 'paco', ARRAY['HP Pavilion 15'],                                       17500.00, 'pendiente',  '2025-04-19', '[{"de":null,"a":"pendiente","fecha":"2025-04-19T09:00:00Z"}]'),
('ES-003', 'juan', ARRAY['Samsung Galaxy S25', 'Audífonos JBL 510BT'],            46250.00, 'completado', '2025-04-17', '[{"de":null,"a":"pendiente","fecha":"2025-04-17T08:00:00Z"},{"de":"pendiente","a":"completado","fecha":"2025-04-17T16:00:00Z"}]'),
('ES-004', 'paco', ARRAY['G502 X PLUS'],                                           3000.00, 'cancelado',  '2025-04-16', '[{"de":null,"a":"pendiente","fecha":"2025-04-16T11:00:00Z"},{"de":"pendiente","a":"cancelado","fecha":"2025-04-16T14:00:00Z"}]'),
('ES-005', 'juan', ARRAY['Lenovo LOQ Gen 9'],                                     20500.00, 'completado', '2025-04-15', '[{"de":null,"a":"pendiente","fecha":"2025-04-15T10:00:00Z"},{"de":"pendiente","a":"completado","fecha":"2025-04-15T17:00:00Z"}]')
ON CONFLICT (codigo) DO NOTHING;


-- ============================================
-- Agregar columnas nuevas si no existen (migración)
-- ============================================
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS historial_estados JSONB DEFAULT '[]';

-- ============================================
-- ✅ VERIFICAR
-- ============================================
SELECT 'Productos: ' || COUNT(*) FROM productos;
SELECT 'Usuarios:  ' || COUNT(*) FROM usuarios;
SELECT 'Pedidos:   ' || COUNT(*) FROM pedidos;
