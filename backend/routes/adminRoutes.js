const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Protect all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * Admin Management Routes
 * Domain: /api/admin
 */

router.get('/users', adminController.listAllUsers);
router.get('/files', adminController.listAllFiles);

module.exports = router;
