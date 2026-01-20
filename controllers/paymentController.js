const Booking = require('../models/Booking');

// @desc    Update payment status
// @route   PUT /api/payments/:bookingId
// @access  Private
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentStatus, paymentMethod, transactionId } = req.body;

    // Find booking
    const booking = await Booking.findOne({ bookingId });
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
      if (booking.status === 'pending') {
        booking.status = 'processing';
        booking.tracking.push({
          status: 'processing',
          message: 'Payment received, processing started',
          updatedBy: req.user.fullName || 'User'
        });
      }
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        status: booking.status,
        amount: booking.serviceFee
      }
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get payment details
// @route   GET /api/payments/:bookingId
// @access  Private
exports.getPaymentDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ bookingId })
      .select('bookingId serviceFee paymentStatus paymentMethod paymentDate transactionId status');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      success: true,
      payment: {
        bookingId: booking.bookingId,
        amount: booking.serviceFee,
        status: booking.paymentStatus,
        method: booking.paymentMethod,
        date: booking.paymentDate,
        transactionId: booking.transactionId,
        bookingStatus: booking.status
      }
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get payment methods
// @route   GET /api/payments/methods
// @access  Public
exports.getPaymentMethods = (req, res) => {
  res.json({
    success: true,
    methods: [
      { id: 'cash', name: 'Cash Payment', description: 'Pay in cash at our office' },
      { id: 'upi', name: 'UPI Payment', description: 'Pay via UPI (Google Pay, PhonePe, etc.)' },
      { id: 'bank_transfer', name: 'Bank Transfer', description: 'Direct bank transfer' },
      { id: 'online', name: 'Online Payment', description: 'Credit/Debit card payment' },
      { id: 'not_paid', name: 'Pay Later', description: 'Pay after service completion' }
    ]
  });
};

// @desc    Create dummy payment (for testing)
// @route   POST /api/payments/test/:bookingId
// @access  Private
exports.createTestPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // For testing, mark as paid with UPI
    booking.paymentStatus = 'paid';
    booking.paymentMethod = 'upi';
    booking.paymentDate = new Date();
    booking.transactionId = `TEST_${Date.now()}`;
    
    if (booking.status === 'pending') {
      booking.status = 'processing';
      booking.tracking.push({
        status: 'processing',
        message: 'Test payment received, processing started',
        updatedBy: 'System'
      });
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Test payment processed successfully',
      payment: {
        bookingId: booking.bookingId,
        amount: booking.serviceFee,
        status: booking.paymentStatus,
        method: booking.paymentMethod,
        transactionId: booking.transactionId,
        date: booking.paymentDate
      }
    });
  } catch (error) {
    console.error('Test payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};