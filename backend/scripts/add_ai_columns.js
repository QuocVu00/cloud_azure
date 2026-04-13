const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function addAiColumns() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 5432,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('--- Đang cập nhật Database (Thêm cột AI) ---');
        
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS ai_usage_count INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS ai_last_reset TIMESTAMP DEFAULT NOW();
        `);

        console.log('✅ Cập nhật thành công! Đã thêm cột ai_usage_count và ai_last_reset.');

    } catch (err) {
        console.error('❌ Lỗi cập nhật Database:', err.message);
    } finally {
        await pool.end();
    }
}

addAiColumns();
