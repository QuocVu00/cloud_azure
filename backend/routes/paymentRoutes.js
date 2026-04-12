const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create-url', authMiddleware, paymentController.createPaymentUrl);
router.get('/vnpay-return', paymentController.vnpayReturn); // VNPay will redirect to this, or frontend will call this to verify

module.exports = router;
