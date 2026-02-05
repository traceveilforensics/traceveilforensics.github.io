const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const localDB = require('./local-db');

const app = express();
const PORT = 8888;
const JWT_SECRET = 'traceveil-local-secret-2025';

// Initialize database
localDB.initDB();

app.use(cors());
app.use(bodyParser.json());

// ============ AUTH MIDDLEWARE ============
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ============ AUTH ROUTES ============

// Login
app.post('/api/auth-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = localDB.read('users');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const customers = localDB.read('customers');
    const customer = customers.find(c => c.user_id === user.id);
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    const { password_hash: _ph, ...userWithoutPassword } = user;
    res.json({ token, user: { ...userWithoutPassword, customerId: customer?.id } });
  } catch (e) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// Register
app.post('/api/auth-register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, company } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields required' });
    }
    
    const users = localDB.read('users');
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    const user = {
      id: localDB.generateId(),
      email: email.toLowerCase(),
      password_hash,
      first_name: firstName,
      last_name: lastName,
      phone: phone || '',
      company: company || '',
      role: 'customer',
      is_active: true,
      created_at: new Date().toISOString()
    };
    
    users.push(user);
    localDB.write('users', users);
    
    const customer = {
      id: localDB.generateId(),
      user_id: user.id,
      company_name: company || '',
      created_at: new Date().toISOString()
    };
    
    const customers = localDB.read('customers');
    customers.push(customer);
    localDB.write('customers', customers);
    
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password_hash: _, ...userWithoutPassword } = user;
    
    res.status(201).json({ token, user: { ...userWithoutPassword, customerId: customer.id } });
  } catch (e) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// Get current user
app.get('/api/auth-me', authenticate, (req, res) => {
  const users = localDB.read('users');
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const customers = localDB.read('customers');
  const customer = customers.find(c => c.user_id === user.id);
  const { password_hash: __, ...userWithoutPassword } = user;
  res.json({ user: { ...userWithoutPassword, customerId: customer?.id } });
});

// ============ PUBLIC ROUTES ============

// Get all services
app.get('/api/public-services', (req, res) => {
  const services = localDB.read('services');
  const plans = localDB.read('plans');
  const servicesWithPlans = services.map(s => ({
    ...s,
    service_plans: plans.filter(p => p.service_id === s.id)
  }));
  res.json({ services: servicesWithPlans });
});

// ============ ADMIN ROUTES ============

// Get all services (admin)
app.get('/api/admin-services', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const services = localDB.read('services');
  const plans = localDB.read('plans');
  res.json({ services: services.map(s => ({ ...s, service_plans: plans.filter(p => p.service_id === s.id) })) });
});

// Create service (admin)
app.post('/api/admin-services', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const { name, slug, description, icon } = req.body;
  const services = localDB.read('services');
  const service = {
    id: localDB.generateId(),
    name,
    slug,
    description: description || '',
    icon: icon || 'fa-cog',
    is_active: true
  };
  services.push(service);
  localDB.write('services', services);
  res.status(201).json({ service });
});

// Update service (admin)
app.put('/api/admin-services/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const { name, slug, description, icon, is_active } = req.body;
  const services = localDB.read('services');
  const idx = services.findIndex(s => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Service not found' });
  }
  services[idx] = { ...services[idx], name, slug, description, icon, is_active };
  localDB.write('services', services);
  res.json({ service: services[idx] });
});

// Delete service (admin)
app.delete('/api/admin-services/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const services = localDB.read('services');
  const idx = services.findIndex(s => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Service not found' });
  }
  const deleted = services.splice(idx, 1)[0];
  localDB.write('services', services);
  res.json({ deleted });
});

// ============ PRICING PLANS ============

// Get all plans
app.get('/api/admin-plans', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const plans = localDB.read('plans');
  const services = localDB.read('services');
  const plansWithServices = plans.map(p => ({
    ...p,
    services: services.find(s => s.id === p.service_id)
  }));
  res.json({ plans: plansWithServices });
});

// Create plan (admin)
app.post('/api/admin-plans', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const { service_id, name, description, price, currency, billing_cycle, features } = req.body;
  const plans = localDB.read('plans');
  const plan = {
    id: localDB.generateId(),
    service_id,
    name,
    description: description || '',
    price: parseFloat(price) || 0,
    currency: currency || 'KES',
    billing_cycle: billing_cycle || 'one_time',
    features: features || []
  };
  plans.push(plan);
  localDB.write('plans', plans);
  res.status(201).json({ plan });
});

// Update plan (admin)
app.put('/api/admin-plans/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const { service_id, name, description, price, currency, billing_cycle, features } = req.body;
  const plans = localDB.read('plans');
  const idx = plans.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Plan not found' });
  }
  plans[idx] = { ...plans[idx], service_id, name, description, price: parseFloat(price)||0, currency, billing_cycle, features };
  localDB.write('plans', plans);
  res.json({ plan: plans[idx] });
});

// Delete plan (admin)
app.delete('/api/admin-plans/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const plans = localDB.read('plans');
  const idx = plans.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Plan not found' });
  }
  const deleted = plans.splice(idx, 1)[0];
  localDB.write('plans', plans);
  res.json({ deleted });
});

