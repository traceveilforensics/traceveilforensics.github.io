const { supabase, supabaseAdmin } = require('../utils/database');
const { generateToken } = require('../utils/auth');
const bcrypt = require('bcryptjs');
const { logActivity } = require('../utils/helpers');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Email and password are required' })
      };
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*, customers(id)')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid email or password' })
      };
    }

    if (!user.is_active) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Account is disabled' })
      };
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid email or password' })
      };
    }

    const token = generateToken(user.id, user.role);

    await logActivity(
      user.id,
      'login',
      null,
      null,
      {},
      event.headers['x-forwarded-for'] || event.headers['client-ip'],
      event.headers['user-agent']
    );

    const { password_hash, ...userWithoutPassword } = user;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        user: {
          ...userWithoutPassword,
          customerId: user.customers?.[0]?.id
        }
      })
    };

  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
