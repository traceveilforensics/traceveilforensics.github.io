const { supabase } = require('../utils/database');
const { requireAdmin } = require('../utils/auth');

exports.handler = requireAdmin(async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const { data: customers, error } = await supabase
        .from('customers')
        .select(`
          *,
          users (email, first_name, last_name, phone, company),
          invoices (id, invoice_number, status, total, due_date),
          service_requests (id, title, status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers })
      };
    }

    if (event.httpMethod === 'POST') {
      const { user_id, company_name, tax_id, billing_address, billing_city, billing_state, billing_postal_code, billing_country, notes } = JSON.parse(event.body);

      if (!user_id) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'User ID is required' })
        };
      }

      const { data: customer, error } = await supabase
        .from('customers')
        .insert({ user_id, company_name, tax_id, billing_address, billing_city, billing_state, billing_postal_code, billing_country, notes })
        .select(`
          *,
          users (email, first_name, last_name, phone, company)
        `)
        .single();

      if (error) throw error;

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer })
      };
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Customers error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
});
