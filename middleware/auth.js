const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer token

  if (!token) return res.status(401).json({ message: 'Access denied, no token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.position !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

module.exports = { verifyToken, requireAdmin };
