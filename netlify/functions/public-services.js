const { supabase } = require('../utils/database');

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const { data: services, error } = await supabase
        .from('services')
        .select(`
          *,
          service_plans (*)
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services })
      };
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Public services error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
