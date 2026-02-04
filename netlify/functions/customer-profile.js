const { supabase } = require('../utils/database');
const { requireAuth } = require('../utils/auth');
const { logActivity } = require('../utils/helpers');

exports.handler = requireAuth(async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const { data: customer, error } = await supabase
        .from('customers')
        .select(`
          *,
          users (email, first_name, last_name, phone, company)
        `)
        .eq('user_id', event.user.userId)
        .single();

      if (error || !customer) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Customer profile not found' })
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer })
      };
    }

    if (event.httpMethod === 'PUT') {
      const { company_name, tax_id, billing_address, billing_city, billing_state, billing_postal_code, billing_country, first_name, last_name, phone } = JSON.parse(event.body);

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .update({
          company_name,
          tax_id,
          billing_address,
          billing_city,
          billing_state,
          billing_postal_code,
          billing_country
        })
        .eq('user_id', event.user.userId)
        .select()
        .single();

      if (customerError) throw customerError;

      const { error: userError } = await supabase
        .from('users')
        .update({ first_name, last_name, phone })
        .eq('id', event.user.userId);

      if (userError) throw userError;

      await logActivity(event.user.userId, 'update_profile', 'customer', customer.id);

      const { data: updatedCustomer } = await supabase
        .from('customers')
        .select(`
          *,
          users (email, first_name, last_name, phone, company)
        `)
        .eq('user_id', event.user.userId)
        .single();

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer: updatedCustomer })
      };
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Customer profile error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
});
