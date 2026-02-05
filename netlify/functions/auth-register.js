const localDB = require('./local-db');
const { generateToken } = require('./utils/auth');
const bcrypt = require('bcryptjs');

localDB.initDB();

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { email, password, firstName, lastName, phone, company } = JSON.parse(event.body);

    if (!email || !password || !firstName || !lastName) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'All fields required' }) };
    }

    const users = localDB.readJSON(localDB.USERS_FILE);
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { statusCode: 409, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Email already exists' }) };
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = {
      id: localDB.generateId(),
      email: email.toLowerCase(),
      password_hash,
      first_name: firstName,
      last_name: lastName,
      phone: phone || '',
      company: company || '',
      role: 'customer',
      is_active: true,
      created_at: new Date().toISOString()
    };

    users.push(user);
    localDB.writeJSON(localDB.USERS_FILE, users);

    const customer = {
      id: localDB.generateId(),
      user_id: user.id,
      company_name: company || '',
      created_at: new Date().toISOString()
    };

    const customers = localDB.readJSON(localDB.CUSTOMERS_FILE);
    customers.push(customer);
    localDB.writeJSON(localDB.CUSTOMERS_FILE, customers);

    const token = generateToken(user.id, user.role);
    const { password_hash: _, ...userWithoutPassword } = user;

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, user: { ...userWithoutPassword, customerId: customer.id } })
    };
  } catch (error) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
