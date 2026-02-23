const localDB = require('./local-db');
const { generateToken, generateRefreshToken, validateEmail } = require('./utils/auth');
const bcrypt = require('bcryptjs');

localDB.initDB();

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
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
