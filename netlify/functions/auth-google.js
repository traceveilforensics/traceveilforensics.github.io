const localDB = require('./local-db');
const { generateToken, generateRefreshToken, sanitizeInput, validateEmail } = require('./utils/auth');
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
    const { idToken, googleId, email, firstName, lastName, picture } = JSON.parse(event.body);

    if (!idToken || !googleId) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid Google token' }) };
    }

    if (!validateEmail(email)) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid email' }) };
    }

    const users = localDB.readJSON(localDB.USERS_FILE);
    let user = users.find(u => u.google_id === googleId || u.email.toLowerCase() === email.toLowerCase());

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const salt = await bcrypt.genSalt(10);
      const tempPassword = await bcrypt.hash(googleId + Date.now(), salt);

      user = {
        id: localDB.generateId(),
        email: sanitizeInput(email.toLowerCase()),
        google_id: sanitizeInput(googleId),
        google_token: idToken,
        password_hash: tempPassword,
        first_name: sanitizeInput(firstName || ''),
        last_name: sanitizeInput(lastName || ''),
        phone: '',
        company: '',
        role: 'customer',
        is_active: true,
        is_google_account: true,
        email_verified: true,
        avatar: sanitizeInput(picture || ''),
        created_at: new Date().toISOString()
      };

      users.push(user);
      localDB.writeJSON(localDB.USERS_FILE, users);

      const customer = {
        id: localDB.generateId(),
        user_id: user.id,
        company_name: '',
        created_at: new Date().toISOString()
      };

      const customers = localDB.readJSON(localDB.CUSTOMERS_FILE);
      customers.push(customer);
      localDB.writeJSON(localDB.CUSTOMERS_FILE, customers);
    } else {
      user.google_token = idToken;
      user.avatar = picture || user.avatar;
      const userIndex = users.findIndex(u => u.id === user.id);
      users[userIndex] = user;
      localDB.writeJSON(localDB.USERS_FILE, users);
    }

    const customers = localDB.readJSON(localDB.CUSTOMERS_FILE);
    const customer = customers.find(c => c.user_id === user.id);
    
    const accessToken = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    const { password_hash, google_token, ...userWithoutSensitive } = user;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        token: accessToken,
        refreshToken,
        user: { ...userWithoutSensitive, customerId: customer?.id || null },
        isNewUser
      })
    };
  } catch (error) {
    console.error('Google auth error:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Authentication failed' }) };
  }
};
