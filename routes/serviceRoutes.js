const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { protect, admin } = require('../middleware/auth');

// Public routes
router.get('/', serviceController.getAllServices);
router.get('/categories', serviceController.getCategories);
router.get('/category/:category', serviceController.getServicesByCategory);
router.get('/id/:id', serviceController.getServiceById); // Add this route
router.get('/:category/:serviceId', serviceController.getService); // Keep for compatibility

// Admin routes
router.post('/seed', protect, admin, serviceController.seedServices);

module.exports = router; 