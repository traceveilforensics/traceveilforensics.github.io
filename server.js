const express = require('express');
const cors = require('cors');
const compression = require('compression');
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

// Performance: Gzip compression for responses
app.use(compression());

// Security: CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Performance: Parse JSON with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request timing middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    if (req.path.startsWith('/api')) {
      console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Cache headers for static assets
const cacheHeaders = {
  '.html': 'no-cache',
  '.css': 'max-age=31536000',
  '.js': 'max-age=31536000',
  '.png': 'max-age=31536000',
  '.jpg': 'max-age=31536000',
  '.gif': 'max-age=31536000',
  '.svg': 'max-age=31536000',
  '.ico': 'max-age=31536000'
};

// Rate limiting store (simple in-memory)
const requestCounts = new Map();
const RATE_LIMIT = 100;
const RATE_WINDOW = 60000;

app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const key = `${ip}:${req.path}`;
  const now = Date.now();
  
  if (!requestCounts.has(key)) {
    requestCounts.set(key, { count: 1, resetTime: now + RATE_WINDOW });
  } else {
    const data = requestCounts.get(key);
    if (now > data.resetTime) {
      requestCounts.set(key, { count: 1, resetTime: now + RATE_WINDOW });
    } else if (data.count > RATE_LIMIT) {
      return res.status(429).json({ error: 'Too many requests' });
    } else {
      data.count++;
    }
  }
  next();
});

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

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

// ============ PUBLIC DATA ROUTES ============
// Get all pricing plans (public)
app.get('/api/public-plans', (req, res) => {
  const plans = localDB.read('plans');
  const services = localDB.read('services');
  
  const plansWithServices = plans.map(plan => {
    const service = services.find(s => s.id === plan.service_id);
    return {
      ...plan,
      service_name: service?.name || 'Other',
      service_icon: service?.icon || 'fa-cog'
    };
  });
  
  res.json({ plans: plansWithServices });
});

// Get raw JSON data (for database viewer)
app.get('/api/data/:file', (req, res) => {
  const validFiles = ['users', 'services', 'plans', 'customers', 'invoices', 'requests'];
  const file = req.params.file.replace('.json', '');
  if (!validFiles.includes(file)) {
    return res.status(400).json({ error: 'Invalid file' });
  }
  const data = localDB.read(file);
  res.json(data);
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

// Get analytics (admin)
app.get('/api/admin-analytics', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const users = localDB.read('users');
  const customers = localDB.read('customers');
  const invoices = localDB.read('invoices');
  const requests = localDB.read('requests');
  const plans = localDB.read('plans');
  const services = localDB.read('services');
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const newUsersLast30Days = users.filter(u => new Date(u.created_at) > thirtyDaysAgo).length;
  
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + parseFloat(i.total || 0), 0);
  
  const requestsByStatus = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  
  const topServices = services.map(s => {
    const servicePlans = plans.filter(p => p.service_id === s.id);
    const serviceRequests = requests.filter(r => servicePlans.some(p => p.id === r.service_plan_id));
    return { name: s.name, count: serviceRequests.length };
  }).sort((a, b) => b.count - a.count).slice(0, 5);
  
  const monthlyRevenue = [];
  const monthlyCustomerGrowth = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthName = date.toLocaleString('default', { month: 'short' });
    
    const monthInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.created_at);
      return invDate >= date && invDate < nextMonth && inv.status === 'paid';
    });
    const monthRevenue = monthInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);
    monthlyRevenue.push({ month: monthName, revenue: monthRevenue });
    
    const monthCustomers = customers.filter(c => {
      const custDate = new Date(c.created_at);
      return custDate >= date && custDate < nextMonth;
    }).length;
    monthlyCustomerGrowth.push({ month: monthName, count: monthCustomers });
  }
  
  res.json({
    summary: {
      totalUsers: users.length,
      totalCustomers: customers.length,
      newUsersLast30Days,
      totalRequests: requests.length,
      totalRevenue,
      totalInvoices: invoices.length,
      totalServices: services.length,
      totalPlans: plans.length
    },
    charts: {
      monthlyRevenue,
      customerGrowth: monthlyCustomerGrowth,
      requestsByStatus,
      topServices
    }
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

// Update invoice (admin)
app.put('/api/admin-invoices/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { customer_id, items, issue_date, due_date, notes, discount_amount = 0, tax_rate = 16, status } = req.body;
  const invoices = localDB.read('invoices');
  const idx = invoices.findIndex(inv => inv.id === req.params.id);
  
  if (idx === -1) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  const subtotal = items ? items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) : invoices[idx].subtotal;
  const tax_amount = items ? (subtotal - discount_amount) * (tax_rate / 100) : invoices[idx].tax_amount;
  const total = items ? subtotal - discount_amount + tax_amount : invoices[idx].total;
  
  invoices[idx] = {
    ...invoices[idx],
    customer_id: customer_id || invoices[idx].customer_id,
    issue_date: issue_date || invoices[idx].issue_date,
    due_date: due_date || invoices[idx].due_date,
    subtotal,
    tax_rate,
    tax_amount,
    discount_amount,
    total,
    notes: notes !== undefined ? notes : invoices[idx].notes,
    status: status || invoices[idx].status,
    updated_at: new Date().toISOString()
  };
  
  localDB.write('invoices', invoices);
  res.json({ invoice: invoices[idx] });
});

