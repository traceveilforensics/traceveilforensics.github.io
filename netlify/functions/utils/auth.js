const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  console.error('FATAL: JWT secrets not configured');
}

const REFRESH_TOKEN_EXPIRY = '7d';
const ACCESS_TOKEN_EXPIRY = '15m';

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '').trim().slice(0, 1000);
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const generateToken = (userId, role) => {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
  return jwt.sign(
    { userId, role, type: 'access', iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh', iat: Math.floor(Date.now() / 1000) },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

const verifyToken = (token) => {
  try {
    if (!JWT_SECRET) return null;
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    if (!JWT_REFRESH_SECRET) return null;
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

const requireAuth = (handler) => {
  return async (event) => {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid or expired token' })
      };
    }

    event.user = decoded;
    return handler(event);
  };
};

const requireAdmin = (handler) => {
  return requireAuth(async (event) => {
    if (event.user.role !== 'admin') {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Admin access required' })
      };
    }
    return handler(event);
  });
};

const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

const rateLimit = (identifier) => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  const userAttempts = rateLimitStore.get(identifier)?.filter(t => t > windowStart) || [];
  
  if (userAttempts.length >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((userAttempts[0] + RATE_LIMIT_WINDOW - now) / 1000);
    return { blocked: true, retryAfter };
  }
  
  userAttempts.push(now);
  rateLimitStore.set(identifier, userAttempts);
  return { blocked: false };
};

const cleanExpiredRateLimits = () => {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitStore.entries()) {
    const valid = timestamps.filter(t => t > now - RATE_LIMIT_WINDOW);
    if (valid.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, valid);
    }
  }
};
setInterval(cleanExpiredRateLimits, RATE_LIMIT_WINDOW);

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  requireAuth,
  requireAdmin,
  rateLimit,
  sanitizeInput,
  validateEmail
};
