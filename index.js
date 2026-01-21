const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://your-frontend-app.vercel.app' // Add your frontend URL
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

let isDbConnected = false;

const connectDB = async () => {
  if (isDbConnected) {
    console.log('✅ Using existing MongoDB connection');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isDbConnected = true;
    console.log('✅ MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isDbConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isDbConnected = false;
    });
    
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    // In serverless environment, we don't crash
    isDbConnected = false;
  }
};

app.use(async (req, res, next) => {
  try {
    await connectDB();
    if (!isDbConnected && mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available'
      });
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const apiLogger = require('./middleware/logger');
const adminRoutes = require('./routes/adminRoutes');

// Logger middleware
app.use(apiLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: '1Point 1Solution API is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    platform: process.env.VERCEL ? 'Vercel' : 'Local'
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    server: process.env.VERCEL ? 'Vercel Serverless' : 'Local Server'
  });
});

// Welcome route
app.get('/api', (req, res) => {
  res.json({
    name: '1Point 1Solution API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/auth',
      services: '/api/services',
      bookings: '/api/bookings',
      payments: '/api/payments',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});

// 404 Route for API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    endpoint: req.originalUrl
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: '1Point 1Solution Backend',
    version: '1.0.0',
    status: 'running',
    deployment: process.env.VERCEL ? 'Vercel Serverless Functions' : 'Local Express Server',
    api_base: '/api',
    docs: '/api/health'
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      stack: err.stack
    } : undefined
  });
});

// =============================================
// VERCEL/LOCAL COMPATIBILITY
// =============================================

// Check if running on Vercel
const isVercel = process.env.VERCEL === '1';

if (isVercel) {
  console.log('🚀 Running on Vercel Serverless Platform');
  
  // For Vercel Serverless Functions
  // We export the app as a serverless function
  module.exports = app;
  
  // Optional: You can also export specific handlers
  // module.exports = async (req, res) => {
  //   return app(req, res);
  // };
} else {
  // For local development
  console.log('🏠 Running in Local Development Mode');
  
  const PORT = process.env.PORT || 5000;
  
  // Only start the server if not imported by Vercel
  if (require.main === module) {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Local: http://localhost:${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
      console.log(`📊 Health: http://localhost:${PORT}/api/health`);
    });
  }
  
  // Also export for testing or other uses
  module.exports = app;
}

// Log startup info
console.log('=====================================');
console.log('1Point 1Solution Server');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
console.log(`Platform: ${isVercel ? 'Vercel Serverless' : 'Local'}`);
console.log('=====================================');