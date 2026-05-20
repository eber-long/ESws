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
    precio NUMERIC(10,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
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
    tipo VARCHAR(20) NOT NULL DEFAULT 'comun',
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
    total NUMERIC(12,2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    fecha DATE NOT NULL DEFAULT CURRENT_DATE
);


-- ============================================
-- 📦 DATOS DE EJEMPLO — PRODUCTOS (17)
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
('RYZEN 7 9800X3D',            'Procesadores',         12200.00,  8, 'imagen/RYZEN 7 9800X3D.png',                 'Procesador Gaming')
ON CONFLICT (nombre) DO NOTHING;


-- ============================================
-- 👥 DATOS DE EJEMPLO — USUARIOS (3)
-- ============================================
INSERT INTO usuarios (nombre, contrasena, tipo) VALUES
('admin', '1234', 'administrador'),
('juan',  'abcd', 'comun'),
('paco',  '1234', 'comun')
ON CONFLICT (nombre) DO NOTHING;


-- ============================================
-- 🧾 DATOS DE EJEMPLO — PEDIDOS (5)
-- ============================================
INSERT INTO pedidos (codigo, cliente, productos, total, estado, fecha) VALUES
('ES-001', 'juan', ARRAY['AMD Ryzen 7 5700X', 'Mouse Redragon M607'],             8598.27,  'completado', '2025-04-18'),
('ES-002', 'paco', ARRAY['HP Pavilion 15'],                                       17500.00, 'pendiente',  '2025-04-19'),
('ES-003', 'juan', ARRAY['Samsung Galaxy S25', 'Audífonos JBL 510BT'],            46250.00, 'completado', '2025-04-17'),
('ES-004', 'paco', ARRAY['G502 X PLUS'],                                           3000.00, 'cancelado',  '2025-04-16'),
('ES-005', 'juan', ARRAY['Lenovo LOQ Gen 9'],                                     20500.00, 'completado', '2025-04-15')
ON CONFLICT (codigo) DO NOTHING;


-- ============================================
-- ✅ VERIFICAR
-- ============================================
SELECT 'Productos: ' || COUNT(*) FROM productos;
SELECT 'Usuarios:  ' || COUNT(*) FROM usuarios;
SELECT 'Pedidos:   ' || COUNT(*) FROM pedidos;
