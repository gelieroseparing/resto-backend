const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token and attach user info to request object.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expect Bearer token

  if (!token) {
    return res.status(401).json({ message: 'Access denied, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded payload to request
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

/**
 * Middleware to check if the user has admin privileges.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.position !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

module.exports = {
  verifyToken,
  requireAdmin,
};