const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    default: function() {
      const prefix = 'BK';
      const year = new Date().getFullYear().toString().slice(-2);
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const day = new Date().getDate().toString().padStart(2, '0');
      const random = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
      return `${prefix}${year}${month}${day}${random}`;
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  category: {
    type: String,
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  serviceFee: {
    type: Number,
    required: true
  },
  userDetails: {
    fullName: String,
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String
    },
    aadhaarNumber: String,
    panNumber: String,
    dateOfBirth: Date,
    fatherName: String
  },
  additionalInfo: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'bank_transfer', 'upi', 'not_paid'],
    default: 'not_paid'
  },
  paymentDate: {
    type: Date
  },
  transactionId: {
    type: String
  },
  tracking: [{
    status: String,
    message: String,
    updatedBy: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // This automatically adds createdAt and updatedAt
});

// Remove the pre-save hook since we're using default function
// bookingSchema.pre('save', async function(next) { ... });

// Indexes for better performance
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ user: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;