const localDB = require('./local-db');
localDB.initDB();
exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  try {
    const plans = localDB.readJSON('./data/plans.json');
    const services = localDB.readJSON(localDB.SERVICES_FILE);
    const servicesWithPlans = services.map(service => ({ ...service, service_plans: plans.filter(p => p.service_id === service.id) }));
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ services: servicesWithPlans }) };
  } catch (error) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
