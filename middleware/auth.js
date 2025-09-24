// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: Token missing' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ message: 'Unauthorized: User not found' });

    req.user = { id: user._id, username: user.username, position: user.position };
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (req.user.position !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }
  next();
};

// Middleware to require manager role
const requireManager = (req, res, next) => {
  if (req.user.position !== 'manager' && req.user.position !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Managers or Admins only' });
  }
  next();
};

module.exports = { verifyToken, requireAdmin, requireManager };
