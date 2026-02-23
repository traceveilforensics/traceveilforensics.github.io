const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  console.error('SECURITY WARNING: JWT secrets not configured in environment variables!');
}

const REFRESH_TOKEN_EXPIRY = '7d';
const ACCESS_TOKEN_EXPIRY = '1h';

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
    { userId, role, type: 'access' },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
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
        body: JSON.stringify({ error: 'Unauthorized - No token provided' })
      };
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized - Invalid or expired token' })
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
        body: JSON.stringify({ error: 'Forbidden - Admin access required' })
      };
    }
    return handler(event);
  });
};

const rateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (identifier) => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const userAttempts = attempts.get(identifier)?.filter(t => t > windowStart) || [];
    
    if (userAttempts.length >= maxAttempts) {
      const retryAfter = Math.ceil((userAttempts[0] + windowMs - now) / 1000);
      return { blocked: true, retryAfter };
    }
    
    userAttempts.push(now);
    attempts.set(identifier, userAttempts);
    return { blocked: false };
  };
};

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
