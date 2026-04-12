/**
 * Admin Middleware
 * Verifies that the authenticated user has an 'admin' role.
 * Must be placed AFTER authMiddleware.
 */
const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admin rights required.' });
    }
};

module.exports = adminMiddleware;
