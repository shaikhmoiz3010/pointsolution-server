// Import the Express app from your server
const app = require('../server/index.js');

// Export as a serverless function
module.exports = (req, res) => {
  // Fix for Vercel's serverless environment
  console.log(`📨 ${req.method} ${req.url}`);
  
  // Handle the request
  return app(req, res);
};