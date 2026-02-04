const { supabase } = require('../utils/database');
const { requireAdmin } = require('../utils/auth');
const { logActivity } = require('../utils/helpers');

exports.handler = requireAdmin(async (event) => {
  try {
    const serviceId = event.path.split('/').pop();

    if (event.httpMethod === 'GET') {
      const { data: service, error } = await supabase
        .from('services')
        .select('*, service_plans(*)')
        .eq('id', serviceId)
        .single();

      if (error || !service) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Service not found' })
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service })
      };
    }

    if (event.httpMethod === 'PUT') {
      const { name, slug, description, icon, is_active } = JSON.parse(event.body);

      const { data: service, error } = await supabase
        .from('services')
        .update({ name, slug, description, icon, is_active })
        .eq('id', serviceId)
        .select()
        .single();

      if (error || !service) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Service not found' })
        };
      }

      await logActivity(event.user.userId, 'update_service', 'service', serviceId, { name, slug });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service })
      };
    }

    if (event.httpMethod === 'DELETE') {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Service not found' })
        };
      }

      await logActivity(event.user.userId, 'delete_service', 'service', serviceId);

      return {
        statusCode: 204,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      };
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Service detail error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
});