// Get reports (admin)
app.get('/api/admin-reports', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const invoices = localDB.read('invoices');
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + parseFloat(i.total), 0);
  const pendingAmount = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + parseFloat(i.total), 0);
  res.json({
    totalRevenue,
    pendingAmount,
    invoiceStats: {
      paid: invoices.filter(i => i.status === 'paid').length,
      sent: invoices.filter(i => i.status === 'sent').length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
      draft: invoices.filter(i => i.status === 'draft').length
    },
    invoices
  });
});

// Get invoices (admin)
app.get('/api/admin-invoices', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const invoices = localDB.read('invoices');
  const customers = localDB.read('customers');
  const users = localDB.read('users');
  const invoicesWithData = invoices.map(inv => {
    const cust = customers.find(c => c.id === inv.customer_id);
    const user = cust ? users.find(u => u.id === cust.user_id) : null;
    return { ...inv, customers: cust ? { ...cust, users: user } : null };
  });
  res.json({ invoices: invoicesWithData, total: invoicesWithData.length });
});

// Create invoice (admin)
app.post('/api/admin-invoices', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const { customer_id, items, issue_date, due_date, notes, discount_amount = 0, tax_rate = 16 } = req.body;
  
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const tax_amount = (subtotal - discount_amount) * (tax_rate / 100);
  const total = subtotal - discount_amount + tax_amount;
  
  const invoice = {
    id: localDB.generateId(),
    invoice_number: localDB.generateInvoiceNumber(),
    customer_id,
    issue_date,
    due_date,
    subtotal,
    tax_rate,
    tax_amount,
    discount_amount,
    total,
    notes: notes || '',
    status: 'draft',
    created_at: new Date().toISOString()
  };
  
  const invoices = localDB.read('invoices');
  invoices.push(invoice);
  localDB.write('invoices', invoices);
  
  res.status(201).json({ invoice });
});

// Get customers (admin)
app.get('/api/admin-customers', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const customers = localDB.read('customers');
  const users = localDB.read('users');
  res.json({ customers: customers.map(c => ({ ...c, users: users.find(u => u.id === c.user_id) })) });
});

// ============ CUSTOMER ROUTES ============

// Get customer invoices
app.get('/api/customer-invoices', authenticate, (req, res) => {
  const customers = localDB.read('customers');
  const customer = customers.find(c => c.user_id === req.user.userId);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  const invoices = localDB.read('invoices').filter(i => i.customer_id === customer.id);
  res.json({ invoices });
});

// Get customer requests
app.get('/api/customer-requests', authenticate, (req, res) => {
  const customers = localDB.read('customers');
  const customer = customers.find(c => c.user_id === req.user.userId);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  const requests = localDB.read('requests').filter(r => r.customer_id === customer.id);
  const plans = localDB.read('plans');
  const requestsWithPlans = requests.map(r => {
    const plan = plans.find(p => p.id === r.service_plan_id);
    const service = plan ? localDB.read('services').find(s => s.id === plan.service_id) : null;
    return { ...r, service_plans: { ...plan, services: service } };
  });
  res.json({ requests: requestsWithPlans });
});

// Create service request
app.post('/api/customer-requests', authenticate, (req, res) => {
  const customers = localDB.read('customers');
  const customer = customers.find(c => c.user_id === req.user.userId);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  const { service_plan_id, title, description, priority = 'normal' } = req.body;
  
  const request = {
    id: localDB.generateId(),
    customer_id: customer.id,
    service_plan_id,
    title,
    description: description || '',
    priority,
    status: 'pending',
    created_at: new Date().toISOString()
  };
  
  const requests = localDB.read('requests');
  requests.push(request);
  localDB.write('requests', requests);
  
  res.status(201).json({ request });
});

// Get customer profile
app.get('/api/customer-profile', authenticate, (req, res) => {
  const customers = localDB.read('customers');
  const customer = customers.find(c => c.user_id === req.user.userId);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  const users = localDB.read('users');
  const user = users.find(u => u.id === req.user.userId);
  res.json({ customer: { ...customer, users: { email: user.email, first_name: user.first_name, last_name: user.last_name, phone: user.phone, company: user.company } } });
});

// Update customer profile
app.put('/api/customer-profile', authenticate, (req, res) => {
  const customers = localDB.read('customers');
  const customerIndex = customers.findIndex(c => c.user_id === req.user.userId);
  if (customerIndex === -1) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  const { company_name, billing_address, billing_city, billing_state, billing_postal_code, billing_country, first_name, last_name, phone } = req.body;
  
  customers[customerIndex] = { ...customers[customerIndex], company_name, billing_address, billing_city, billing_state, billing_postal_code, billing_country };
  localDB.write('customers', customers);
  
  const users = localDB.read('users');
  const userIndex = users.findIndex(u => u.id === req.user.userId);
  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], first_name, last_name, phone };
    localDB.write('users', users);
  }
  
  res.json({ customer: customers[customerIndex] });
});

// Serve static files after API routes
app.use(express.static('.'));

// ============ START SERVER ============
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`Trace Veil Forensics - Local Server`);
  console.log(`========================================`);
  console.log(`Server running at: http://localhost:${PORT}`);
  console.log(`\nAdmin Login:`);
  console.log(`  Email: admin@traceveilforensics.com`);
  console.log(`  Password: Admin@123`);
  console.log(`\nPress Ctrl+C to stop`);
  console.log(`========================================\n`);
});
