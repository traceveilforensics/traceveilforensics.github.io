const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eapkpppftrxrwtwjbcen.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcGtwcHBmdHJ4cnd0d2piY2VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE5ODc0OCwiZXhwIjoyMDg1Nzc0NzQ4fQ.fVgPaQWfFbKu7ZacfLjK8mtKNlaLmSchS-XoY75Ejew';

const supabase = createClient(supabaseUrl, serviceKey);

// Service IDs from database
const SVC = {
    security: '0b39a643-f50b-466a-8d8a-7056b169a0f3',
    vulnerability: 'f5bf5037-b224-4ff1-a659-574f86de9915',
    incident: 'aba11fe2-1697-4888-a3a5-80289b4fad39',
    forensics: '68ee8b17-524b-463b-a3a9-c72173921fba',
    it: 'ebf09336-74be-476f-b2f3-562fd1f564b0',
    training: '71493167-f188-4f7d-af27-f5df43b59dfc'
};

const pricingPlans = [
    { service_id: SVC.security, name: 'Quick Security Health Check', description: 'Basic system and account security evaluation', price: 500, currency: 'KES', billing_cycle: 'one_time', features: ['Account & credential check', 'Basic security posture review', 'Quick summary report'], is_active: true },
    { service_id: SVC.security, name: 'Website Security Assessment', description: 'Review website configuration, admin access, and security settings', price: 2000, currency: 'KES', billing_cycle: 'one_time', features: ['Website configuration review', 'Admin access audit', 'Security settings evaluation', 'Recommendations report'], is_active: true },
    { service_id: SVC.security, name: 'Small Business Security Audit', description: 'Evaluate devices, access controls, and operational security', price: 3500, currency: 'KES', billing_cycle: 'one_time', features: ['Device evaluation', 'Access control review', 'Operational security assessment', 'Detailed audit report'], is_active: true },
    { service_id: SVC.security, name: 'Network Security Assessment', description: 'Review router configuration, WiFi protection, and firewall rules', price: 4000, currency: 'KES', billing_cycle: 'one_time', features: ['Router configuration review', 'WiFi protection audit', 'Firewall rules analysis', 'Network security report'], is_active: true },
    { service_id: SVC.security, name: 'Access Control & Password Audit', description: 'Evaluate authentication practices and account protection', price: 1500, currency: 'KES', billing_cycle: 'one_time', features: ['Authentication practices review', 'Password policy evaluation', 'Account protection assessment', 'Security recommendations'], is_active: true },
    { service_id: SVC.security, name: 'Device Security Assessment', description: 'Review laptops, desktops, and workstations for security risks', price: 1000, currency: 'KES', billing_cycle: 'one_time', features: ['Device security review', 'Workstation assessment', 'Risk identification', 'Security recommendations'], is_active: true },
    
    { service_id: SVC.vulnerability, name: 'Quick Vulnerability Scan', description: 'Automated scan to detect common vulnerabilities', price: 1000, currency: 'KES', billing_cycle: 'one_time', features: ['Automated vulnerability scanning', 'Common vulnerabilities detection', 'Basic findings summary'], is_active: true },
    { service_id: SVC.vulnerability, name: 'Website Vulnerability Scan', description: 'Detect web application vulnerabilities and misconfigurations', price: 4500, currency: 'KES', billing_cycle: 'one_time', features: ['Web application scanning', 'OWASP Top 10 check', 'Vulnerability report', 'Risk prioritization'], is_active: true },
    { service_id: SVC.vulnerability, name: 'Network Vulnerability Scan', description: 'Identify exposed services and insecure network configurations', price: 4000, currency: 'KES', billing_cycle: 'one_time', features: ['Network port scanning', 'Exposed service detection', 'Risk prioritized report', 'Remediation guidance'], is_active: true },
    { service_id: SVC.vulnerability, name: 'Server Security Scan', description: 'Detect outdated software and server misconfigurations', price: 3500, currency: 'KES', billing_cycle: 'one_time', features: ['Software version check', 'Server configuration review', 'Security recommendations', 'Compliance report'], is_active: true },
    { service_id: SVC.vulnerability, name: 'CMS & Plugin Security Scan', description: 'Scan WordPress or CMS plugins for known vulnerabilities', price: 2500, currency: 'KES', billing_cycle: 'one_time', features: ['CMS core and plugin scanning', 'Known vulnerability detection', 'Patch recommendations', 'Security hardening tips'], is_active: true },
    { service_id: SVC.vulnerability, name: 'Security Misconfiguration Scan', description: 'Identify risky system or software configurations', price: 2000, currency: 'KES', billing_cycle: 'one_time', features: ['System configuration review', 'Risk scoring', 'Configuration guidelines', 'Remediation suggestions'], is_active: true },
    
    { service_id: SVC.incident, name: 'Malware Removal & Cleanup', description: 'Remove viruses, spyware, and malicious software', price: 2500, currency: 'KES', billing_cycle: 'one_time', features: ['Malware detection and removal', 'System cleanup', 'Post-cleanup verification', 'Threat containment'], is_active: true },
    { service_id: SVC.incident, name: 'Account Breach Recovery', description: 'Assist in recovering compromised email or online accounts', price: 2000, currency: 'KES', billing_cycle: 'one_time', features: ['Credential reset assistance', 'Session termination', 'Security reinforcement', 'Account recovery support'], is_active: true },
    { service_id: SVC.incident, name: 'Website Hack Recovery', description: 'Remove malicious code and restore website functionality', price: 8000, currency: 'KES', billing_cycle: 'one_time', features: ['Malicious code removal', 'Website restoration', 'Security hardening', 'Post-recovery verification'], is_active: true },
    { service_id: SVC.incident, name: 'System Compromise Investigation', description: 'Analyze compromised devices to identify attack sources', price: 6000, currency: 'KES', billing_cycle: 'one_time', features: ['Forensic analysis', 'Attack vector identification', 'Evidence collection', 'Mitigation report'], is_active: true },
    { service_id: SVC.incident, name: 'Emergency Security Assistance', description: 'Immediate support for suspected cyber incidents', price: 3500, currency: 'KES', billing_cycle: 'one_time', features: ['24/7 incident response', 'Initial assessment', 'Containment actions', 'Rapid communication'], is_active: true },
    { service_id: SVC.incident, name: 'Post-Incident Security Hardening', description: 'Strengthen systems after an attack to prevent recurrence', price: 5000, currency: 'KES', billing_cycle: 'one_time', features: ['Security audit', 'Vulnerability patching', 'Configuration hardening', 'Training recommendations'], is_active: true },
    
    { service_id: SVC.forensics, name: 'Deleted File Recovery', description: 'Recover lost or accidentally deleted data', price: 2000, currency: 'KES', billing_cycle: 'one_time', features: ['File carving and recovery', 'Recovery from HDD/SSD/USB', 'Recovery report', 'Legal evidentiary support'], is_active: true },
    { service_id: SVC.forensics, name: 'Storage Device Analysis', description: 'Investigate USB drives, external disks, or storage media', price: 3500, currency: 'KES', billing_cycle: 'one_time', features: ['Storage media analysis', 'Data extraction', 'Forensic imaging', 'Evidence documentation'], is_active: true },
    { service_id: SVC.forensics, name: 'Device Activity Investigation', description: 'Analyze computer usage and suspicious behavior', price: 4500, currency: 'KES', billing_cycle: 'one_time', features: ['Timeline and artifact analysis', 'User activity reconstruction', 'Process investigation', 'Findings report'], is_active: true },
    { service_id: SVC.forensics, name: 'Suspicious File Analysis', description: 'Examine unknown files or potential malware samples', price: 3000, currency: 'KES', billing_cycle: 'one_time', features: ['Static and dynamic analysis', 'Malware signature detection', 'Behavioral analysis', 'Technical report'], is_active: true },
    { service_id: SVC.forensics, name: 'Digital Evidence Collection', description: 'Extract and preserve digital evidence for investigations', price: 7000, currency: 'KES', billing_cycle: 'one_time', features: ['Forensic imaging', 'Chain of custody', 'Evidence preservation', 'Court-admissible documentation'], is_active: true },
    { service_id: SVC.forensics, name: 'Incident Timeline Reconstruction', description: 'Reconstruct events leading to a cyber incident', price: 5500, currency: 'KES', billing_cycle: 'one_time', features: ['Event timeline creation', 'Root cause analysis', 'Chronological reconstruction', 'Detailed incident report'], is_active: true },
    
    { service_id: SVC.it, name: 'Quick IT Services', description: 'OS installation, Office installation, app installation', price: 500, currency: 'KES', billing_cycle: 'one_time', features: ['Fresh OS install', 'Software setup', 'Basic configuration', 'Installation verification'], is_active: true },
    { service_id: SVC.it, name: 'System Optimization', description: 'Improve performance and clean unnecessary processes', price: 1500, currency: 'KES', billing_cycle: 'one_time', features: ['Performance tuning', 'Startup optimization', 'Process cleanup', 'System diagnostics'], is_active: true },
    { service_id: SVC.it, name: 'Security Setup', description: 'Install antivirus, configure firewall, enable system protection', price: 2000, currency: 'KES', billing_cycle: 'one_time', features: ['Antivirus installation', 'Firewall configuration', 'System hardening', 'Security monitoring setup'], is_active: true },
    { service_id: SVC.it, name: 'Network Setup', description: 'Configure routers, WiFi security, and network connectivity', price: 2500, currency: 'KES', billing_cycle: 'one_time', features: ['Network topology design', 'WiFi security configuration', 'IP addressing setup', 'Connectivity testing'], is_active: true },
    { service_id: SVC.it, name: 'Backup & Data Protection', description: 'Setup automated backups and cloud storage solutions', price: 3000, currency: 'KES', billing_cycle: 'one_time', features: ['Backup software config', 'Cloud sync setup', 'Recovery test', 'Encryption setup'], is_active: true },
    { service_id: SVC.it, name: 'Software & System Maintenance', description: 'Updates, driver installation, and system troubleshooting', price: 800, currency: 'KES', billing_cycle: 'one_time', features: ['OS updates', 'Driver installation', 'Software troubleshooting', 'System monitoring'], is_active: true },
    
    { service_id: SVC.training, name: 'Basic Cybersecurity Awareness', description: 'Online safety fundamentals', price: 500, currency: 'KES', billing_cycle: 'one_time', features: ['Security concept introduction', 'Threat awareness', 'Safe browsing practices', 'Reporting procedures'], is_active: true },
    { service_id: SVC.training, name: 'Phishing Awareness Training', description: 'Detect and avoid phishing attacks', price: 2000, currency: 'KES', billing_cycle: 'one_time', features: ['Phishing detection training', 'Email analysis skills', 'Reporting procedures', 'Real-world examples'], is_active: true },
    { service_id: SVC.training, name: 'Password Security Training', description: 'Password management and multi-factor authentication', price: 1500, currency: 'KES', billing_cycle: 'one_time', features: ['Password best practices', 'MFA setup guide', 'Credential protection', 'Password manager introduction'], is_active: true },
    { service_id: SVC.training, name: 'Safe Internet Usage Training', description: 'Secure browsing and online privacy practices', price: 1200, currency: 'KES', billing_cycle: 'one_time', features: ['Browser security settings', 'Privacy configuration', 'Tracking protection', 'Secure communication'], is_active: true },
    { service_id: SVC.training, name: 'Employee Security Awareness', description: 'Cyber hygiene training for staff', price: 3000, currency: 'KES', billing_cycle: 'one_time', features: ['Interactive workshop', 'Phishing simulations', 'Best practice drills', 'Certification of completion'], is_active: true },
    { service_id: SVC.training, name: 'Small Business Security Workshop', description: 'Practical security practices for SMEs', price: 4000, currency: 'KES', billing_cycle: 'one_time', features: ['Customized security strategy', 'Budget-friendly solutions', 'Implementation roadmap', 'Ongoing support options'], is_active: true }
];

