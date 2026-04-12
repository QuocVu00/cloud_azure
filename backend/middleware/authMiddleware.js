const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Authentication Middleware
 * Confirms that a valid JWT token is present in the Authorization header.
 * Attaches the user payload (id, email) to the req.user object.
 */
const authMiddleware = (req, res, next) => {
    try {
        // Get token from header: "Authorization: Bearer <token>"
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token, authorization denied' });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user info to request
        req.user = decoded;
        
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error.message);
        res.status(401).json({ error: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
