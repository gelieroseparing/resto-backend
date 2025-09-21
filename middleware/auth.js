// middleware/auth.js
const jwt = require('jsonwebtoken');

const verifyToken = function(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains { userId, username, position }
    next();
  } catch (e) {
    console.error('Token verification error:', e);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = verifyToken;