// Sample customers
const customers = [
    { user_id: null, company_name: 'Tech Corp Kenya', tax_id: 'T001', billing_address: 'Nairobi, Kenya', billing_city: 'Nairobi', billing_country: 'Kenya' },
    { user_id: null, company_name: 'SecureBank Ltd', tax_id: 'T002', billing_address: 'Mombasa Road', billing_city: 'Nairobi', billing_country: 'Kenya' },
    { user_id: null, company_name: 'Digital Solutions', tax_id: 'T003', billing_address: 'Westlands', billing_city: 'Nairobi', billing_country: 'Kenya' }
];

// Sample invoices
const invoices = [
    { invoice_number: 'INV-001', customer_id: null, status: 'paid', issue_date: '2026-01-15', due_date: '2026-02-15', paid_date: '2026-01-20', subtotal: 3500, tax_amount: 560, tax_rate: 16, total: 4060, currency: 'KES', notes: 'Security Assessment completed' },
    { invoice_number: 'INV-002', customer_id: null, status: 'pending', issue_date: '2026-02-01', due_date: '2026-03-01', paid_date: null, subtotal: 8000, tax_amount: 1280, tax_rate: 16, total: 9280, currency: 'KES', notes: 'Website Hack Recovery' },
    { invoice_number: 'INV-003', customer_id: null, status: 'overdue', issue_date: '2025-12-01', due_date: '2026-01-01', paid_date: null, subtotal: 5000, tax_amount: 800, tax_rate: 16, total: 5800, currency: 'KES', notes: 'Vulnerability Scan' }
];

