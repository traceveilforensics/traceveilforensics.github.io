const localDB = require('./local-db');
const { requireAdmin } = require('./utils/auth');

localDB.initDB();

exports.handler = requireAdmin(async (event) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    if (event.httpMethod === 'GET') {
      const plans = localDB.readJSON(localDB.PLANS_FILE);
      const services = localDB.readJSON(localDB.SERVICES_FILE);

      const plansWithServices = plans.map(plan => {
        const service = services.find(s => s.id === plan.service_id);
        return { ...plan, services: service ? { name: service.name, slug: service.slug } : null };
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ plans: plansWithServices })
      };
    }

    if (event.httpMethod === 'POST') {
      const { service_id, name, description, price, currency, billing_cycle, features, is_active } = JSON.parse(event.body);

      if (!service_id || !name || !price) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Service ID, name, and price are required' })
        };
      }

      const plan = {
        id: localDB.generateId(),
        service_id,
        name,
        description: description || '',
        price,
        currency: currency || 'KES',
        billing_cycle: billing_cycle || 'monthly',
        features: features || [],
        is_active: is_active !== false,
        created_at: new Date().toISOString()
      };

      const plans = localDB.readJSON(localDB.PLANS_FILE);
      plans.push(plan);
      localDB.writeJSON(localDB.PLANS_FILE, plans);

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ plan })
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Plans error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
});
