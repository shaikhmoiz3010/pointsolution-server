require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('./models/Service');
const User = require('./models/User');

const services = [
  // Driving Licence Services (8 services)
  { 
    category: 'driving-licence', 
    serviceId: 'A', 
    name: 'Learner Licence', 
    description: 'Apply for new learner driving licence',
    fee: 500,
    processingTime: '3-5 days',
    requirements: ['Age Proof', 'Address Proof', 'Medical Certificate'],
    documentsRequired: ['Aadhaar Card', 'Passport Photos']
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
    name: 'Add Class of Vehicle in Driving Licence', 
    description: 'Add new vehicle class to existing licence',
    fee: 700,
    processingTime: '5-7 days'
  },

  // Registration Certificate Services (9 services)
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
    name: 'Hypothecation Add in Registration Certificate', 
    description: 'Add hypothecation to RC',
    fee: 1000,
    processingTime: '5-7 days'
  },
  { 
    category: 'registration-certificate', 
    serviceId: 'D', 
    name: 'Hypothecation Terminate in Registration Certificate', 
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
    name: 'Issue NOC of Registration Certificate', 
    description: 'Get No Objection Certificate',
    fee: 600,
    processingTime: '3-5 days'
  },
  { 
    category: 'registration-certificate', 
    serviceId: 'G', 
    name: 'CNG Add & Remove in Registration Certificate', 
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
    name: 'Renewal of Vehicle Registration Certificate', 
    description: 'Renew vehicle registration certificate',
    fee: 1000,
    processingTime: '5-7 days'
  },

  // Passport Services (3 services)
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
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/1point1solution');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Service.deleteMany({});
    console.log('🗑️  Cleared existing services');

    // Insert new services
    await Service.insertMany(services);
    console.log(`✅ Seeded ${services.length} services successfully`);

    // Display summary
    const categories = {};
    services.forEach(service => {
      if (!categories[service.category]) {
        categories[service.category] = 0;
      }
      categories[service.category]++;
    });

    console.log('\n📊 Service Categories Summary:');
    console.log('==============================');
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`  ${category.replace('-', ' ').toUpperCase()}: ${count} services`);
    });

    // Create a test admin user
    const testAdmin = {
      fullName: 'Admin User',
      email: 'admin@1point1solution.com',
      phone: '9345678958',
      password: 'admin@123',
      role: 'admin'
    };

    // Clear existing test user if exists
    await User.deleteOne({ email: testAdmin.email });
    
    // Create test admin user
    const adminUser = await User.create(testAdmin);
    console.log('\n👤 Created test admin user:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: ${testAdmin.password}`);

    // Create a test regular user
    const testUser = {
      fullName: 'Test User',
      email: 'user@1point1solution.com',
      phone: '8888888888',
      password: 'user123',
      role: 'user'
    };

    await User.deleteOne({ email: testUser.email });
    const regularUser = await User.create(testUser);
    console.log('\n👤 Created test regular user:');
    console.log(`   Email: ${regularUser.email}`);
    console.log(`   Password: ${testUser.password}`);

    console.log('\n✅ Database seeding completed!');
    console.log('\n🔗 API Endpoints:');
    console.log('   http://localhost:5000/api/health');
    console.log('   http://localhost:5000/api/services');
    console.log('\n👥 Login Credentials:');
    console.log('   Admin: admin@1point1solution.com / admin123');
    console.log('   User: user@1point1solution.com / user123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();