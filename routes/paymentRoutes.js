const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/methods', paymentController.getPaymentMethods);

// Protected routes
router.use(protect);

router.get('/:bookingId', paymentController.getPaymentDetails);
router.put('/:bookingId', paymentController.updatePaymentStatus);

// Test route (development only)
if (process.env.NODE_ENV === 'development') {
  router.post('/test/:bookingId', paymentController.createTestPayment);
}

module.exports = router;