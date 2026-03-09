// Real users only - no demo users

const REGISTERED_USERS_KEY = 'registered_users';
const CUSTOMERS_KEY = 'admin_customers';
const SERVICES_KEY = 'admin_services';
const PRICING_KEY = 'admin_pricing';
const INVOICES_KEY = 'admin_invoices';
const SERVICE_REQUESTS_KEY = 'admin_service_requests';

// Supabase configuration
const SUPABASE_URL = 'https://eapkpppftrxrwtwjbcen.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pZC1O2ysKyCLMtjxdr3XWA_ffZiTCAB';
const SUPABASE_ENABLED = true;

let supabaseClient = null;
if (SUPABASE_ENABLED) {
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch(e) { console.log('Supabase init failed:', e); }
}

// Sync data to Supabase
async function syncToSupabase(key, data) {
    if (!SUPABASE_ENABLED || !supabaseClient) return;
    try {
        await supabaseClient.from('sync_data').upsert({ id: key, data: data, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    } catch(e) { console.log('Sync error:', e); }
}

// Load data from Supabase (background sync)
async function loadFromSupabase(key) {
    if (!SUPABASE_ENABLED || !supabaseClient) return null;
    try {
        const { data } = await supabaseClient.from('sync_data').select('data,updated_at').eq('id', key).single();
        return data ? data : null;
    } catch(e) { return null; }
}

// Background sync - call after page load
async function backgroundSync() {
    if (!SUPABASE_ENABLED) return;
    
    const cloudServices = await loadFromSupabase('services');
    if (cloudServices && cloudServices.data) {
        const localServices = JSON.parse(localStorage.getItem(SERVICES_KEY) || '[]');
        if (localServices.length === 0 || new Date(cloudServices.updated_at) > new Date(localStorage.getItem('services_sync_time') || '2020-01-01')) {
            localStorage.setItem(SERVICES_KEY, JSON.stringify(cloudServices.data));
            localStorage.setItem('services_sync_time', cloudServices.updated_at);
        }
    }
    
    const cloudPricing = await loadFromSupabase('pricing');
    if (cloudPricing && cloudPricing.data) {
        const localPricing = JSON.parse(localStorage.getItem(PRICING_KEY) || '[]');
        if (localPricing.length === 0 || new Date(cloudPricing.updated_at) > new Date(localStorage.getItem('pricing_sync_time') || '2020-01-01')) {
            localStorage.setItem(PRICING_KEY, JSON.stringify(cloudPricing.data));
            localStorage.setItem('pricing_sync_time', cloudPricing.updated_at);
        }
    }
}

// Force sync from cloud and reload page
async function syncFromCloud() {
    if (!SUPABASE_ENABLED || !supabaseClient) return false;
    
    try {
        // Sync services
        const { data: svcData } = await supabaseClient.from('sync_data').select('data').eq('id', 'services').single();
        if (svcData && svcData.data) {
            localStorage.setItem(SERVICES_KEY, JSON.stringify(svcData.data));
        }
        
        // Sync pricing
        const { data: prcData } = await supabaseClient.from('sync_data').select('data').eq('id', 'pricing').single();
        if (prcData && prcData.data) {
            localStorage.setItem(PRICING_KEY, JSON.stringify(prcData.data));
        }
        
        return true;
    } catch(e) { 
        console.log('Sync from cloud error:', e);
        return false;
    }
}

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
            // Security Assessments (KES 500 – 5,000)
            { id: 1, service_id: 1, name: 'Quick Security Health Check', description: 'Basic system and account security evaluation', price: 500, billing_cycle: 'one_time', features: ['Account & credential check', 'Basic security posture review', 'Quick summary report'], active: true },
            { id: 2, service_id: 1, name: 'Website Security Assessment', description: 'Review website configuration, admin access, and security settings', price: 2000, billing_cycle: 'one_time', features: ['Website configuration review', 'Admin access audit', 'Security settings evaluation', 'Recommendations report'], active: true },
            { id: 3, service_id: 1, name: 'Small Business Security Audit', description: 'Evaluate devices, access controls, and operational security', price: 3500, billing_cycle: 'one_time', features: ['Device evaluation', 'Access control review', 'Operational security assessment', 'Detailed audit report'], active: true },
            { id: 4, service_id: 1, name: 'Network Security Assessment', description: 'Review router configuration, WiFi protection, and firewall rules', price: 4000, billing_cycle: 'one_time', features: ['Router configuration review', 'WiFi protection audit', 'Firewall rules analysis', 'Network security report'], active: true },
            { id: 5, service_id: 1, name: 'Access Control & Password Audit', description: 'Evaluate authentication practices and account protection', price: 1500, billing_cycle: 'one_time', features: ['Authentication practices review', 'Password policy evaluation', 'Account protection assessment', 'Security recommendations'], active: true },
            { id: 6, service_id: 1, name: 'Device Security Assessment', description: 'Review laptops, desktops, and workstations for security risks', price: 1000, billing_cycle: 'one_time', features: ['Device security review', 'Workstation assessment', 'Risk identification', 'Security recommendations'], active: true },
            
            // Vulnerability Scanning (KES 1,000 – 6,000)
            { id: 7, service_id: 2, name: 'Quick Vulnerability Scan', description: 'Automated scan to detect common vulnerabilities', price: 1000, billing_cycle: 'one_time', features: ['Automated vulnerability scanning', 'Common vulnerabilities detection', 'Basic findings summary'], active: true },
            { id: 8, service_id: 2, name: 'Website Vulnerability Scan', description: 'Detect web application vulnerabilities and misconfigurations', price: 4500, billing_cycle: 'one_time', features: ['Web application scanning', 'OWASP Top 10 check', 'Vulnerability report', 'Risk prioritization'], active: true },
            { id: 9, service_id: 2, name: 'Network Vulnerability Scan', description: 'Identify exposed services and insecure network configurations', price: 4000, billing_cycle: 'one_time', features: ['Network port scanning', 'Exposed service detection', 'Risk prioritized report', 'Remediation guidance'], active: true },
            { id: 10, service_id: 2, name: 'Server Security Scan', description: 'Detect outdated software and server misconfigurations', price: 3500, billing_cycle: 'one_time', features: ['Software version check', 'Server configuration review', 'Security recommendations', 'Compliance report'], active: true },
            { id: 11, service_id: 2, name: 'CMS & Plugin Security Scan', description: 'Scan WordPress or CMS plugins for known vulnerabilities', price: 2500, billing_cycle: 'one_time', features: ['CMS core and plugin scanning', 'Known vulnerability detection', 'Patch recommendations', 'Security hardening tips'], active: true },
            { id: 12, service_id: 2, name: 'Security Misconfiguration Scan', description: 'Identify risky system or software configurations', price: 2000, billing_cycle: 'one_time', features: ['System configuration review', 'Risk scoring', 'Configuration guidelines', 'Remediation suggestions'], active: true },
            
            // Incident Response (KES 1,500 – 8,000)
            { id: 13, service_id: 3, name: 'Malware Removal & Cleanup', description: 'Remove viruses, spyware, and malicious software', price: 2500, billing_cycle: 'one_time', features: ['Malware detection and removal', 'System cleanup', 'Post-cleanup verification', 'Threat containment'], active: true },
            { id: 14, service_id: 3, name: 'Account Breach Recovery', description: 'Assist in recovering compromised email or online accounts', price: 2000, billing_cycle: 'one_time', features: ['Credential reset assistance', 'Session termination', 'Security reinforcement', 'Account recovery support'], active: true },
            { id: 15, service_id: 3, name: 'Website Hack Recovery', description: 'Remove malicious code and restore website functionality', price: 8000, billing_cycle: 'one_time', features: ['Malicious code removal', 'Website restoration', 'Security hardening', 'Post-recovery verification'], active: true },
            { id: 16, service_id: 3, name: 'System Compromise Investigation', description: 'Analyze compromised devices to identify attack sources', price: 6000, billing_cycle: 'one_time', features: ['Forensic analysis', 'Attack vector identification', 'Evidence collection', 'Mitigation report'], active: true },
            { id: 17, service_id: 3, name: 'Emergency Security Assistance', description: 'Immediate support for suspected cyber incidents', price: 3500, billing_cycle: 'one_time', features: ['24/7 incident response', 'Initial assessment', 'Containment actions', 'Rapid communication'], active: true },
            { id: 18, service_id: 3, name: 'Post-Incident Security Hardening', description: 'Strengthen systems after an attack to prevent recurrence', price: 5000, billing_cycle: 'one_time', features: ['Security audit', 'Vulnerability patching', 'Configuration hardening', 'Training recommendations'], active: true },
            
            // Digital Forensics (KES 1,500 – 7,000)
            { id: 19, service_id: 4, name: 'Deleted File Recovery', description: 'Recover lost or accidentally deleted data', price: 2000, billing_cycle: 'one_time', features: ['File carving and recovery', 'Recovery from HDD/SSD/USB', 'Recovery report', 'Legal evidentiary support'], active: true },
            { id: 20, service_id: 4, name: 'Storage Device Analysis', description: 'Investigate USB drives, external disks, or storage media', price: 3500, billing_cycle: 'one_time', features: ['Storage media analysis', 'Data extraction', 'Forensic imaging', 'Evidence documentation'], active: true },
            { id: 21, service_id: 4, name: 'Device Activity Investigation', description: 'Analyze computer usage and suspicious behavior', price: 4500, billing_cycle: 'one_time', features: ['Timeline and artifact analysis', 'User activity reconstruction', 'Process investigation', 'Findings report'], active: true },
            { id: 22, service_id: 4, name: 'Suspicious File Analysis', description: 'Examine unknown files or potential malware samples', price: 3000, billing_cycle: 'one_time', features: ['Static and dynamic analysis', 'Malware signature detection', 'Behavioral analysis', 'Technical report'], active: true },
            { id: 23, service_id: 4, name: 'Digital Evidence Collection', description: 'Extract and preserve digital evidence for investigations', price: 7000, billing_cycle: 'one_time', features: ['Forensic imaging', 'Chain of custody', 'Evidence preservation', 'Court-admissible documentation'], active: true },
            { id: 24, service_id: 4, name: 'Incident Timeline Reconstruction', description: 'Reconstruct events leading to a cyber incident', price: 5500, billing_cycle: 'one_time', features: ['Event timeline creation', 'Root cause analysis', 'Chronological reconstruction', 'Detailed incident report'], active: true },
            
            // IT Solutions (KES 300 – 3,000)
            { id: 25, service_id: 5, name: 'Quick IT Services', description: 'OS installation, Office installation, app installation', price: 500, billing_cycle: 'one_time', features: ['Fresh OS install', 'Software setup', 'Basic configuration', 'Installation verification'], active: true },
            { id: 26, service_id: 5, name: 'System Optimization', description: 'Improve performance and clean unnecessary processes', price: 1500, billing_cycle: 'one_time', features: ['Performance tuning', 'Startup optimization', 'Process cleanup', 'System diagnostics'], active: true },
            { id: 27, service_id: 5, name: 'Security Setup', description: 'Install antivirus, configure firewall, enable system protection', price: 2000, billing_cycle: 'one_time', features: ['Antivirus installation', 'Firewall configuration', 'System hardening', 'Security monitoring setup'], active: true },
            { id: 28, service_id: 5, name: 'Network Setup', description: 'Configure routers, WiFi security, and network connectivity', price: 2500, billing_cycle: 'one_time', features: ['Network topology design', 'WiFi security configuration', 'IP addressing setup', 'Connectivity testing'], active: true },
            { id: 29, service_id: 5, name: 'Backup & Data Protection', description: 'Setup automated backups and cloud storage solutions', price: 3000, billing_cycle: 'one_time', features: ['Backup software config', 'Cloud sync setup', 'Recovery test', 'Encryption setup'], active: true },
            { id: 30, service_id: 5, name: 'Software & System Maintenance', description: 'Updates, driver installation, and system troubleshooting', price: 800, billing_cycle: 'one_time', features: ['OS updates', 'Driver installation', 'Software troubleshooting', 'System monitoring'], active: true },
            
            // Training & Awareness (KES 500 – 4,000)
            { id: 31, service_id: 6, name: 'Basic Cybersecurity Awareness', description: 'Online safety fundamentals', price: 500, billing_cycle: 'one_time', features: ['Security concept introduction', 'Threat awareness', 'Safe browsing practices', 'Reporting procedures'], active: true },
            { id: 32, service_id: 6, name: 'Phishing Awareness Training', description: 'Detect and avoid phishing attacks', price: 2000, billing_cycle: 'one_time', features: ['Phishing detection training', 'Email analysis skills', 'Reporting procedures', 'Real-world examples'], active: true },
            { id: 33, service_id: 6, name: 'Password Security Training', description: 'Password management and multi-factor authentication', price: 1500, billing_cycle: 'one_time', features: ['Password best practices', 'MFA setup guide', 'Credential protection', 'Password manager introduction'], active: true },
            { id: 34, service_id: 6, name: 'Safe Internet Usage Training', description: 'Secure browsing and online privacy practices', price: 1200, billing_cycle: 'one_time', features: ['Browser security settings', 'Privacy configuration', 'Tracking protection', 'Secure communication'], active: true },
            { id: 35, service_id: 6, name: 'Employee Security Awareness', description: 'Cyber hygiene training for staff', price: 3000, billing_cycle: 'one_time', features: ['Interactive workshop', 'Phishing simulations', 'Best practice drills', 'Certification of completion'], active: true },
            { id: 36, service_id: 6, name: 'Small Business Security Workshop', description: 'Practical security practices for SMEs', price: 4000, billing_cycle: 'one_time', features: ['Customized security strategy', 'Budget-friendly solutions', 'Implementation roadmap', 'Ongoing support options'], active: true }
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
if (typeof window !== 'undefined') {
    setTimeout(backgroundSync, 2000);
}

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
    syncToSupabase('services', services);
}

// Get all pricing plans
async function getPricing() {
    // Try cloud first
    if (SUPABASE_ENABLED && supabaseClient) {
        try {
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
    syncToSupabase('pricing', pricing);
    
    // Dispatch custom event to notify UI of pricing changes
    const event = new CustomEvent('pricingUpdated', { detail: pricing });
    window.dispatchEvent(event);
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

function addNotification(notification) {
    const notifications = JSON.parse(localStorage.getItem(ADMIN_NOTIFICATIONS_KEY) || '[]');
    notifications.unshift({
        id: Date.now(),
        ...notification,
        timestamp: new Date().toISOString(),
        read: false
    });
    localStorage.setItem(ADMIN_NOTIFICATIONS_KEY, JSON.stringify(notifications.slice(0, 50)));
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
        addNotification,
        getRegisteredUsers,
        backgroundSync,
        syncFromCloud,
        SUPABASE_ENABLED
    };
}
