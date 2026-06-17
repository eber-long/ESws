/* ============================================
   🔐 Script de Migración — Hashear contraseñas existentes
   Uso: node scripts/migrate-passwords.js
   
   Busca usuarios cuya contraseña NO esté hasheada
   (no empieza con $2b$) y la hashea con bcrypt.
============================================ */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5432,
});

async function migrate() {
    console.log('🔐 Iniciando migración de contraseñas...\n');

    try {
        const result = await pool.query('SELECT id, nombre, contrasena FROM usuarios');
        const usuarios = result.rows;
        let migrated = 0;
        let skipped = 0;

        for (const user of usuarios) {
            // Si ya está hasheada (bcrypt hashes empiezan con $2b$ o $2a$)
            if (user.contrasena.startsWith('$2b$') || user.contrasena.startsWith('$2a$')) {
                console.log(`  ⏭️  ${user.nombre} — ya tiene hash, omitido`);
                skipped++;
                continue;
            }

            const hash = await bcrypt.hash(user.contrasena, SALT_ROUNDS);
            await pool.query('UPDATE usuarios SET contrasena = $1 WHERE id = $2', [hash, user.id]);
            console.log(`  ✅ ${user.nombre} — contraseña hasheada`);
            migrated++;
        }

        console.log(`\n📊 Resultado: ${migrated} migradas, ${skipped} omitidas, ${usuarios.length} total`);
        console.log('🎉 Migración completada.\n');

    } catch (err) {
        console.error('❌ Error durante la migración:', err.message);
    } finally {
        await pool.end();
    }
}

migrate();
