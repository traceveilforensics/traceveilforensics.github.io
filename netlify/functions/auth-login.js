const localDB = require('./local-db');
const { generateToken, generateRefreshToken, validateEmail, rateLimit } = require('./utils/auth');
const bcrypt = require('bcryptjs');

localDB.initDB();

const LOGIN_RATE_LIMIT = 5;
const LOGIN_WINDOW = 15 * 60 * 1000;

const loginAttempts = new Map();

const checkRateLimit = (email) => {
  const now = Date.now();
  const attempts = loginAttempts.get(email)?.filter(t => t > now - LOGIN_WINDOW) || [];
  
  if (attempts.length >= LOGIN_RATE_LIMIT) {
    return { allowed: false, retryAfter: Math.ceil((attempts[0] + LOGIN_WINDOW - now) / 1000) };
  }
  
  attempts.push(now);
  loginAttempts.set(email, attempts);
  return { allowed: true };
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  try {
    const { email, password } = JSON.parse(event.body);
    
    if (!email || !password) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Email and password required' }) };
    }

    if (!validateEmail(email)) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid email format' }) };
    }

    const rateCheck = checkRateLimit(email);
    if (!rateCheck.allowed) {
      return {
        statusCode: 429,
        headers: { ...corsHeaders, 'Retry-After': rateCheck.retryAfter },
        body: JSON.stringify({ error: 'Too many login attempts. Please try again later.' })
      };
    }

    const users = localDB.readJSON(localDB.USERS_FILE);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid credentials' }) };
    }

    if (!user.is_active) {
      return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'Account disabled' }) };
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid credentials' }) };
    }

    const customers = localDB.readJSON(localDB.CUSTOMERS_FILE);
    const customer = customers.find(c => c.user_id === user.id);
    const token = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    const { password_hash, ...userWithoutPassword } = user;

    loginAttempts.delete(email);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        token,
        refreshToken,
        user: { ...userWithoutPassword, customerId: customer?.id || null }
      })
    };
  } catch (error) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
