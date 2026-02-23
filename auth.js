// Real users only - no demo users

const REGISTERED_USERS_KEY = 'registered_users';
const CUSTOMERS_KEY = 'admin_customers';
const SERVICES_KEY = 'admin_services';
const PRICING_KEY = 'admin_pricing';
const INVOICES_KEY = 'admin_invoices';
const SERVICE_REQUESTS_KEY = 'admin_service_requests';

// Initialize default customers
function initializeDefaultCustomers() {
    let customers = JSON.parse(localStorage.getItem(CUSTOMERS_KEY) || '[]');
    
    // Add admin user if not exists
    const users = getRegisteredUsers();
    if (!users['admin@traceveilforensics.com']) {
        users['admin@traceveilforensics.com'] = {
            id: 1,
            email: 'admin@traceveilforensics.com',
            password: 'admin123',
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin',
            phone: '+254731570131',
            created_at: '2025-01-01'
        };
        saveRegisteredUsers(users);
    }
    
    // Add default customers if none exist
    if (customers.length === 0) {
        customers = [
            { id: 1, email: 'customer@traceveilforensics.com', first_name: 'John', last_name: 'Doe', phone: '+254700000001', created_at: '2025-01-01' },
            { id: 2, email: 'test@test.com', first_name: 'Test', last_name: 'User', phone: '+254700000002', created_at: '2025-01-15' },
            { id: 3, email: 'ariesgemini1st@gmail.com', first_name: 'Gemini', last_name: 'Aries', phone: '+254700000003', created_at: '2025-01-20' }
        ];
    }
    
    // Check if ariesgemini1st@gmail.com exists, if not add it
    const emails = customers.map(c => c.email.toLowerCase());
    if (!emails.includes('ariesgemini1st@gmail.com')) {
        customers.push({ id: Date.now(), email: 'ariesgemini1st@gmail.com', first_name: 'Gemini', last_name: 'Aries', phone: '+254700000003', created_at: new Date().toISOString() });
    }
    
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
}

