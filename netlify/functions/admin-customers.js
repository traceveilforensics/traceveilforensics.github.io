const localDB = require('./local-db');
const { requireAdmin } = require('./utils/auth');

localDB.initDB();

exports.handler = requireAdmin(async (event) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    if (event.httpMethod === 'GET') {
      const customers = localDB.readJSON(localDB.CUSTOMERS_FILE);
      const users = localDB.readJSON(localDB.USERS_FILE);
      const invoices = localDB.readJSON(localDB.INVOICES_FILE);
      const requests = localDB.readJSON(localDB.REQUESTS_FILE);

      const customersWithRelations = customers.map(c => {
        const user = users.find(u => u.id === c.user_id);
        return {
          ...c,
          users: user ? { email: user.email, first_name: user.first_name, last_name: user.last_name, phone: user.phone, company: user.company } : null,
          invoices: invoices.filter(i => i.customer_id === c.id),
          service_requests: requests.filter(r => r.customer_id === c.id)
        };
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ customers: customersWithRelations })
      };
    }

    if (event.httpMethod === 'POST') {
      const { user_id, company_name } = JSON.parse(event.body);

      if (!user_id) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'User ID is required' })
        };
      }

      const customer = {
        id: localDB.generateId(),
        user_id,
        company_name: company_name || '',
        created_at: new Date().toISOString()
      };

      const customers = localDB.readJSON(localDB.CUSTOMERS_FILE);
      customers.push(customer);
      localDB.writeJSON(localDB.CUSTOMERS_FILE, customers);

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ customer })
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Customers error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
});
