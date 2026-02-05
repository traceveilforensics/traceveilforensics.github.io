const localDB = require('./local-db');
const { requireAuth } = require('./utils/auth');
localDB.initDB();
exports.handler = requireAuth(async (event) => {
  if (event.httpMethod === 'GET') {
    const plans = localDB.readJSON('./data/plans.json');
    const services = localDB.readJSON(localDB.SERVICES_FILE);
    const servicesWithPlans = services.map(s => ({ ...s, service_plans: plans.filter(p => p.service_id === s.id) }));
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ services: servicesWithPlans }) };
  }
  if (event.httpMethod === 'POST') {
    const { name, slug, description, icon, is_active } = JSON.parse(event.body);
    const services = localDB.readJSON(localDB.SERVICES_FILE);
    const service = { id: localDB.generateId(), name, slug, description, icon, is_active: is_active !== false, created_at: new Date().toISOString() };
    services.push(service);
    localDB.writeJSON(localDB.SERVICES_FILE, services);
    return { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ service }) };
  }
  return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
});
