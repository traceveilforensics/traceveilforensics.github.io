const { supabase } = require('../utils/database');
const { requireAuth } = require('../utils/auth');

exports.handler = requireAuth(async (event) => {
  try {
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', event.user.userId)
      .single();

    if (!customer) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Customer profile not found' })
      };
    }

    const { status, limit = 50, offset = 0 } = event.queryStringParameters || {};

    let query = supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*)
      `)
      .eq('customer_id', customer.id)
      .order('issue_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: invoices, error } = await query.range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customer.id);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoices, total: count })
    };

  } catch (error) {
    console.error('Customer invoices error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
});