// Initialize default data
function initializeDefaultData() {
    initializeDefaultCustomers();
    
    // Default services
    if (!localStorage.getItem(SERVICES_KEY)) {
        const defaultServices = [
            { id: 1, name: 'Security Assessments', slug: 'security-assessments', icon: 'fa-shield-alt', description: 'Comprehensive security assessments to identify vulnerabilities', active: true, order: 1 },
            { id: 2, name: 'Vulnerability Scanning', slug: 'vulnerability-scanning', icon: 'fa-search', description: 'Automated vulnerability scanning and analysis', active: true, order: 2 },
            { id: 3, name: 'Incident Response', slug: 'incident-response', icon: 'fa-exclamation-triangle', description: '24/7 incident response and emergency support', active: true, order: 3 },
            { id: 4, name: 'Digital Forensics', slug: 'digital-forensics', icon: 'fa-microscope', description: 'Digital forensics investigation and evidence collection', active: true, order: 4 },
            { id: 5, name: 'IT Solutions', slug: 'it-solutions', icon: 'fa-laptop-code', description: 'Custom IT solutions and infrastructure management', active: true, order: 5 },
            { id: 6, name: 'Training & Awareness', slug: 'training-awareness', icon: 'fa-graduation-cap', description: 'Security training and awareness programs', active: true, order: 6 }
        ];
        localStorage.setItem(SERVICES_KEY, JSON.stringify(defaultServices));
    }

    // Default pricing plans
    if (!localStorage.getItem(PRICING_KEY)) {
        const defaultPricing = [
            { id: 1, service_id: 1, name: 'Basic', price: 15000, billing_cycle: 'one_time', description: 'Entry-level security assessment', features: ['Vulnerability Scan', 'Basic Report', 'Email Support'], active: true },
            { id: 2, service_id: 1, name: 'Professional', price: 35000, billing_cycle: 'one_time', description: 'Comprehensive security audit', features: ['Full Assessment', 'Detailed Report', 'Phone Support', 'Remediation Plan'], active: true },
            { id: 3, service_id: 1, name: 'Enterprise', price: 75000, billing_cycle: 'one_time', description: 'Enterprise security solution', features: ['Complete Audit', 'Executive Report', '24/7 Support', 'On-site Visit', 'Yearly Review'], active: true },
            { id: 4, service_id: 2, name: 'Starter', price: 5000, billing_cycle: 'monthly', description: 'Monthly vulnerability scanning', features: ['Weekly Scans', 'Email Alerts', 'Basic Report'], active: true },
            { id: 5, service_id: 2, name: 'Professional', price: 15000, billing_cycle: 'monthly', description: 'Advanced scanning solution', features: ['Daily Scans', 'Real-time Alerts', 'Detailed Report', 'Priority Support'], active: true },
            { id: 6, service_id: 3, name: 'Standard', price: 25000, billing_cycle: 'one_time', description: 'Incident response package', features: ['24/7 Response', 'Remote Support', 'Initial Analysis'], active: true },
            { id: 7, service_id: 3, name: 'Premium', price: 50000, billing_cycle: 'one_time', description: 'Full incident response', features: ['24/7 Response', 'On-site Support', 'Full Investigation', 'Legal Support'], active: true },
            { id: 8, service_id: 4, name: 'Basic', price: 20000, billing_cycle: 'one_time', description: 'Standard forensics analysis', features: ['Evidence Collection', 'Basic Report', '30-day Retention'], active: true },
            { id: 9, service_id: 5, name: 'Basic', price: 10000, billing_cycle: 'monthly', description: 'Basic IT support', features: ['Remote Support', '9-5 Hours', 'Basic Maintenance'], active: true },
            { id: 10, service_id: 6, name: 'Workshop', price: 15000, billing_cycle: 'one_time', description: 'Security awareness workshop', features: ['2-hour Session', 'Up to 20 Staff', 'Materials Included'], active: true }
        ];
        localStorage.setItem(PRICING_KEY, JSON.stringify(defaultPricing));
    }

    // Default invoices
    if (!localStorage.getItem(INVOICES_KEY)) {
        const defaultInvoices = [
            { id: 1, invoice_number: 'INV-001', customer_id: 2, customer_name: 'John Doe', customer_email: 'customer@traceveilforensics.com', items: [{ description: 'Security Assessment - Professional', quantity: 1, unit_price: 35000, total: 35000 }], subtotal: 35000, tax: 0, total: 35000, status: 'paid', created_date: '2025-01-15', due_date: '2025-02-15', paid_date: '2025-01-20' },
            { id: 2, invoice_number: 'INV-002', customer_id: 3, customer_name: 'Test User', customer_email: 'test@test.com', items: [{ description: 'Vulnerability Scanning - Professional', quantity: 1, unit_price: 15000, total: 15000 }], subtotal: 15000, tax: 0, total: 15000, status: 'pending', created_date: '2025-01-20', due_date: '2025-02-20', paid_date: null },
            { id: 3, invoice_number: 'INV-003', customer_id: 2, customer_name: 'Jane Smith', customer_email: 'jane@example.com', items: [{ description: 'Incident Response - Premium', quantity: 1, unit_price: 50000, total: 50000 }], subtotal: 50000, tax: 0, total: 50000, status: 'overdue', created_date: '2024-12-01', due_date: '2025-01-01', paid_date: null },
            { id: 4, invoice_number: 'INV-004', customer_id: 3, customer_name: 'Test User', customer_email: 'test@test.com', items: [{ description: 'Training - Workshop', quantity: 1, unit_price: 15000, total: 15000 }], subtotal: 15000, tax: 0, total: 15000, status: 'sent', created_date: '2025-01-25', due_date: '2025-02-25', paid_date: null },
            { id: 5, invoice_number: 'INV-005', customer_id: 2, customer_name: 'John Doe', customer_email: 'customer@traceveilforensics.com', items: [{ description: 'IT Solutions - Basic (Monthly)', quantity: 3, unit_price: 10000, total: 30000 }], subtotal: 30000, tax: 0, total: 30000, status: 'paid', created_date: '2025-01-01', due_date: '2025-01-31', paid_date: '2025-01-05' }
        ];
        localStorage.setItem(INVOICES_KEY, JSON.stringify(defaultInvoices));
    }

    // Default service requests
    if (!localStorage.getItem(SERVICE_REQUESTS_KEY)) {
        const defaultRequests = [
            { id: 1, customer_id: 2, customer_name: 'John Doe', customer_email: 'customer@traceveilforensics.com', customer_phone: '+254700000001', service_id: 1, service_name: 'Security Assessments', plan_name: 'Professional', status: 'completed', priority: 'high', notes: 'Need comprehensive security audit for company network', created_date: '2025-01-10', completed_date: '2025-01-20' },
            { id: 2, customer_id: 3, customer_name: 'Test User', customer_email: 'test@test.com', customer_phone: '+254700000002', service_id: 2, service_name: 'Vulnerability Scanning', plan_name: 'Professional', status: 'in_progress', priority: 'medium', notes: 'Weekly vulnerability reports needed', created_date: '2025-01-22', completed_date: null },
            { id: 3, customer_id: 2, customer_name: 'Jane Smith', customer_email: 'jane@example.com', customer_phone: '+254700000003', service_id: 3, service_name: 'Incident Response', plan_name: 'Premium', status: 'pending', priority: 'urgent', notes: 'Suspected security breach - need immediate assistance', created_date: '2025-01-26', completed_date: null },
            { id: 4, customer_id: 3, customer_name: 'Mike Johnson', customer_email: 'mike@example.com', customer_phone: '+254700000004', service_id: 6, service_name: 'Training & Awareness', plan_name: 'Workshop', status: 'pending', priority: 'low', notes: 'Schedule training for IT team', created_date: '2025-01-25', completed_date: null },
            { id: 5, customer_id: 2, customer_name: 'John Doe', customer_email: 'customer@traceveilforensics.com', customer_phone: '+254700000001', service_id: 4, service_name: 'Digital Forensics', plan_name: 'Basic', status: 'cancelled', priority: 'medium', notes: 'Client decided to postpone', created_date: '2025-01-05', completed_date: '2025-01-10' }
        ];
        localStorage.setItem(SERVICE_REQUESTS_KEY, JSON.stringify(defaultRequests));
    }
}

