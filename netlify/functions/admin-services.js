const { supabase } = require('../utils/database');
const { requireAdmin } = require('../utils/auth');
const { logActivity } = require('../utils/helpers');

exports.handler = requireAdmin(async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const { data: services, error } = await supabase
        .from('services')
        .select(`
          *,
          service_plans (*)
        `)
        .order('name');

      if (error) throw error;

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services })
      };
    }

    if (event.httpMethod === 'POST') {
      const { name, slug, description, icon, is_active } = JSON.parse(event.body);

      if (!name || !slug) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Name and slug are required' })
        };
      }

      const { data: service, error } = await supabase
        .from('services')
        .insert({ name, slug, description, icon, is_active })
        .select()
        .single();

      if (error) throw error;

      await logActivity(event.user.userId, 'create_service', 'service', service.id, { name, slug });

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service })
      };
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Services error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
});
