const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const { serviceId, userDetails, additionalInfo, paymentMethod } = req.body;
    const userId = req.user.id;

    console.log('📝 ====== CREATE BOOKING REQUEST ======');
    console.log('User ID:', userId);
    console.log('Service ID from request:', serviceId);
    console.log('Service ID type:', typeof serviceId);
    console.log('Service ID length:', serviceId?.length);
    console.log('Payment method:', paymentMethod);

    // Validate service ID format
    if (!serviceId || typeof serviceId !== 'string' || serviceId.length !== 24) {
      console.log('❌ Invalid service ID format');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid service ID format' 
      });
    }

    // Get service details
    console.log('🔍 Looking for service with ID:', serviceId);
    const service = await Service.findById(serviceId);
    
    if (!service) {
      console.log('❌ Service not found in database');
      return res.status(404).json({ 
        success: false,
        message: 'Service not found' 
      });
    }

    console.log('✅ Service found:', {
      id: service._id,
      name: service.name,
      category: service.category,
      fee: service.fee
    });

    if (!service.isActive) {
      return res.status(400).json({ 
        success: false,
        message: 'This service is currently unavailable' 
      });
    }

    // Get user - include fullName
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    console.log('✅ User found:', {
      email: user.email,
      fullName: user.fullName,
      phone: user.phone
    });

    // Determine payment status based on method
    let paymentStatus = 'pending';
    if (paymentMethod === 'cash') {
      paymentStatus = 'pending';
    } else if (paymentMethod === 'not_paid') {
      paymentStatus = 'pending';
    } else {
      paymentStatus = 'paid';
    }

    // Generate booking ID
    const generateBookingId = () => {
      const prefix = 'BK';
      const year = new Date().getFullYear().toString().slice(-2);
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const day = new Date().getDate().toString().padStart(2, '0');
      const random = Math.floor(100000 + Math.random() * 900000);
      return `${prefix}${year}${month}${day}${random}`;
    };

    // Create booking data - include fullName from user
    const bookingData = {
      user: userId,
      service: serviceId,
      category: service.category,
      serviceName: service.name,
      serviceFee: service.fee,
      userDetails: {
        fullName: user.fullName || '', // Use user.fullName, not userDetails.fullName
        email: userDetails.email || user.email,
        phone: userDetails.phone || user.phone,
        address: userDetails.address || user.address || {},
        aadhaarNumber: userDetails.aadhaarNumber || user.aadhaarNumber || '',
        panNumber: userDetails.panNumber || user.panNumber || ''
      },
      additionalInfo: additionalInfo || '',
      paymentMethod: paymentMethod || 'not_paid',
      paymentStatus: paymentStatus,
      paymentDate: paymentStatus === 'paid' ? new Date() : null,
      bookingId: generateBookingId(),
      tracking: [{
        status: 'pending',
        message: 'Booking created successfully',
        updatedBy: 'System',
        timestamp: new Date()
      }]
    };

    console.log('📝 Creating booking with data:', JSON.stringify(bookingData, null, 2));

    // Create booking
    const booking = await Booking.create(bookingData);
    
    // Add booking to user's bookings array WITHOUT triggering full validation
    // Method 1: Use findByIdAndUpdate (recommended)
    await User.findByIdAndUpdate(
      userId,
      { 
        $push: { bookings: booking._id },
        $set: { updatedAt: new Date() }
      }
    );

    console.log('✅ Booking created successfully:', booking.bookingId);
    console.log('📊 Booking details:', {
      id: booking._id,
      bookingId: booking.bookingId,
      service: booking.serviceName,
      amount: booking.serviceFee,
      status: booking.status
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        service: booking.serviceName,
        category: booking.category,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        amount: booking.serviceFee,
        createdAt: booking.createdAt
      }
    });
  } catch (error) {
    console.error('❌ CREATE BOOKING ERROR ======');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', Object.keys(error.errors));
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    console.error('❌ Create booking error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while creating booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const bookings = await Booking.find({ user: userId })
      .populate('service', 'name category fee processingTime')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('service', 'name description fee processingTime requirements documentsRequired')
      .populate('user', 'fullName email phone');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns the booking
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update booking payment status
// @route   PUT /api/bookings/:id/payment
// @access  Private
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentMethod, transactionId } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update payment' });
    }

    // Update payment details
    booking.paymentStatus = paymentStatus;
    if (paymentMethod) booking.paymentMethod = paymentMethod;
    if (transactionId) booking.transactionId = transactionId;
    
    if (paymentStatus === 'paid') {
      booking.paymentDate = new Date();
      booking.status = 'processing';
      booking.tracking.push({
        status: 'processing',
        message: 'Payment received, processing started',
        updatedBy: req.user.fullName || 'User'
      });
    }

    await booking.save();

    res.json({
      success: true,
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark payment as paid (for admin/cash payments)
// @route   PUT /api/bookings/:id/mark-paid
// @access  Private/Admin
exports.markAsPaid = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Update payment status
    booking.paymentStatus = 'paid';
    booking.paymentMethod = req.body.paymentMethod || 'cash';
    booking.paymentDate = new Date();
    booking.status = 'processing';
    booking.tracking.push({
      status: 'processing',
      message: 'Payment marked as received by admin',
      updatedBy: req.user.fullName || 'Admin'
    });

    await booking.save();

    res.json({
      success: true,
      message: 'Payment marked as paid successfully',
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        paymentStatus: booking.paymentStatus,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private/Admin
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, message } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Update status
    booking.status = status;
    
    // Add tracking entry
    booking.tracking.push({
      status,
      message: message || `Status updated to ${status}`,
      updatedBy: req.user.fullName || 'Admin'
    });

    await booking.save();

    res.json({
      success: true,
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
        tracking: booking.tracking
      }
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    // Check if booking can be cancelled
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ 
        message: `Booking cannot be cancelled as it is already ${booking.status}` 
      });
    }

    // Update status
    booking.status = 'cancelled';
    booking.paymentStatus = booking.paymentStatus === 'paid' ? 'refunded' : 'failed';
    booking.tracking.push({
      status: 'cancelled',
      message: 'Booking cancelled by user',
      updatedBy: req.user.fullName || 'User'
    });

    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
        paymentStatus: booking.paymentStatus
      }
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get booking statistics
// @route   GET /api/bookings/stats
// @access  Private
exports.getBookingStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // FIX: Use mongoose.Types.ObjectId
    const stats = await Booking.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$serviceFee' }
        }
      }
    ]);

    const totalBookings = await Booking.countDocuments({ user: userId });
    const pendingBookings = await Booking.countDocuments({ 
      user: userId, 
      status: { $in: ['pending', 'processing'] } 
    });
    const completedBookings = await Booking.countDocuments({ 
      user: userId, 
      status: 'completed' 
    });

    res.json({
      success: true,
      stats: {
        totalBookings,
        pendingBookings,
        completedBookings,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};