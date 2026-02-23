const localDB = require('./local-db');
const { requireAuth } = require('./utils/auth');

localDB.initDB();

exports.handler = requireAuth(async (event) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const customers = localDB.readJSON(localDB.CUSTOMERS_FILE);
    const customer = customers.find(c => c.user_id === event.user.userId);

    if (!customer) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Customer profile not found' })
      };
    }

    if (event.httpMethod === 'GET') {
      const requests = localDB.readJSON(localDB.REQUESTS_FILE);
      const customerRequests = requests.filter(r => r.customer_id === customer.id);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ requests: customerRequests, total: customerRequests.length })
      };
    }

    if (event.httpMethod === 'POST') {
      const { title, description, priority } = JSON.parse(event.body);

      if (!title) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Title is required' })
        };
      }

      const request = {
        id: localDB.generateId(),
        customer_id: customer.id,
        title,
        description: description || '',
        priority: priority || 'normal',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const requests = localDB.readJSON(localDB.REQUESTS_FILE);
      requests.push(request);
      localDB.writeJSON(localDB.REQUESTS_FILE, requests);

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ request })
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Service requests error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
});
