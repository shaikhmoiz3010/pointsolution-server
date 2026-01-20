// server/controllers/adminController.js
const Booking = require('../models/Booking');
const User = require('../models/User');
const Service = require('../models/Service');
const mongoose = require('mongoose');

// In your server admin controller, add these functions:
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    
    let query = {};
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query)
    ]);
    
    // Get booking counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const bookingStats = await Booking.aggregate([
          { $match: { user: user._id } },
          { $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalSpent: { $sum: '$serviceFee' }
            }
          }
        ]);
        
        const totalBookings = bookingStats.reduce((sum, stat) => sum + stat.count, 0);
        const totalSpent = bookingStats.reduce((sum, stat) => sum + stat.totalSpent, 0);
        
        return {
          ...user,
          stats: {
            totalBookings,
            totalSpent,
            statusBreakdown: bookingStats
          }
        };
      })
    );
    
    res.json({
      success: true,
      users: usersWithStats,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, address, role, isActive } = req.body;
    
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if user has bookings
    const bookingCount = await Booking.countDocuments({ user: id });
    if (bookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user with ${bookingCount} active bookings`
      });
    }
    
    await User.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// server/controllers/adminController.js - Add this function
exports.getRecentBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'fullName email')
      .populate('service', 'name')
      .lean();
    
    res.json({
      success: true,
      bookings: bookings.map(b => ({
        _id: b._id,
        bookingId: b.bookingId,
        serviceName: b.serviceName,
        category: b.category,
        serviceFee: b.serviceFee,
        status: b.status,
        paymentStatus: b.paymentStatus,
        createdAt: b.createdAt,
        userDetails: b.userDetails
      }))
    });
  } catch (error) {
    console.error('Get recent bookings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getAdminStats = async (req, res) => {
  try {
    // Get counts
    const [totalBookings, totalUsers, pendingBookings, completedBookings] = await Promise.all([
      Booking.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'completed' })
    ]);

    // Get revenue (only from paid bookings)
    const revenueResult = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$serviceFee' } } }
    ]);

    // Get status breakdown
    const statusBreakdown = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent bookings (10)
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'fullName email')
      .populate('service', 'name');

    res.json({
      success: true,
      stats: {
        totalBookings,
        totalUsers,
        pendingBookings,
        completedBookings,
        totalRevenue: revenueResult[0]?.total || 0,
        statusBreakdown,
        recentBookings: recentBookings.map(b => ({
          _id: b._id,
          bookingId: b.bookingId,
          serviceName: b.serviceName,
          category: b.category,
          serviceFee: b.serviceFee,
          status: b.status,
          paymentStatus: b.paymentStatus,
          createdAt: b.createdAt,
          userDetails: b.userDetails
        }))
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// @desc    Get all bookings for admin (with better error handling)
// @route   GET /api/admin/bookings
// @access  Private/Admin
exports.getAllBookings = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    let query = {};
    
    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: 'i' } },
        { serviceName: { $regex: search, $options: 'i' } },
        { 'userDetails.fullName': { $regex: search, $options: 'i' } },
        { 'userDetails.email': { $regex: search, $options: 'i' } },
        { 'userDetails.phone': { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Booking.countDocuments(query)
    ]);
    
    // Enrich bookings with user info if available
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        try {
          // Try to get user details if not already populated
          if (booking.user && typeof booking.user === 'string') {
            const user = await User.findById(booking.user).select('fullName email phone').lean();
            if (user) {
              booking.userDetails = {
                fullName: user.fullName,
                email: user.email,
                phone: user.phone
              };
            }
          }
          
          return booking;
        } catch (error) {
          console.error('Error enriching booking:', error);
          return booking;
        }
      })
    );
    
    res.json({
      success: true,
      bookings: enrichedBookings,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// @desc    Get booking details (admin)
// @route   GET /api/admin/bookings/:id
// @access  Private/Admin
exports.getBookingDetails = async (req, res) => {
  try {
    console.log('🔍 Admin fetching booking with ID:', req.params.id);
    
    let booking;
    
    // Try to find by MongoDB ID first
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      booking = await Booking.findById(req.params.id)
        .populate('user', 'fullName email phone createdAt')
        .populate('service', 'name description requirements processingTime fee')
        .lean();
    }
    
    // If not found by ID, try to find by bookingId
    if (!booking) {
      booking = await Booking.findOne({ bookingId: req.params.id })
        .populate('user', 'fullName email phone createdAt')
        .populate('service', 'name description requirements processingTime fee')
        .lean();
    }

    if (!booking) {
      console.log('❌ Booking not found for ID:', req.params.id);
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    console.log('✅ Admin found booking:', booking.bookingId);
    
    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('❌ Get booking details error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update booking status (admin)
// @route   PUT /api/admin/bookings/:id/status
// @access  Private/Admin
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, message } = req.body;
    const { id } = req.params;
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be: pending, processing, completed, or cancelled' 
      });
    }
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    // Update status
    booking.status = status;
    
    // Add tracking entry
    booking.tracking.push({
      status: status,
      message: message || `Status updated to ${status} by admin`,
      updatedBy: req.user.fullName || 'Admin',
      timestamp: new Date()
    });
    
    // If status is cancelled, update payment status
    if (status === 'cancelled') {
      booking.paymentStatus = booking.paymentStatus === 'paid' ? 'refunded' : 'failed';
    }
    
    // If status is completed and payment is pending, mark as paid
    if (status === 'completed' && booking.paymentStatus === 'pending') {
      booking.paymentStatus = 'paid';
      booking.paymentDate = new Date();
    }
    
    await booking.save();
    
    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        tracking: booking.tracking
      }
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete booking (admin)
// @route   DELETE /api/admin/bookings/:id
// @access  Private/Admin
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    // Check if booking can be deleted (only pending or cancelled)
    if (booking.status === 'processing' || booking.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete booking with status: ${booking.status}. Only pending or cancelled bookings can be deleted.` 
      });
    }
    
    // Remove from user's bookings array
    await User.findByIdAndUpdate(booking.user, {
      $pull: { bookings: booking._id }
    });
    
    // Delete booking
    await Booking.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Send notification to user
