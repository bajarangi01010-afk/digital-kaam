const { ADMIN_PASSWORD } = require('../config');
const { signaturesMatch } = require('../utils/security');

// Simple admin auth check (password header se)
function requireAdmin(req, res, next) {
  const password = req.headers['x-admin-password'];
  if (!ADMIN_PASSWORD || typeof password !== 'string' || !signaturesMatch(ADMIN_PASSWORD, password)) {
    return res.status(401).json({ message: 'Galat admin password' });
  }
  next();
}

module.exports = { requireAdmin };
