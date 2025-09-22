// middleware/auth.js
const jwt = require('jsonwebtoken');

const verifyToken = function(req, res, next) {
  // Check for token in multiple locations
  const token = 
    req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) :
    req.headers['x-access-token'] || 
    req.query.token;
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access denied. No token provided.' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains { userId, username, position, iat, exp }
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    let message = 'Invalid token';
    if (error.name === 'TokenExpiredError') {
      message = 'Token expired';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Malformed token';
    }
    
    return res.status(401).json({ 
      success: false,
      message 
    });
  }
};

// Optional: Create admin middleware if needed
const requireAdmin = function(req, res, next) {
  if (req.user.position !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

// Optional: Create manager middleware if needed
const requireManager = function(req, res, next) {
  const allowedPositions = ['admin', 'manager'];
  if (!allowedPositions.includes(req.user.position)) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Manager privileges required.' 
    });
  }
  next();
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireManager
};