// @route   POST /api/admin/bookings/:id/notify
// @access  Private/Admin
exports.sendNotification = async (req, res) => {
  try {
    const { message } = req.body;
    const { id } = req.params;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    // Add notification to tracking
    booking.tracking.push({
      status: booking.status,
      message: `Notification: ${message}`,
      updatedBy: req.user.fullName || 'Admin',
      timestamp: new Date(),
      type: 'notification'
    });
    
    await booking.save();
    
    // Log notification (in production, you'd send email/SMS here)
    console.log(`Admin notification sent for booking ${booking.bookingId}: ${message}`);
    
    res.json({
      success: true,
      message: 'Notification sent successfully',
      notification: {
        message,
        timestamp: new Date(),
        bookingId: booking.bookingId
      }
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Add update booking details endpoint
exports.updateBookingDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Fields that can be updated
    const allowedUpdates = ['serviceFee', 'additionalInfo', 'userDetails', 'paymentMethod'];
    const updateData = {};
    
    // Filter only allowed fields
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = updates[key];
      }
    });
    
    // If userDetails is being updated, merge with existing
    if (updates.userDetails) {
      const booking = await Booking.findById(id);
      if (booking) {
        updateData.userDetails = {
          ...booking.userDetails,
          ...updates.userDetails
        };
      }
    }
    
    const booking = await Booking.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    // Add tracking entry for update
    if (Object.keys(updateData).length > 0) {
      booking.tracking.push({
        status: booking.status,
        message: 'Booking details updated by admin',
        updatedBy: req.user.fullName || 'Admin',
        timestamp: new Date(),
        type: 'update'
      });
      await booking.save();
    }
    
    res.json({
      success: true,
      message: 'Booking updated successfully',
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        serviceFee: booking.serviceFee,
        additionalInfo: booking.additionalInfo,
        userDetails: booking.userDetails,
        paymentMethod: booking.paymentMethod
      }
    });
  } catch (error) {
    console.error('Update booking details error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all users (admin)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    
    let query = {};
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query)
    ]);
    
    // Get booking counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const bookingStats = await Booking.aggregate([
          { $match: { user: user._id } },
          { $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalSpent: { $sum: '$serviceFee' }
            }
          }
        ]);
        
        const totalBookings = bookingStats.reduce((sum, stat) => sum + stat.count, 0);
        const totalSpent = bookingStats.reduce((sum, stat) => sum + stat.totalSpent, 0);
        
        return {
          ...user,
          stats: {
            totalBookings,
            totalSpent,
            statusBreakdown: bookingStats
          }
        };
      })
    );
    
    res.json({
      success: true,
      users: usersWithStats,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update user (admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, address, role, isActive } = req.body;
    
    // Only allow certain fields to be updated
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete user (admin)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if user has bookings
    const bookingCount = await Booking.countDocuments({ user: id });
    if (bookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user with ${bookingCount} active bookings. Delete bookings first or deactivate the user.`
      });
    }
    
    // Delete user
    await User.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get service analytics
// @route   GET /api/admin/analytics/services
// @access  Private/Admin
exports.getServiceAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Popular services in last 30 days
    const popularServices = await Booking.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
          _id: '$serviceName',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$serviceFee' },
          category: { $first: '$category' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Revenue by day for last 30 days
    const revenueByDay = await Booking.aggregate([
      { $match: { 
          paymentStatus: 'paid',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$serviceFee' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    // Status distribution
    const statusDistribution = await Booking.aggregate([
      { $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Payment method distribution
    const paymentMethodDistribution = await Booking.aggregate([
      { $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      analytics: {
        popularServices,
        revenueByDay,
        statusDistribution,
        paymentMethodDistribution,
        timeframe: 'Last 30 days'
      }
    });
  } catch (error) {
    console.error('Get service analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};