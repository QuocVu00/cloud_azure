const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Authentication Controller
 * Handles user registration and secure login using JWT.
 */
class AuthController {
    /**
     * POST /api/auth/register
     * Register a new user with hashed password.
     */
    async register(req, res) {
        try {
            const { email, password, fullName } = req.body;

            // 1. Basic validation
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            // 2. Check if user already exists
            const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            if (userCheck.rows.length > 0) {
                return res.status(400).json({ error: 'User already exists with this email' });
            }

            // 3. Hash the password securely
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // 4. Save to PostgreSQL
            const query = `
                INSERT INTO users (email, password, full_name, role, created_at, plan, storage_quota)
                VALUES ($1, $2, $3, 'user', NOW(), 'free', 5368709120)
                RETURNING id, email, full_name, role, plan, storage_quota;
            `;
            const result = await db.query(query, [email, hashedPassword, fullName]);

            res.status(201).json({
                message: 'User registered successfully',
                user: result.rows[0]
            });
        } catch (error) {
            console.error('Registration Error:', error);
            res.status(500).json({ error: 'Internal server error during registration' });
        }
    }

    /**
     * POST /api/auth/login
     * Authenticate user and return JWT token.
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            // 1. Find user in Database
            const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            const user = result.rows[0];

            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // 2. Compare hashed password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // 3. Generate JWT Token
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'fallback_secret_key',
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            // 4. Return user info and token
            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                    plan: user.plan || 'free',
                    storageQuota: user.storage_quota || 5368709120
                }
            });
        } catch (error) {
            console.error('Login Error:', error);
            res.status(500).json({ error: 'Internal server error during login' });
        }
    }
}

module.exports = new AuthController();
