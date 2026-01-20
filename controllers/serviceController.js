const Service = require('../models/Service');


// @desc    Get service by ID
// @route   GET /api/services/id/:id
// @access  Public
exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Looking for service by ID:', id);
    
    let service;
    
    // First try: Find by MongoDB ID
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      service = await Service.findById(id);
    }
    
    // Second try: Find by serviceId (fallback)
    if (!service) {
      service = await Service.findOne({ 
        serviceId: id.toUpperCase(),
        isActive: true 
      });
    }

    if (!service) {
      console.log('❌ Service not found');
      return res.status(404).json({ 
        success: false,
        message: 'Service not found' 
      });
    }

    console.log('✅ Found service:', service.name);
    
    res.json({
      success: true,
      service
    });
  } catch (error) {
    console.error('❌ Get service by ID error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all services
// @route   GET /api/services
// @access  Public
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true })
      .sort({ category: 1, serviceId: 1 });
    
    // Group by category
    const groupedServices = services.reduce((acc, service) => {
      const category = service.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(service);
      return acc;
    }, {});

    res.json({
      success: true,
      count: services.length,
      services: groupedServices
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get services by category
// @route   GET /api/services/category/:category
// @access  Public
exports.getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const services = await Service.find({ 
      category,
      isActive: true 
    }).sort({ serviceId: 1 });

    if (services.length === 0) {
      return res.status(404).json({ 
        message: 'No services found for this category' 
      });
    }

    res.json({
      success: true,
      count: services.length,
      services
    });
  } catch (error) {
    console.error('Get services by category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single service
// @route   GET /api/services/:category/:serviceId
// @access  Public
exports.getService = async (req, res) => {
  try {
    let { category, serviceId } = req.params;
    
    // Decode URL-encoded category
    category = decodeURIComponent(category);
    
    console.log('🔍 Looking for service:', { category, serviceId });
    
    let service;
    
    // If serviceId looks like a MongoDB ID (24 hex characters), find by ID
    if (serviceId && serviceId.match(/^[0-9a-fA-F]{24}$/)) {
      service = await Service.findById(serviceId);
    } 
    // Otherwise, find by category and service letter
    else if (category && serviceId) {
      service = await Service.findOne({
        category: category.toLowerCase(),
        serviceId: serviceId.toUpperCase(),
        isActive: true
      });
    }

    if (!service) {
      console.log('❌ Service not found');
      return res.status(404).json({ 
        success: false,
        message: 'Service not found' 
      });
    }

    console.log('✅ Found service:', service.name);
    
    res.json({
      success: true,
      service
    });
  } catch (error) {
    console.error('❌ Get service error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get service categories
// @route   GET /api/services/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await Service.aggregate([
      { $match: { isActive: true } },
      { $group: {
          _id: '$category',
          count: { $sum: 1 },
          services: { $push: { name: '$name', serviceId: '$serviceId', fee: '$fee' } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Seed initial services (Admin only)
// @route   POST /api/services/seed
// @access  Private/Admin
exports.seedServices = async (req, res) => {
  try {
    const services = [
      // Driving Licence Services
      {
        category: 'driving-licence',
        serviceId: 'A',
        name: 'Learner Licence',
        description: 'Apply for new learner driving licence',
        detailedDescription: 'Complete process for obtaining learner driving licence including document verification and test.',
        fee: 500,
        governmentFee: 200,
        serviceFee: 300,
        processingTime: '3-5 days',
        requirements: ['Age Proof', 'Address Proof', 'Medical Certificate'],
        documentsRequired: ['Aadhaar Card', 'Passport Photos', 'Address Proof'],
        steps: [
          { stepNumber: 1, title: 'Document Submission', description: 'Submit required documents' },
          { stepNumber: 2, title: 'Application Form', description: 'Fill application form' },
          { stepNumber: 3, title: 'Test Appointment', description: 'Schedule learner test' }
        ]
      },
      {
        category: 'driving-licence',
        serviceId: 'B',
        name: 'Permanent Licence',
        description: 'Get permanent driving licence',
        fee: 1000,
        processingTime: '7-10 days'
      },
      {
        category: 'driving-licence',
        serviceId: 'C',
        name: 'Renewal Licence',
        description: 'Renew your existing driving licence',
        fee: 800,
        processingTime: '5-7 days'
      },
      {
        category: 'driving-licence',
        serviceId: 'D',
        name: 'Duplicate Licence',
        description: 'Apply for duplicate driving licence if lost',
        fee: 600,
        processingTime: '5-7 days'
      },
      {
        category: 'driving-licence',
        serviceId: 'E',
        name: 'Change of Address in Licence',
        description: 'Update address in driving licence',
        fee: 400,
        processingTime: '3-5 days'
      },
      {
        category: 'driving-licence',
        serviceId: 'F',
        name: 'International Driving Permit',
        description: 'Apply for international driving permit',
        fee: 1500,
        processingTime: '7-10 days'
      },
      {
        category: 'driving-licence',
        serviceId: 'G',
        name: 'DL Extract',
        description: 'Get extract of driving licence',
        fee: 300,
        processingTime: '2-3 days'
      },
      {
        category: 'driving-licence',
        serviceId: 'H',
        name: 'Add Class of Vehicle',
        description: 'Add new vehicle class to existing licence',
        fee: 700,
        processingTime: '5-7 days'
      },

      // Registration Certificate Services
      {
        category: 'registration-certificate',
        serviceId: 'A',
        name: 'New Registration of Vehicle',
        description: 'Register new vehicle',
        fee: 2000,
        processingTime: '7-10 days'
      },
      {
        category: 'registration-certificate',
        serviceId: 'B',
        name: 'Transfer of Vehicle Ownership',
        description: 'Transfer vehicle ownership',
        fee: 1500,
        processingTime: '7-10 days'
      },
      {
        category: 'registration-certificate',
        serviceId: 'C',
        name: 'Hypothecation Add',
        description: 'Add hypothecation to RC',
        fee: 1000,
        processingTime: '5-7 days'
      },
      {
        category: 'registration-certificate',
        serviceId: 'D',
        name: 'Hypothecation Terminate',
        description: 'Remove hypothecation from RC',
        fee: 1000,
        processingTime: '5-7 days'
      },
      {
        category: 'registration-certificate',
        serviceId: 'E',
        name: 'Duplicate Registration Certificate',
        description: 'Apply for duplicate RC',
        fee: 800,
        processingTime: '5-7 days'
      },
      {
        category: 'registration-certificate',
        serviceId: 'F',
        name: 'Issue NOC',
        description: 'Get No Objection Certificate',
        fee: 600,
        processingTime: '3-5 days'
      },
      {
        category: 'registration-certificate',
        serviceId: 'G',
        name: 'CNG Add & Remove',
        description: 'Add or remove CNG from RC',
        fee: 1200,
        processingTime: '7-10 days'
      },
      {
        category: 'registration-certificate',
        serviceId: 'H',
        name: 'Fancy Choice Number',
        description: 'Select fancy vehicle number',
        fee: 5000,
        processingTime: '10-15 days'
      },
      {
        category: 'registration-certificate',
        serviceId: 'I',
        name: 'Renewal of Vehicle Registration',
        description: 'Renew vehicle registration certificate',
        fee: 1000,
        processingTime: '5-7 days'
      },

      // Passport Services
      {
        category: 'passport',
        serviceId: 'A',
        name: 'New / Renew Passport',
        description: 'Apply for new or renew passport',
        fee: 2500,
        processingTime: '15-20 days'
      },
      {
        category: 'passport',
        serviceId: 'B',
        name: 'Tatkal Passport',
        description: 'Fast-track passport service',
        fee: 4000,
        processingTime: '3-5 days'
      },
      {
        category: 'passport',
        serviceId: 'C',
        name: 'Police Clearance Certificate',
        description: 'Get PCC for passport',
        fee: 1500,
        processingTime: '7-10 days'
      },

      // Other Services
      {
        category: 'marriage-certificate',
        serviceId: 'A',
        name: 'Marriage Certificate',
        description: 'Register marriage and get certificate',
        fee: 2000,
        processingTime: '7-10 days'
      },
      {
        category: 'legal-heir-certificate',
        serviceId: 'A',
        name: 'Legal Heir Certificate',
        description: 'Obtain legal heir certificate',
        fee: 1500,
        processingTime: '10-15 days'
      },
      {
        category: 'rti',
        serviceId: 'A',
        name: 'RTI File Return',
        description: 'File and track RTI applications',
        fee: 500,
        processingTime: '15-20 days'
      },
      {
        category: 'gst-registration',
        serviceId: 'A',
        name: 'GST Registration',
        description: 'Register for GST and compliance',
        fee: 3000,
        processingTime: '10-15 days'
      },
      {
        category: 'vehicle-challan',
        serviceId: 'A',
        name: 'Pay Vehicle Challan',
        description: 'Pay traffic challans online',
        fee: 100,
        processingTime: 'Instant'
      },
      {
        category: 'birth-certificate',
        serviceId: 'A',
        name: 'Birth Certificate & All Common Services',
        description: 'Get birth certificate and other common services',
        fee: 800,
        processingTime: '7-10 days'
      },
      {
        category: 'insurance',
        serviceId: 'A',
        name: 'All Type Insurance',
        description: 'Life, Health, Vehicle insurance services',
        fee: 500,
        processingTime: '3-5 days'
      },
      {
        category: 'visa',
        serviceId: 'A',
        name: 'Visa Services',
        description: 'Visa application services',
        fee: 5000,
        processingTime: '15-30 days',
        isActive: false
      }
    ];

    // Clear existing services
    await Service.deleteMany({});
    
    // Insert new services
    const result = await Service.insertMany(services);
    
    res.json({
      success: true,
      message: 'Services seeded successfully',
      count: result.length
    });
  } catch (error) {
    console.error('Seed services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};