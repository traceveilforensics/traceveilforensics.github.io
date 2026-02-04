const { supabase } = require('../utils/database');
const { requireAuth } = require('../utils/auth');
const { logActivity } = require('../utils/helpers');

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

    if (event.httpMethod === 'GET') {
      const { status, limit = 20, offset = 0 } = event.queryStringParameters || {};

      let query = supabase
        .from('service_requests')
        .select(`
          *,
          service_plans (name, services(name, icon))
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: requests, error } = await query.range(offset, offset + parseInt(limit) - 1);

      if (error) throw error;

      const { count } = await supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customer.id);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests, total: count })
      };
    }

    if (event.httpMethod === 'POST') {
      const { service_plan_id, title, description, priority } = JSON.parse(event.body);

      if (!title) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Title is required' })
        };
      }

      const { data: request, error } = await supabase
        .from('service_requests')
        .insert({
          customer_id: customer.id,
          service_plan_id,
          title,
          description,
          priority: priority || 'normal',
          status: 'pending'
        })
        .select(`
          *,
          service_plans (name, services(name, icon))
        `)
        .single();

      if (error) throw error;

      await logActivity(event.user.userId, 'create_request', 'service_request', request.id, { title });

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request })
      };
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Service requests error:', error)
      return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
});
