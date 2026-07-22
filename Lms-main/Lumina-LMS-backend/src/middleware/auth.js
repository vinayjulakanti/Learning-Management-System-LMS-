const jwt = require('jsonwebtoken');
const User = require('../models/User');

function auth(required = true) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) {
        if (!required) return next();
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      const user = await User.findById(payload.id).select('-password');
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      req.user = user;
      next();
    } catch (e) {
      if (!required) return next();
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const userRole = (req.user.role || '').toLowerCase();
    const allowed = roles.map(r => String(r).toLowerCase());
    // Teachers are allowed to access all protected routes
    if (userRole === 'teacher') return next();
    if (!allowed.includes(userRole)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

module.exports = { auth, requireRole };
