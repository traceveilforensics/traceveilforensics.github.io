const { supabase } = require('../utils/database');
const { requireAdmin } = require('../utils/auth');
const { logActivity } = require('../utils/helpers');

exports.handler = requireAdmin(async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const { data: plans, error } = await supabase
        .from('service_plans')
        .select('*, services(name, slug)')
        .order('name');

      if (error) throw error;

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plans })
      };
    }

    if (event.httpMethod === 'POST') {
      const { service_id, name, description, price, currency, billing_cycle, features, is_active } = JSON.parse(event.body);

      if (!service_id || !name || !price) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Service ID, name, and price are required' })
        };
      }

      const { data: plan, error } = await supabase
        .from('service_plans')
        .insert({ service_id, name, description, price, currency, billing_cycle, features, is_active })
        .select()
        .single();

      if (error) throw error;

      await logActivity(event.user.userId, 'create_plan', 'service_plan', plan.id, { name, price });

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      };
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Plans error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
});