// Delete invoice (admin)
app.delete('/api/admin-invoices/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  let invoices = localDB.read('invoices');
  const idx = invoices.findIndex(inv => inv.id === req.params.id);
  
  if (idx === -1) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  invoices.splice(idx, 1);
  localDB.write('invoices', invoices);
  
  res.json({ success: true });
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

// Get all service requests (Admin)
app.get('/api/admin-requests', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const requests = localDB.read('requests');
  const customers = localDB.read('customers');
  const users = localDB.read('users');
  const plans = localDB.read('plans');
  const services = localDB.read('services');

  const requestsWithDetails = requests.map(r => {
    const customer = customers.find(c => c.id === r.customer_id);
    const user = customer ? users.find(u => u.id === customer.user_id) : null;
    const plan = plans.find(p => p.id === r.service_plan_id);
    const service = plan ? services.find(s => s.id === plan.service_id) : null;
    return {
      ...r,
      customers: { ...customer, users: user },
      service_plans: { ...plan, services: service }
    };
  });

  res.json({ requests: requestsWithDetails });
});

// Get activity logs (Admin)
app.get('/api/admin-activity', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const logs = localDB.read('activity_logs') || [];
  const sortedLogs = logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  res.json({ 
    logs: sortedLogs,
    total: sortedLogs.length,
    passwordResets: sortedLogs.filter(l => l.type === 'password_reset' || l.type === 'reset_code_generated').length
  });
});

// Update request status (Admin)
app.put('/api/admin-requests/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const { status, admin_notes } = req.body;
  const requests = localDB.read('requests');
  const idx = requests.findIndex(r => r.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Request not found' });
  }
  requests[idx] = { ...requests[idx], status, admin_notes, updated_at: new Date().toISOString() };
  localDB.write('requests', requests);
  res.json({ success: true, request: requests[idx] });
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

// Update service request status (customer)
app.put('/api/customer-requests/:id', authenticate, (req, res) => {
  const customers = localDB.read('customers');
  const customer = customers.find(c => c.user_id === req.user.userId);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  const requests = localDB.read('requests');
  const idx = requests.findIndex(r => r.id === req.params.id && r.customer_id === customer.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Request not found' });
  }
  
  const { status } = req.body;
  requests[idx] = { ...requests[idx], status, updated_at: new Date().toISOString() };
  localDB.write('requests', requests);
  res.json({ success: true, request: requests[idx] });
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

// Get admin settings
app.get('/api/admin-settings', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const settings = localDB.read('settings');
  const adminSettings = settings.find(s => s.key === 'admin_settings');
  
  if (adminSettings) {
    res.json({ settings: adminSettings.data });
  } else {
    // Default settings
    res.json({
      settings: {
        siteName: 'Trace Veil Forensics',
        supportEmail: 'traceveilforensics@gmail.com',
        phone: '+254 731 570 131',
        address: 'Kenya, East Africa',
        invoicePrefix: 'TVF-',
        invoiceDueDays: 30,
        currency: 'KES',
        taxRate: 0,
        emailNotifications: true,
        invoiceReminders: true,
        registrationEnabled: true,
        maintenanceMode: false,
        social: {
          facebook: 'https://www.facebook.com/profiles/61586541184898',
          twitter: 'https://x.com/trace_veil98613',
          instagram: 'https://www.instagram.com/traceveilforensics',
          linkedin: 'https://www.linkedin.com/in/traceveilforensics'
        }
      }
    });
  }
});

// Save admin settings
app.post('/api/admin-settings', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { section, data } = req.body;
  
  let settings = localDB.read('settings');
  let adminSettings = settings.find(s => s.key === 'admin_settings');
  
  if (!adminSettings) {
    adminSettings = { key: 'admin_settings', data: {} };
    settings.push(adminSettings);
  }
  
  adminSettings.data = { ...adminSettings.data, ...data };
  localDB.write('settings', settings);
  
  res.json({ success: true });
});

// ============ REVIEWS ============

// Create review (customer)
app.post('/api/customer-reviews', authenticate, (req, res) => {
  const customers = localDB.read('customers');
  const customer = customers.find(c => c.user_id === req.user.userId);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  const { request_id, rating, title, comment } = req.body;
  
  if (!request_id || !rating || !comment) {
    return res.status(400).json({ error: 'Request ID, rating, and comment are required' });
  }
  
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }
  
  // Check if request exists and belongs to customer
  const requests = localDB.read('requests');
  const request = requests.find(r => r.id === request_id && r.customer_id === customer.id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }
  
  // Check if request is completed
  if (request.status !== 'completed') {
    return res.status(400).json({ error: 'You can only review completed requests' });
  }
  
  // Check if already reviewed
  const existingReviews = localDB.read('reviews');
  if (existingReviews.find(r => r.request_id === request_id)) {
    return res.status(400).json({ error: 'You have already reviewed this request' });
  }
  
  const review = {
    id: localDB.generateId(),
    customer_id: customer.id,
    request_id,
    rating: parseInt(rating),
    title: title || '',
    comment,
    is_approved: false,
    created_at: new Date().toISOString()
  };
  
  existingReviews.push(review);
  localDB.write('reviews', existingReviews);
  
  res.status(201).json({ review });
});

