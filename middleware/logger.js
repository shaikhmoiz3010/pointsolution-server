const apiLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`🌐 ${req.method} ${req.originalUrl}`);
  if (Object.keys(req.params).length > 0) {
    console.log('   Params:', req.params);
  }
  if (Object.keys(req.query).length > 0) {
    console.log('   Query:', req.query);
  }
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    console.log(`   ✅ ${res.statusCode} (${duration}ms)`);
    
    // Log error responses
    if (res.statusCode >= 400) {
      console.log('   Error response:', data);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

module.exports = apiLogger;