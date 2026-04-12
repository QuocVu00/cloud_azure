const bcrypt = require('bcryptjs');
const db = require('../config/db');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function seedAdmin() {
    try {
        const email = 'admin1@gmail.com';
        const password = 'admin1';
        const fullName = 'System Admin';
        const role = 'admin';

        console.log(`Checking for admin user: ${email}...`);

        // Check if user exists
        const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (userCheck.rows.length > 0) {
            console.log('Admin user already exists. Updating role to admin...');
            await db.query('UPDATE users SET role = $1 WHERE email = $2', [role, email]);
            console.log('Admin role updated.');
            process.exit(0);
        }

        console.log('Creating new admin user...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const query = `
            INSERT INTO users (email, password, full_name, role, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING id, email;
        `;
        const result = await db.query(query, [email, hashedPassword, fullName, role]);

        console.log(`Admin user created successfully with ID: ${result.rows[0].id}`);
        process.exit(0);
    } catch (error) {
        console.error('Seeding Error:', error);
        process.exit(1);
    }
}

seedAdmin();
