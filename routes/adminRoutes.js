const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

// All routes require admin authentication
router.use(protect, admin);

// Dashboard stats
router.get('/stats', adminController.getAdminStats);

// Bookings management
router.get('/bookings', adminController.getAllBookings);
router.get('/bookings/recent', adminController.getRecentBookings); // ADD THIS
router.get('/bookings/:id', adminController.getBookingDetails);
router.put('/bookings/:id/status', adminController.updateBookingStatus);
router.put('/bookings/:id', adminController.updateBookingDetails); // ADD THIS
router.delete('/bookings/:id', adminController.deleteBooking);

// Users management
router.get('/users', adminController.getAllUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Analytics
router.get('/analytics/services', adminController.getServiceAnalytics);

module.exports = router;