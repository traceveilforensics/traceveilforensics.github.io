const localDB = require('./local-db');
const { requireAdmin } = require('./utils/auth');

localDB.initDB();

exports.handler = requireAdmin(async (event) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const serviceId = event.path.split('/').pop();

    if (event.httpMethod === 'GET') {
      const services = localDB.readJSON(localDB.SERVICES_FILE);
      const service = services.find(s => s.id === serviceId);

      if (!service) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Service not found' })
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ service })
      };
    }

    if (event.httpMethod === 'PUT') {
      const { name, slug, description, icon, is_active } = JSON.parse(event.body);

      const services = localDB.readJSON(localDB.SERVICES_FILE);
      const serviceIndex = services.findIndex(s => s.id === serviceId);

      if (serviceIndex === -1) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Service not found' })
        };
      }

      if (name) services[serviceIndex].name = name;
      if (slug) services[serviceIndex].slug = slug;
      if (description) services[serviceIndex].description = description;
      if (icon) services[serviceIndex].icon = icon;
      if (is_active !== undefined) services[serviceIndex].is_active = is_active;

      localDB.writeJSON(localDB.SERVICES_FILE, services);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ service: services[serviceIndex] })
      };
    }

    if (event.httpMethod === 'DELETE') {
      const services = localDB.readJSON(localDB.SERVICES_FILE);
      const serviceIndex = services.findIndex(s => s.id === serviceId);

      if (serviceIndex === -1) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Service not found' })
        };
      }

      services.splice(serviceIndex, 1);
      localDB.writeJSON(localDB.SERVICES_FILE, services);

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
    console.error('Service detail error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
});
