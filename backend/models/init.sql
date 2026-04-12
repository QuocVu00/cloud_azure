-- SQL Scrip for Google Drive Mini Initialize
-- Database: Azure PostgreSQL

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Files Table
CREATE TABLE IF NOT EXISTS files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,          -- File size in bytes
    blob_url TEXT NOT NULL,             -- Azure Blob Storage URL
    file_type VARCHAR(100),             -- MIME type (optional but useful)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 3. Create sample user (Hashed password for 'password123' using bcrypt usually)
-- Note: In a real app, this is handled via authController.js
-- INSERT INTO users (email, password, full_name) VALUES ('demo@example.com', 'hashed_pass', 'Demo User');