// Sample service requests
const serviceRequests = [
    { customer_id: null, service_plan_id: null, title: 'Website Security Assessment', description: 'Need comprehensive security review for our e-commerce platform', status: 'pending', priority: 'high', notes: 'Urgent - customer data involved' },
    { customer_id: null, service_plan_id: null, title: 'Network Vulnerability Scan', description: 'Quarterly network security audit required', status: 'in_progress', priority: 'normal', notes: 'Scheduled for next week' },
    { customer_id: null, service_plan_id: null, title: 'Employee Security Training', description: 'Phishing awareness training for all staff', status: 'pending', priority: 'medium', notes: '50 employees' }
];

async function syncAll() {
    console.log('=== SYNCING ALL DATA TO SUPABASE ===\n');
    
    // 1. Pricing Plans (pricing_plans table)
    console.log('1. Syncing 36 pricing plans...');
    await supabase.from('pricing_plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: pErr } = await supabase.from('pricing_plans').insert(pricingPlans);
    if (pErr) console.log('   Error:', pErr.message);
    else console.log('   ✅ 36 pricing plans synced');
    
    // 2. Customers
    console.log('\n2. Syncing customers...');
    const { data: newCustomers, error: cErr } = await supabase.from('customers').insert(customers).select();
    if (cErr) console.log('   Error:', cErr.message);
    else console.log('   ✅', newCustomers.length, 'customers synced');
    
    // 3. Invoices (using customer IDs)
    if (newCustomers && newCustomers.length > 0) {
        console.log('\n3. Syncing invoices...');
        const invWithCustomer = invoices.map((inv, i) => ({...inv, customer_id: newCustomers[i % newCustomers.length].id}));
        const { error: iErr } = await supabase.from('invoices').insert(invWithCustomer);
        if (iErr) console.log('   Error:', iErr.message);
        else console.log('   ✅', invoices.length, 'invoices synced');
        
        // 4. Service Requests
        console.log('\n4. Syncing service requests...');
        const reqWithCustomer = serviceRequests.map((req, i) => ({...req, customer_id: newCustomers[i % newCustomers.length].id}));
        const { error: rErr } = await supabase.from('service_requests').insert(reqWithCustomer);
        if (rErr) console.log('   Error:', rErr.message);
        else console.log('   ✅', serviceRequests.length, 'service requests synced');
    }
    
    // Final check
    console.log('\n=== FINAL DATABASE STATUS ===\n');
    const tables = ['users', 'services', 'pricing_plans', 'customers', 'invoices', 'service_requests', 'activity_log'];
    for (const table of tables) {
        const { data } = await supabase.from(table).select('id');
        console.log(table + ': ' + (data?.length || 0) + ' records');
    }
}

syncAll();