// Initialize on load
initializeDefaultData();

// Get registered users from localStorage
function getRegisteredUsers() {
    const users = localStorage.getItem(REGISTERED_USERS_KEY);
    return users ? JSON.parse(users) : {};
}

// Save registered users to localStorage
function saveRegisteredUsers(users) {
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
}

// Register a new user
function registerUser(userData) {
    const users = getRegisteredUsers();
    
    if (users[userData.email]) {
        return { success: false, error: 'Email already registered' };
    }
    
    const newUser = {
        id: Date.now(),
        email: userData.email,
        password: userData.password,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone || '',
        role: 'customer',
        created_at: new Date().toISOString()
    };
    
    users[userData.email] = newUser;
    saveRegisteredUsers(users);
    
    // Also add to customers
    const customers = getCustomers();
    customers.push({
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        phone: newUser.phone,
        created_at: newUser.created_at
    });
    saveCustomers(customers);
    
    const { password, ...userWithoutPassword } = newUser;
    return { success: true, user: userWithoutPassword };
}

// Login function
function login(email, password) {
    const users = getRegisteredUsers();
    
    // Check registered_users first (case-insensitive)
    const userEmail = Object.keys(users).find(key => key.toLowerCase() === email.toLowerCase());
    if (userEmail && users[userEmail].password === password) {
        const { password: _, ...userWithoutPassword } = users[userEmail];
        return { success: true, user: userWithoutPassword };
    }
    
    // Also check customers (for customers added via admin)
    const customers = getCustomers();
    const customer = customers.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (customer && customer.password === password) {
        const { password: _, ...customerWithoutPassword } = customer;
        return { success: true, user: { ...customerWithoutPassword, role: 'customer' } };
    }
    
    return { success: false, error: 'Invalid email or password' };
}

