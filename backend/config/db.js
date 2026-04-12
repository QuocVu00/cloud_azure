const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

/**
 * PostgreSQL Connection Pool
 * Using 'pg' for weight-efficiency and direct SQL control.
 * In a Senior role, we prioritize performance and transparency for this microservice.
 */
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
    console.log('Connected to Azure PostgreSQL successfully.');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