// Get customer's reviews
app.get('/api/customer-reviews', authenticate, (req, res) => {
  const customers = localDB.read('customers');
  const customer = customers.find(c => c.user_id === req.user.userId);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  const reviews = localDB.read('reviews').filter(r => r.customer_id === customer.id);
  const requests = localDB.read('requests');
  const plans = localDB.read('plans');
  const services = localDB.read('services');
  
  const reviewsWithDetails = reviews.map(r => {
    const request = requests.find(req => req.id === r.request_id);
    const plan = request ? plans.find(p => p.id === request.service_plan_id) : null;
    const service = plan ? services.find(s => s.id === plan.service_id) : null;
    return {
      ...r,
      request,
      service_name: service?.name || plan?.name || 'Service'
    };
  });
  
  res.json({ reviews: reviewsWithDetails });
});

// Get public reviews (approved only)
app.get('/api/public-reviews', (req, res) => {
  const reviews = localDB.read('reviews').filter(r => r.is_approved);
  const customers = localDB.read('customers');
  const users = localDB.read('users');
  const requests = localDB.read('requests');
  const plans = localDB.read('plans');
  const services = localDB.read('services');
  
  const reviewsWithDetails = reviews.map(r => {
    const customer = customers.find(c => c.id === r.customer_id);
    const user = customer ? users.find(u => u.id === customer.user_id) : null;
    const request = requests.find(req => req.id === r.request_id);
    const plan = request ? plans.find(p => p.id === request.service_plan_id) : null;
    const service = plan ? services.find(s => s.id === plan.service_id) : null;
    return {
      ...r,
      customer_name: user ? `${user.first_name} ${user.last_name}` : 'Anonymous',
      service_name: service?.name || plan?.name || 'Service'
    };
  });
  
  res.json({ reviews: reviewsWithDetails });
});

// Get all reviews (admin)
app.get('/api/admin-reviews', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const reviews = localDB.read('reviews');
  const customers = localDB.read('customers');
  const users = localDB.read('users');
  const requests = localDB.read('requests');
  const plans = localDB.read('plans');
  const services = localDB.read('services');
  
  const reviewsWithDetails = reviews.map(r => {
    const customer = customers.find(c => c.id === r.customer_id);
    const user = customer ? users.find(u => u.id === customer.user_id) : null;
    const request = requests.find(req => req.id === r.request_id);
    const plan = request ? plans.find(p => p.id === request.service_plan_id) : null;
    const service = plan ? services.find(s => s.id === plan.service_id) : null;
    return {
      ...r,
      customer: customer ? { ...customer, users: user } : null,
      request,
      service_plans: { ...plan, services: service }
    };
  });
  
  res.json({ reviews: reviewsWithDetails });
});

// Update review status (admin)
app.put('/api/admin-reviews/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { is_approved } = req.body;
  const reviews = localDB.read('reviews');
  const idx = reviews.findIndex(r => r.id === req.params.id);
  
  if (idx === -1) {
    return res.status(404).json({ error: 'Review not found' });
  }
  
  reviews[idx] = { ...reviews[idx], is_approved, updated_at: new Date().toISOString() };
  localDB.write('reviews', reviews);
  
  res.json({ review: reviews[idx] });
});

// Delete review (admin)
app.delete('/api/admin-reviews/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  let reviews = localDB.read('reviews');
  const idx = reviews.findIndex(r => r.id === req.params.id);
  
  if (idx === -1) {
    return res.status(404).json({ error: 'Review not found' });
  }
  
  reviews.splice(idx, 1);
  localDB.write('reviews', reviews);
  
  res.json({ success: true });
});

