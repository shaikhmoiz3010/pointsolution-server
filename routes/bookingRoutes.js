const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// User routes
router.post('/', bookingController.createBooking);
router.get('/my-bookings', bookingController.getUserBookings);
router.get('/stats', bookingController.getBookingStats);
router.get('/:id', bookingController.getBooking);
router.put('/:id/payment', bookingController.updatePaymentStatus);
router.put('/:id/cancel', bookingController.cancelBooking);

// Admin routes
router.put('/:id/status', admin, bookingController.updateBookingStatus);
router.put('/:id/mark-paid', admin, bookingController.markAsPaid);

module.exports = router;