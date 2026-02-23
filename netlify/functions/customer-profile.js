const localDB = require('./local-db');
const { requireAuth } = require('./utils/auth');

localDB.initDB();

exports.handler = requireAuth(async (event) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    if (event.httpMethod === 'GET') {
      const customers = localDB.readJSON(localDB.CUSTOMERS_FILE);
      const users = localDB.readJSON(localDB.USERS_FILE);
      
      const customer = customers.find(c => c.user_id === event.user.userId);
      const user = users.find(u => u.id === event.user.userId);

      if (!customer) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Customer profile not found' })
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ customer: { ...customer, users: user } })
      };
    }

    if (event.httpMethod === 'PUT') {
      const { company_name, first_name, last_name, phone } = JSON.parse(event.body);

      const customers = localDB.readJSON(localDB.CUSTOMERS_FILE);
      const users = localDB.readJSON(localDB.USERS_FILE);
      
      const customerIndex = customers.findIndex(c => c.user_id === event.user.userId);
      const userIndex = users.findIndex(u => u.id === event.user.userId);

      if (customerIndex === -1) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Customer not found' })
        };
      }

      if (company_name) customers[customerIndex].company_name = company_name;
      localDB.writeJSON(localDB.CUSTOMERS_FILE, customers);

      if (userIndex !== -1) {
        if (first_name) users[userIndex].first_name = first_name;
        if (last_name) users[userIndex].last_name = last_name;
        if (phone) users[userIndex].phone = phone;
        localDB.writeJSON(localDB.USERS_FILE, users);
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ customer: customers[customerIndex] })
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Customer profile error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
});
