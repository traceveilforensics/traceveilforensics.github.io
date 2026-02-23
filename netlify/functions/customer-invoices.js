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

    const invoices = localDB.readJSON(localDB.INVOICES_FILE);
    const customerInvoices = invoices.filter(i => i.customer_id === customer.id);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ invoices: customerInvoices, total: customerInvoices.length })
    };

  } catch (error) {
    console.error('Customer invoices error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
});