// Store auth token and user
function setAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('loginTime', Date.now());
}

// Clear auth
function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
}

// Check if user is logged in
function isAuthenticated() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    return !!(token && userStr);
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Generate random token
function generateToken() {
    return 'tvf_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// ============ ADMIN DATA FUNCTIONS ============

// Get all customers (excludes deleted by default)
function getCustomers(includeDeleted = false) {
    let data = localStorage.getItem(CUSTOMERS_KEY);
    if (!data) {
        initializeDefaultData();
        data = localStorage.getItem(CUSTOMERS_KEY);
    }
    try {
        let customers = JSON.parse(data || '[]');
        
        // Filter out deleted customers unless explicitly requested
        if (!includeDeleted) {
            customers = customers.filter(c => c.deleted !== true);
        }
        
        // Also check old registered users and migrate if needed
        const oldUsers = localStorage.getItem(REGISTERED_USERS_KEY);
        if (oldUsers) {
            const users = JSON.parse(oldUsers);
            const oldCustomers = Object.values(users).map(u => ({
                id: u.id,
                email: u.email,
                first_name: u.first_name,
                last_name: u.last_name,
                phone: u.phone || '',
                created_at: u.created_at || new Date().toISOString()
            }));
            
            // Merge old customers not already in customers
            const existingEmails = customers.map(c => c.email);
            oldCustomers.forEach(c => {
                if (!existingEmails.includes(c.email)) {
                    customers.push(c);
                }
            });
            
            // Save merged data
            if (oldCustomers.length > 0) {
                localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
            }
        }
        
        return customers;
    } catch (e) {
        return [];
    }
}

// Save customers
function saveCustomers(customers) {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
}

// Get all services
function getServices() {
    let data = localStorage.getItem(SERVICES_KEY);
    if (!data) {
        initializeDefaultData();
        data = localStorage.getItem(SERVICES_KEY);
    }
    try {
        return JSON.parse(data || '[]');
    } catch (e) {
        return [];
    }
}

// Save services
function saveServices(services) {
    localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
}

// Get all pricing plans
function getPricing() {
    let data = localStorage.getItem(PRICING_KEY);
    if (!data) {
        initializeDefaultData();
        data = localStorage.getItem(PRICING_KEY);
    }
    try {
        return JSON.parse(data || '[]');
    } catch (e) {
        return [];
    }
}

// Save pricing
function savePricing(pricing) {
    localStorage.setItem(PRICING_KEY, JSON.stringify(pricing));
}

// Get all invoices
function getInvoices() {
    let data = localStorage.getItem(INVOICES_KEY);
    if (!data) {
        initializeDefaultData();
        data = localStorage.getItem(INVOICES_KEY);
    }
    try {
        return JSON.parse(data || '[]');
    } catch (e) {
        return [];
    }
}

// Save invoices
function saveInvoices(invoices) {
    localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
}

// Generate invoice number
function generateInvoiceNumber() {
    const invoices = getInvoices();
    const num = invoices.length + 1;
    return 'INV-' + String(num).padStart(3, '0');
}

// Get all service requests
function getServiceRequests() {
    let data = localStorage.getItem(SERVICE_REQUESTS_KEY);
    if (!data) {
        initializeDefaultData();
        data = localStorage.getItem(SERVICE_REQUESTS_KEY);
    }
    try {
        return JSON.parse(data || '[]');
    } catch (e) {
        return [];
    }
}

// Save service requests
function saveServiceRequests(requests) {
    localStorage.setItem(SERVICE_REQUESTS_KEY, JSON.stringify(requests));
}

// Get dashboard stats
function getDashboardStats() {
    const invoices = getInvoices();
    const requests = getServiceRequests();
    const customers = getCustomers();
    
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
    const pendingAmount = invoices.filter(i => i.status === 'pending' || i.status === 'sent').reduce((sum, i) => sum + i.total, 0);
    const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total, 0);
    
    return {
        totalCustomers: customers.length,
        totalRevenue,
        pendingAmount,
        overdueAmount,
        paidInvoices: invoices.filter(i => i.status === 'paid').length,
        pendingInvoices: invoices.filter(i => i.status === 'pending' || i.status === 'sent').length,
        overdueInvoices: invoices.filter(i => i.status === 'overdue').length,
        totalInvoices: invoices.length,
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => r.status === 'pending').length,
        completedRequests: requests.filter(r => r.status === 'completed').length
    };
}

