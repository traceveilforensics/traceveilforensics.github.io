const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = './data';

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const files = {
  users: path.join(DATA_DIR, 'users.json'),
  services: path.join(DATA_DIR, 'services.json'),
  plans: path.join(DATA_DIR, 'plans.json'),
  customers: path.join(DATA_DIR, 'customers.json'),
  invoices: path.join(DATA_DIR, 'invoices.json'),
  requests: path.join(DATA_DIR, 'requests.json')
};

// Default data
const defaults = {
  users: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@traceveilforensics.com',
      password_hash: '$2a$10$88Y2dIZauFLQtM4UlK3AxuiqnHaM6xF0Wh.b0X5MsPvYeRI8JHJjy',
      first_name: 'Admin',
      last_name: 'User',
      phone: '',
      company: '',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString()
    }
  ],
  services: [
    { id: 's1', name: 'Security Assessments', slug: 'security-assessments', description: 'Comprehensive security evaluation for your organization', icon: 'fa-shield-alt', is_active: true },
    { id: 's2', name: 'Vulnerability Scanning', slug: 'vulnerability-scanning', description: 'Systematic identification of security vulnerabilities', icon: 'fa-search', is_active: true },
    { id: 's3', name: 'Incident Response', slug: 'incident-response', description: 'Rapid response and recovery from security incidents', icon: 'fa-exclamation-triangle', is_active: true },
    { id: 's4', name: 'Digital Forensics', slug: 'digital-forensics', description: 'Digital evidence analysis and investigation', icon: 'fa-microscope', is_active: true },
    { id: 's5', name: 'IT Solutions', slug: 'it-solutions', description: 'IT infrastructure and technical support', icon: 'fa-laptop-code', is_active: true },
    { id: 's6', name: 'Training & Awareness', slug: 'training-awareness', description: 'Security education and awareness programs', icon: 'fa-graduation-cap', is_active: true }
  ],
  plans: [
    { id: 'p1', service_id: 's1', name: 'Basic Assessment', description: 'Essential security review', price: 25000, currency: 'KES', billing_cycle: 'one_time', features: ['Basic vulnerability scan', 'Network review', 'Recommendations'] },
    { id: 'p2', service_id: 's1', name: 'Professional Assessment', description: 'Complete security audit', price: 75000, currency: 'KES', billing_cycle: 'one_time', features: ['Deep analysis', 'Application review', 'Policy review', 'Detailed report'] },
    { id: 'p3', service_id: 's2', name: 'Basic Scan', description: 'Automated vulnerability scan', price: 15000, currency: 'KES', billing_cycle: 'one_time', features: ['Auto scan', 'Basic report'] },
    { id: 'p4', service_id: 's2', name: 'Advanced Scan', description: 'Full vulnerability assessment', price: 35000, currency: 'KES', billing_cycle: 'one_time', features: ['Manual + auto testing', 'Detailed report', 'Risk assessment'] },
    { id: 'p5', service_id: 's3', name: 'Basic Response', description: 'Emergency incident handling', price: 50000, currency: 'KES', billing_cycle: 'one_time', features: ['Immediate response', 'Containment', 'Basic investigation'] },
    { id: 'p6', service_id: 's3', name: 'Full Response', description: 'Complete incident management', price: 150000, currency: 'KES', billing_cycle: 'one_time', features: ['Full investigation', 'Forensic analysis', 'Recovery', 'Post-incident report'] },
    { id: 'p7', service_id: 's4', name: 'Basic Forensics', description: 'Standard investigation', price: 100000, currency: 'KES', billing_cycle: 'one_time', features: ['Evidence collection', 'Basic analysis', 'Report'] },
    { id: 'p8', service_id: 's4', name: 'Advanced Forensics', description: 'Comprehensive analysis', price: 250000, currency: 'KES', billing_cycle: 'one_time', features: ['Complete investigation', 'Expert testimony ready', 'Full documentation'] },
    { id: 'p9', service_id: 's5', name: 'Basic Support', description: 'Essential IT help', price: 15000, currency: 'KES', billing_cycle: 'monthly', features: ['Help desk', 'Basic monitoring'] },
    { id: 'p10', service_id: 's5', name: 'Enterprise Support', description: 'Full IT management', price: 75000, currency: 'KES', billing_cycle: 'monthly', features: ['24/7 support', 'Full monitoring', 'Proactive maintenance'] },
    { id: 'p11', service_id: 's6', name: 'Phishing Training', description: 'Basic phishing awareness', price: 10000, currency: 'KES', billing_cycle: 'one_time', features: ['Phishing simulation', 'Basic training'] },
    { id: 'p12', service_id: 's6', name: 'Full Security Training', description: 'Complete awareness program', price: 50000, currency: 'KES', billing_cycle: 'one_time', features: ['All security topics', 'Hands-on training', 'Certification'] }
  ],
  customers: [],
  invoices: [],
  requests: []
};

// Initialize database
function initDB() {
  Object.keys(files).forEach(key => {
    if (!fs.existsSync(files[key])) {
      fs.writeFileSync(files[key], JSON.stringify(defaults[key], null, 2));
    }
  });
}

// Read data
function read(key) {
  try {
    return JSON.parse(fs.readFileSync(files[key], 'utf8'));
  } catch (e) {
    return [];
  }
}

// Write data
function write(key, data) {
  fs.writeFileSync(files[key], JSON.stringify(data, null, 2));
}

// Generate ID
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate invoice number
function generateInvoiceNumber() {
  const invoices = read('invoices');
  const year = new Date().getFullYear();
  const count = invoices.length + 1;
  return `INV-${year}-${String(count).padStart(4, '0')}`;
}

module.exports = {
  initDB,
  read,
  write,
  generateId,
  generateInvoiceNumber,
  files
};