// ============ PASSWORD RESET ============
app.post('/api/verify-reset-code', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'All fields required' });
    }
    
    const passwordResets = localDB.read('password_resets') || [];
    const resetRecord = passwordResets.find(pr => 
      pr.email === email.toLowerCase() && 
      pr.code === code &&
      new Date(pr.expires_at) > new Date()
    );
    
    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }
    
    // Update password
    const users = localDB.read('users');
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = users[userIndex];
    
    // SECURITY: Ensure role is preserved (prevent privilege escalation)
    const originalRole = user.role;
    
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);
    
    users[userIndex].password_hash = password_hash;
    users[userIndex].updated_at = new Date().toISOString();
    // Ensure role remains unchanged
    users[userIndex].role = originalRole;
    localDB.write('users', users);
    
    // Clean up used code
    const updatedResets = passwordResets.filter(pr => pr.email !== email.toLowerCase());
    localDB.write('password_resets', updatedResets);
    
    // Log the password reset for admin audit trail
    const activityLogs = localDB.read('activity_logs') || [];
    activityLogs.push({
      id: localDB.generateId(),
      type: 'password_reset',
      user_id: user.id,
      user_email: user.email,
      user_role: originalRole,
      details: `Password reset completed via admin-generated code. Role preserved: ${originalRole}`,
      ip_address: req.ip || req.connection?.remoteAddress || 'unknown',
      created_at: new Date().toISOString()
    });
    localDB.write('activity_logs', activityLogs);
    
    // Log to console for admin visibility (in development)
    console.log('\n=== PASSWORD RESET NOTIFICATION ===');
    console.log(`Date: ${new Date().toISOString()}`);
    console.log(`User: ${user.email}`);
    console.log(`Role: ${originalRole}`);
    console.log(`IP: ${req.ip || 'unknown'}`);
    console.log('==================================\n');
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Error resetting password' });
  }
});

// Generate reset code (admin only - admin sends code manually to user)
app.post('/api/admin/generate-reset-code', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  const users = localDB.read('users');
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
  
  // Store reset code
  let passwordResets = localDB.read('password_resets') || [];
  passwordResets = passwordResets.filter(pr => pr.email !== email.toLowerCase());
  passwordResets.push({
    email: email.toLowerCase(),
    code,
    expires_at: expiry,
    generated_by: req.user.userId,
    generated_at: new Date().toISOString()
  });
  localDB.write('password_resets', passwordResets);
  
  // Log code generation
  const activityLogs = localDB.read('activity_logs') || [];
  activityLogs.push({
    id: localDB.generateId(),
    type: 'reset_code_generated',
    admin_id: req.user.userId,
    target_user_id: user.id,
    target_email: user.email,
    target_role: user.role,
    details: `Admin ${req.user.userId} generated password reset code for ${user.email} (${user.role})`,
    ip_address: req.ip || 'unknown',
    created_at: new Date().toISOString()
  });
  localDB.write('activity_logs', activityLogs);
  
  // Console notification for admin
  console.log('\n=== PASSWORD RESET CODE GENERATED ===');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Admin: ${req.user.userId}`);
  console.log(`Target User: ${user.email}`);
  console.log(`Target Role: ${user.role}`);
  console.log(`Code: ${code}`);
  console.log(`Expires: ${expiry}`);
  console.log('=====================================\n');
  
  res.json({ 
    success: true, 
    code,
    message: 'Reset code generated. Share this code with the user securely.',
    userRole: user.role,
    warning: 'User role: ' + user.role + '. Customer resets cannot become admins.'
  });
});

// Static file serving with caching
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const cacheControl = {
  '.html': 'no-cache, no-store, must-revalidate',
  '.js': 'public, max-age=31536000',
  '.css': 'public, max-age=31536000',
  '.png': 'public, max-age=31536000',
  '.jpg': 'public, max-age=31536000',
  '.gif': 'public, max-age=31536000',
  '.svg': 'public, max-age=31536000',
  '.ico': 'public, max-age=31536000',
  '.json': 'no-cache'
};

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  
  let filePath = req.path === '/' ? 'index.html' : req.path;
  filePath = path.join(__dirname, filePath);
  const ext = path.extname(filePath).toLowerCase();
  
  if (mimeTypes[ext] && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.setHeader('Content-Type', mimeTypes[ext]);
    res.setHeader('Cache-Control', cacheControl[ext] || 'public, max-age=3600');
    res.sendFile(filePath);
  } else {
    next();
  }
});

// API 404 handler
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// SPA fallback - must be last
app.get(/.*/, (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Start server
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
