const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * AI Routes
 * All routes are protected and requires user authentication.
 */

// POST /api/ai/chat - Chat with Gemini
router.post('/chat', authMiddleware, (req, res) => aiController.chat(req, res));

// GET /api/ai/usage - Get current usage and limits
router.get('/usage', authMiddleware, (req, res) => aiController.getUsage(req, res));

module.exports = router;
