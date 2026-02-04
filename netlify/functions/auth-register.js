const { supabase } = require('../utils/database');
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
    const { email, password, firstName, lastName, phone, company } = JSON.parse(event.body);

    if (!email || !password || !firstName || !lastName) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Email, password, first name, and last name are required' })
      };
    }

    if (password.length < 6) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Password must be at least 6 characters' })
      };
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Email already registered' })
      };
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        first_name: firstName,
        last_name: lastName,
        phone,
        company,
        role: 'customer'
      })
      .select()
      .single();

    if (userError) {
      throw userError;
    }

    const { data: newCustomer } = await supabase
      .from('customers')
      .insert({
        user_id: newUser.id,
        company_name: company
      })
      .select()
      .single();

    const token = generateToken(newUser.id, newUser.role);

    await logActivity(
      newUser.id,
      'registration',
      'user',
      newUser.id,
      { email: newUser.email },
      event.headers['x-forwarded-for'] || event.headers['client-ip'],
      event.headers['user-agent']
    );

    const { password_hash, ...userWithoutPassword } = newUser;

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        user: {
          ...userWithoutPassword,
          customerId: newCustomer.id
        }
      })
    };

  } catch (error) {
    console.error('Registration error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
