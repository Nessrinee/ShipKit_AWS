const { verifyAccessToken } = require('../utils/jwt');

/**
 * Protect routes — requires a valid JWT access token
 */
const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed' });
  }

  const token = header.slice(7);
  const { valid, payload, error } = verifyAccessToken(token);

  if (!valid) {
    const status = error === 'jwt expired' ? 401 : 403;
    return res.status(status).json({ error: 'Invalid or expired token' });
  }

  req.user = payload;
  next();
};

/**
 * Require admin role
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { requireAuth, requireAdmin };