// ============ PASSWORD RESET SYSTEM ============
const PASSWORD_RESET_KEY = 'password_reset_codes';
const ADMIN_NOTIFICATIONS_KEY = 'admin_notifications';

function getPasswordResetCodes() {
    return JSON.parse(localStorage.getItem(PASSWORD_RESET_KEY) || '{}');
}

function savePasswordResetCodes(codes) {
    localStorage.setItem(PASSWORD_RESET_KEY, JSON.stringify(codes));
}

function generateResetCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function requestPasswordReset(email) {
    const users = getRegisteredUsers();
    const customers = getCustomers();
    const normalizedEmail = email.toLowerCase();
    
    // Check registered_users (case-insensitive)
    const userEmail = Object.keys(users).find(key => key.toLowerCase() === normalizedEmail);
    const customer = customers.find(c => c.email.toLowerCase() === normalizedEmail);
    
    // User must exist in either registered_users OR customers
    const user = userEmail ? users[userEmail] : customer;
    
    if (!user) {
        return { success: false, error: 'Email not found. Please contact admin to create an account.' };
    }
    
    // If user is only in registered_users (self-registered), allow password reset
    // If user is in customers, they must be an active customer (not deleted)
    if (!userEmail && customer) {
        // Check if customer was marked as deleted
        if (customer.deleted === true) {
            return { success: false, error: 'This account has been deactivated. Please contact admin.' };
        }
    }
    
    const codes = getPasswordResetCodes();
    const resetCode = generateResetCode();
    const expires = Date.now() + (30 * 60 * 1000); // 30 minutes
    
    // Store with lowercase email key
    codes[normalizedEmail] = {
        code: resetCode,
        expires: expires,
        used: false,
        originalEmail: email
    };
    savePasswordResetCodes(codes);
    
    // Send email notification
    sendPasswordResetEmail(email, resetCode);
    
    return { success: true, message: 'Reset code sent to your email' };
}

function verifyResetCode(email, code) {
    const codes = getPasswordResetCodes();
    
    // Find the email key in codes (case-insensitive)
    const codeEmail = Object.keys(codes).find(key => key.toLowerCase() === email.toLowerCase());
    const resetData = codes[codeEmail];
    
    if (!resetData) {
        return { valid: false, error: 'Invalid reset request' };
    }
    
    if (resetData.used) {
        return { valid: false, error: 'Code already used' };
    }
    
    if (Date.now() > resetData.expires) {
        return { valid: false, error: 'Code expired' };
    }
    
    if (resetData.code !== code) {
        return { valid: false, error: 'Invalid code' };
    }
    
    return { valid: true };
}

