const localDB = require('./local-db');
const { requireAdmin } = require('./utils/auth');

localDB.initDB();

exports.handler = requireAdmin(async (event) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const invoiceId = event.path.split('/').pop();

    if (event.httpMethod === 'GET') {
      const invoices = localDB.readJSON(localDB.INVOICES_FILE);
      const invoice = invoices.find(i => i.id === invoiceId);

      if (!invoice) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invoice not found' })
        };
      }

      const customers = localDB.readJSON(localDB.CUSTOMERS_FILE);
      const users = localDB.readJSON(localDB.USERS_FILE);
      const customer = customers.find(c => c.id === invoice.customer_id);
      const user = customer ? users.find(u => u.id === customer.user_id) : null;

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ invoice: { ...invoice, customers: { ...customer, users: user } } })
      };
    }

    if (event.httpMethod === 'PUT') {
      const { status } = JSON.parse(event.body);

      const invoices = localDB.readJSON(localDB.INVOICES_FILE);
      const invoiceIndex = invoices.findIndex(i => i.id === invoiceId);

      if (invoiceIndex === -1) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invoice not found' })
        };
      }

      if (status) invoices[invoiceIndex].status = status;
      localDB.writeJSON(localDB.INVOICES_FILE, invoices);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ invoice: invoices[invoiceIndex] })
      };
    }

    if (event.httpMethod === 'DELETE') {
      const invoices = localDB.readJSON(localDB.INVOICES_FILE);
      const invoiceIndex = invoices.findIndex(i => i.id === invoiceId);

      if (invoiceIndex === -1) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invoice not found' })
        };
      }

      invoices.splice(invoiceIndex, 1);
      localDB.writeJSON(localDB.INVOICES_FILE, invoices);

      return {
        statusCode: 204,
        headers: corsHeaders,
        body: JSON.stringify({})
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Invoice detail error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
});
