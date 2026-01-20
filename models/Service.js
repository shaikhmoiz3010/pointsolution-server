const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
      'driving-licence',
      'registration-certificate',
      'passport',
      'marriage-certificate',
      'legal-heir-certificate',
      'rti',
      'gst-registration',
      'vehicle-challan',
      'birth-certificate',
      'insurance',
      'visa'
    ]
  },
  serviceId: {
    type: String,
    required: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  detailedDescription: {
    type: String,
    default: ''
  },
  fee: {
    type: Number,
    required: true,
    min: 0
  },
  governmentFee: {
    type: Number,
    default: 0
  },
  serviceFee: {
    type: Number,
    default: 0
  },
  processingTime: {
    type: String,
    default: '7-10 working days'
  },
  requirements: [{
    type: String
  }],
  documentsRequired: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  steps: [{
    stepNumber: Number,
    title: String,
    description: String
  }],
  faqs: [{
    question: String,
    answer: String
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
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total fee
serviceSchema.virtual('totalFee').get(function() {
  return this.fee + this.governmentFee + this.serviceFee;
});

// Index for faster queries
serviceSchema.index({ category: 1, serviceId: 1 }, { unique: true });
serviceSchema.index({ isActive: 1 });

const Service = mongoose.model('Service', serviceSchema);
module.exports = Service;