function resetPassword(email, newPassword) {
    const users = getRegisteredUsers();
    const customers = getCustomers();
    const codes = getPasswordResetCodes();
    
    // Find the email key in codes (case-insensitive)
    const codeEmail = Object.keys(codes).find(key => key.toLowerCase() === email.toLowerCase());
    const resetData = codes[codeEmail];
    
    if (!resetData || resetData.used || Date.now() > resetData.expires) {
        return { success: false, error: 'Invalid or expired reset request' };
    }
    
    // Check registered_users (case-insensitive)
    const userEmail = Object.keys(users).find(key => key.toLowerCase() === email.toLowerCase());
    if (userEmail) {
        users[userEmail].password = newPassword;
        saveRegisteredUsers(users);
    } else {
        // Update customer password
        const custIndex = customers.findIndex(c => c.email.toLowerCase() === email.toLowerCase());
        if (custIndex !== -1) {
            customers[custIndex].password = newPassword;
            saveCustomers(customers);
        } else {
            return { success: false, error: 'User not found' };
        }
    }
    
    codes[codeEmail].used = true;
    savePasswordResetCodes(codes);
    
    // Notify admin of password change
    notifyAdminPasswordChange(email);
    
    return { success: true, message: 'Password reset successfully' };
}

// ============ EMAIL NOTIFICATION SYSTEM ============
// Using EmailJS - configure with your EmailJS service ID, template ID, and public key
const EMAILJS_CONFIG = {
    serviceId: 'YOUR_SERVICE_ID', // Replace with your EmailJS service ID
    templateId: 'YOUR_TEMPLATE_ID', // Replace with your EmailJS template ID
    publicKey: 'YOUR_PUBLIC_KEY' // Replace with your EmailJS public key
};

function sendPasswordResetEmail(email, code) {
    // Store notification for admin dashboard
    const notifications = JSON.parse(localStorage.getItem(ADMIN_NOTIFICATIONS_KEY) || '[]');
    notifications.unshift({
        id: Date.now(),
        type: 'password_reset',
        email: email,
        message: `Password reset requested for ${email}. Code: ${code}`,
        timestamp: new Date().toISOString(),
        read: false
    });
    localStorage.setItem(ADMIN_NOTIFICATIONS_KEY, JSON.stringify(notifications.slice(0, 50)));
    
    // Try to send via EmailJS if configured
    if (EMAILJS_CONFIG.serviceId !== 'YOUR_SERVICE_ID' && window.emailjs) {
        window.emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
            to_email: email,
            reset_code: code,
            company_name: 'Trace Veil Forensics'
        }).catch(err => console.log('EmailJS error:', err));
    }
}

function notifyAdminPasswordChange(email) {
    const notifications = JSON.parse(localStorage.getItem(ADMIN_NOTIFICATIONS_KEY) || '[]');
    notifications.unshift({
        id: Date.now(),
        type: 'password_changed',
        email: email,
        message: `Password changed for ${email}`,
        timestamp: new Date().toISOString(),
        read: false
    });
    localStorage.setItem(ADMIN_NOTIFICATIONS_KEY, JSON.stringify(notifications.slice(0, 50)));
}

function notifyAdminEmailChange(oldEmail, newEmail) {
    const notifications = JSON.parse(localStorage.getItem(ADMIN_NOTIFICATIONS_KEY) || '[]');
    notifications.unshift({
        id: Date.now(),
        type: 'email_changed',
        old_email: oldEmail,
        new_email: newEmail,
        message: `Email change requested: ${oldEmail} → ${newEmail}`,
        timestamp: new Date().toISOString(),
        read: false
    });
    localStorage.setItem(ADMIN_NOTIFICATIONS_KEY, JSON.stringify(notifications.slice(0, 50)));
}

function getAdminNotifications() {
    return JSON.parse(localStorage.getItem(ADMIN_NOTIFICATIONS_KEY) || '[]');
}

function markNotificationRead(id) {
    const notifications = getAdminNotifications();
    const notif = notifications.find(n => n.id === id);
    if (notif) {
        notif.read = true;
        localStorage.setItem(ADMIN_NOTIFICATIONS_KEY, JSON.stringify(notifications));
    }
}

