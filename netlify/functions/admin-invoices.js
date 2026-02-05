const localDB = require('./local-db');
const { requireAuth } = require('./utils/auth');
localDB.initDB();
exports.handler = requireAuth(async (event) => {
  const params = event.queryStringParameters || {};
  if (event.httpMethod === 'GET') {
    let invoices = localDB.readJSON(localDB.INVOICES_FILE);
    const customers = localDB.readJSON(localDB.CUSTOMERS_FILE);
    const users = localDB.readJSON(localDB.USERS_FILE);
    const invoicesWithData = invoices.map(inv => {
      const cust = customers.find(c => c.id === inv.customer_id);
      const user = cust ? users.find(u => u.id === cust.user_id) : null;
      return { ...inv, customers: cust ? { ...cust, users: user } : null };
    });
    if (params.status) invoicesWithData.filter(i => i.status === params.status);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoices: invoicesWithData, total: invoicesWithData.length }) };
  }
  if (event.httpMethod === 'POST') {
    const { customer_id, items, issue_date, due_date, notes, discount_amount = 0, tax_rate = 16 } = JSON.parse(event.body);
    const invoices = localDB.readJSON(localDB.INVOICES_FILE);
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const tax_amount = (subtotal - discount_amount) * (tax_rate / 100);
    const total = subtotal - discount_amount + tax_amount;
    const invoice = { id: localDB.generateId(), invoice_number: localDB.generateInvoiceNumber(), customer_id, issue_date, due_date, subtotal, tax_rate, tax_amount, discount_amount, total, notes, status: 'draft', created_at: new Date().toISOString() };
    invoices.push(invoice);
    localDB.writeJSON(localDB.INVOICES_FILE, invoices);
    return { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoice }) };
  }
  return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
});
