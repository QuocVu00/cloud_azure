const db = require('../config/db');

/**
 * Admin Controller
 * Provides system-wide data access for admins.
 */
class AdminController {
    /**
     * GET /api/admin/users
     * Lists all users in the system.
     */
    async listAllUsers(req, res) {
        try {
            const query = `
                SELECT id, email, full_name, role, plan, storage_quota, created_at 
                FROM users 
                ORDER BY created_at DESC;
            `;
            const result = await db.query(query);
            res.json({ users: result.rows });
        } catch (error) {
            console.error('Admin listAllUsers Error:', error);
            res.status(500).json({ error: 'Failed to retrieve all users' });
        }
    }

    /**
     * GET /api/admin/files
     * Lists all files in the system with uploader info.
     */
    async listAllFiles(req, res) {
        try {
            const query = `
                SELECT f.id, f.file_name, f.file_size, f.file_type, f.created_at, u.email as owner_email, u.full_name as owner_name
                FROM files f
                JOIN users u ON f.user_id = u.id
                ORDER BY f.created_at DESC;
            `;
            const result = await db.query(query);
            res.json({ files: result.rows });
        } catch (error) {
            console.error('Admin listAllFiles Error:', error);
            res.status(500).json({ error: 'Failed to retrieve all files' });
        }
    }
}

module.exports = new AdminController();