function clearNotifications() {
    localStorage.setItem(ADMIN_NOTIFICATIONS_KEY, '[]');
}

// ============ CUSTOMER MANAGEMENT ============
function addCustomer(customerData) {
    const customers = getCustomers();
    const newCustomer = {
        id: Date.now(),
        email: customerData.email,
        first_name: customerData.first_name,
        last_name: customerData.last_name,
        phone: customerData.phone || '',
        password: customerData.password || 'changeme123',
        company_name: customerData.company_name || '',
        created_at: new Date().toISOString()
    };
    customers.push(newCustomer);
    saveCustomers(customers);
    return { success: true, customer: newCustomer };
}

function updateCustomer(id, customerData) {
    const customers = getCustomers();
    const index = customers.findIndex(c => c.id == id);
    if (index === -1) {
        return { success: false, error: 'Customer not found' };
    }
    
    const oldEmail = customers[index].email;
    customers[index] = {
        ...customers[index],
        ...customerData
    };
    saveCustomers(customers);
    
    if (oldEmail !== customerData.email) {
        notifyAdminEmailChange(oldEmail, customerData.email);
    }
    
    return { success: true, customer: customers[index] };
}

function deleteCustomer(id) {
    let customers = getCustomers(true); // Get all including deleted
    const index = customers.findIndex(c => c.id == id);
    if (index !== -1) {
        customers[index].deleted = true;
        customers[index].deleted_at = new Date().toISOString();
        saveCustomers(customers);
    }
    return { success: true };
}

function restoreCustomer(id) {
    let customers = getCustomers(true);
    const index = customers.findIndex(c => c.id == id);
    if (index !== -1) {
        customers[index].deleted = false;
        customers[index].deleted_at = null;
        saveCustomers(customers);
    }
    return { success: true };
}

function getDeletedCustomers() {
    const customers = getCustomers(true);
    return customers.filter(c => c.deleted === true);
}

function getCustomerById(id) {
    const customers = getCustomers();
    return customers.find(c => c.id == id);
}

// Google OAuth handler
async function handleGoogleAuth(idToken, googleId, userData) {
    try {
        const apiUrl = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' 
            ? '/.netlify/functions/auth-google' 
            : '/api/auth-google';
        
        console.log('Google Auth - API URL:', apiUrl);
        console.log('Google Auth - Email:', userData.email);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idToken,
                googleId,
                ...userData
            })
        });

        console.log('Google Auth - Response status:', response.status);
        
        const data = await response.json();
        console.log('Google Auth - Response data:', data);

        if (response.ok) {
            // Store token and user data
            const storage = localStorage;
            storage.setItem('token', data.token);
            storage.setItem('refreshToken', data.refreshToken);
            storage.setItem('user', JSON.stringify(data.user));
            storage.setItem('loginTime', Date.now());
            return { success: true, user: data.user, isNewUser: data.isNewUser };
        } else {
            return { success: false, error: data.error || 'Authentication failed' };
        }
    } catch (error) {
        console.error('Google auth error:', error);
        return { success: false, error: 'Network error: ' + error.message };
    }
}

// Export functions for use in HTML
if (typeof window !== 'undefined') {
    window.authSystem = {
        login,
        registerUser,
        setAuth,
        clearAuth,
        isAuthenticated,
        getCurrentUser,
        generateToken,
        getCustomers,
        saveCustomers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        restoreCustomer,
        getDeletedCustomers,
        getCustomerById,
        getServices,
        saveServices,
        getPricing,
        savePricing,
        getInvoices,
        saveInvoices,
        generateInvoiceNumber,
        getServiceRequests,
        saveServiceRequests,
        getDashboardStats,
        requestPasswordReset,
        verifyResetCode,
        resetPassword,
        getAdminNotifications,
        markNotificationRead,
        clearNotifications,
        getRegisteredUsers,
        handleGoogleAuth
    };
}
