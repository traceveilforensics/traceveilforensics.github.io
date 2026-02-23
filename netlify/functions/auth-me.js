const localDB = require('./local-db');
const { verifyToken } = require('./utils/auth');

localDB.initDB();

exports.handler = async (event) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    const users = localDB.readJSON(localDB.USERS_FILE);
    const user = users.find(u => u.id === decoded.userId);

    if (!user) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    const customers = localDB.readJSON(localDB.CUSTOMERS_FILE);
    const customer = customers.find(c => c.user_id === user.id);

    const { password_hash, ...userWithoutPassword } = user;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        user: {
          ...userWithoutPassword,
          customerId: customer?.id || null
        }
      })
    };

  } catch (error) {
    console.error('Get user error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
