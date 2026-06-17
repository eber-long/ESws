require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function runMigration() {
    try {
        console.log('🔄 Iniciando migración de base de datos...');
        const migrationPath = path.join(__dirname, '..', 'database', 'migration-v3.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        // Ejecutar la migración
        await pool.query(sql);
        console.log('✅ Migración v3 ejecutada con éxito.');
    } catch (err) {
        console.error('❌ Error ejecutando migración:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
