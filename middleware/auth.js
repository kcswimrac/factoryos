/**
 * JWT Authentication Middleware
 *
 * Usage:
 *   const { authenticateToken, optionalAuth } = require('./middleware/auth');
 *   app.use('/api/protected', authenticateToken);
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';

/**
 * Strict auth — rejects unauthenticated requests with 401
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') && authHeader.slice(7);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required', code: 'AUTH_REQUIRED' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired, please log in again', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token', code: 'INVALID_TOKEN' });
  }
}

/**
 * Optional auth — attaches user if token present, continues either way
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') && authHeader.slice(7);

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (_) {
      // ignore invalid tokens in optional mode
    }
  }
  next();
}

/**
 * Sign a JWT for a user object
 */
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Blocks POST/PUT/PATCH/DELETE if req.user is not set.
 * Use after optionalAuth on routes where GETs are public but writes need auth.
 */
function requireAuthForWrites(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required for write operations', code: 'AUTH_REQUIRED' });
  }
  next();
}

/**
 * Simple in-memory rate limiter.
 * @param {object} opts
 * @param {number} opts.windowMs  — time window in ms (default 60 000)
 * @param {number} opts.max       — max requests per window (default 10)
 * @param {function} [opts.keyFn] — extracts key from req (default: IP)
 */
function rateLimit({ windowMs = 60000, max = 10, keyFn } = {}) {
  const hits = new Map();

  // Cleanup stale entries every windowMs
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now - entry.start > windowMs) hits.delete(key);
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const key = keyFn ? keyFn(req) : (req.ip || req.connection.remoteAddress || 'unknown');
    const now = Date.now();
    let entry = hits.get(key);

    if (!entry || now - entry.start > windowMs) {
      entry = { start: now, count: 0 };
      hits.set(key, entry);
    }

    entry.count++;

    if (entry.count > max) {
      return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
    }

    next();
  };
}

module.exports = { authenticateToken, optionalAuth, signToken, requireAuthForWrites, rateLimit };
