const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function initDb() {
    console.log('--- Đang bắt đầu khởi tạo Database ---');
    
    // We connect to 'postgres' database first because 'googledrivemini' might not exist
    const pool = new Pool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
        ssl: { rejectUnauthorized: false },
        database: 'postgres' 
    });

    try {
        const sqlPath = path.join(__dirname, '../models/init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Đang thực thi các lệnh SQL...');
        
        // Split SQL by semicolon and execute each command
        // Note: This is a simple splitter, be careful with semicolons inside strings
        const commands = sql.split(';').map(cmd => cmd.trim()).filter(cmd => cmd.length > 0);
        
        for (let command of commands) {
            await pool.query(command);
        }

        console.log('✅ Chúc mừng! Các bảng [users] và [files] đã được tạo thành công trên Azure PostgreSQL.');
        console.log('Bây giờ bạn có thể quay lại trình duyệt và Đăng ký tài khoản ngay!');

    } catch (err) {
        console.error('❌ Lỗi khởi tạo Database:', err.message);
        if (err.message.includes('database "googledrivemini" does not exist')) {
            console.log('Mẹo: Bạn hãy sửa DB_NAME trong .env thành "postgres" để chạy tạm thời nhé.');
        }
    } finally {
        await pool.end();
    }
}

initDb();
