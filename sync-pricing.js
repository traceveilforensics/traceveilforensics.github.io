const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eapkpppftrxrwtwjbcen.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcGtwcHBmdHJ4cnd0d2piY2VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE5ODc0OCwiZXhwIjoyMDg1Nzc0NzQ4fQ.fVgPaQWfFbKu7ZacfLjK8mtKNlaLmSchS-XoY75Ejew';

const supabase = createClient(supabaseUrl, serviceKey);

const pricingPlans = [
    { service_id: '0b39a643-f50b-466a-8d8a-7056b169a0f3', name: 'Quick Security Health Check', description: 'Basic system and account security evaluation', price: 500, currency: 'KES', billing_cycle: 'one_time', features: ['Account & credential check', 'Basic security posture review', 'Quick summary report'], is_active: true },
    { service_id: '0b39a643-f50b-466a-8d8a-7056b169a0f3', name: 'Website Security Assessment', description: 'Review website configuration, admin access, and security settings', price: 2000, currency: 'KES', billing_cycle: 'one_time', features: ['Website configuration review', 'Admin access audit', 'Security settings evaluation', 'Recommendations report'], is_active: true },
    { service_id: '0b39a643-f50b-466a-8d8a-7056b169a0f3', name: 'Small Business Security Audit', description: 'Evaluate devices, access controls, and operational security', price: 3500, currency: 'KES', billing_cycle: 'one_time', features: ['Device evaluation', 'Access control review', 'Operational security assessment', 'Detailed audit report'], is_active: true },
    { service_id: '0b39a643-f50b-466a-8d8a-7056b169a0f3', name: 'Network Security Assessment', description: 'Review router configuration, WiFi protection, and firewall rules', price: 4000, currency: 'KES', billing_cycle: 'one_time', features: ['Router configuration review', 'WiFi protection audit', 'Firewall rules analysis', 'Network security report'], is_active: true },
    { service_id: '0b39a643-f50b-466a-8d8a-7056b169a0f3', name: 'Access Control & Password Audit', description: 'Evaluate authentication practices and account protection', price: 1500, currency: 'KES', billing_cycle: 'one_time', features: ['Authentication practices review', 'Password policy evaluation', 'Account protection assessment', 'Security recommendations'], is_active: true },
    { service_id: '0b39a643-f50b-466a-8d8a-7056b169a0f3', name: 'Device Security Assessment', description: 'Review laptops, desktops, and workstations for security risks', price: 1000, currency: 'KES', billing_cycle: 'one_time', features: ['Device security review', 'Workstation assessment', 'Risk identification', 'Security recommendations'], is_active: true },
    
    { service_id: 'f5bf5037-b224-4ff1-a659-574f86de9915', name: 'Quick Vulnerability Scan', description: 'Automated scan to detect common vulnerabilities', price: 1000, currency: 'KES', billing_cycle: 'one_time', features: ['Automated vulnerability scanning', 'Common vulnerabilities detection', 'Basic findings summary'], is_active: true },
    { service_id: 'f5bf5037-b224-4ff1-a659-574f86de9915', name: 'Website Vulnerability Scan', description: 'Detect web application vulnerabilities and misconfigurations', price: 4500, currency: 'KES', billing_cycle: 'one_time', features: ['Web application scanning', 'OWASP Top 10 check', 'Vulnerability report', 'Risk prioritization'], is_active: true },
    { service_id: 'f5bf5037-b224-4ff1-a659-574f86de9915', name: 'Network Vulnerability Scan', description: 'Identify exposed services and insecure network configurations', price: 4000, currency: 'KES', billing_cycle: 'one_time', features: ['Network port scanning', 'Exposed service detection', 'Risk prioritized report', 'Remediation guidance'], is_active: true },
    { service_id: 'f5bf5037-b224-4ff1-a659-574f86de9915', name: 'Server Security Scan', description: 'Detect outdated software and server misconfigurations', price: 3500, currency: 'KES', billing_cycle: 'one_time', features: ['Software version check', 'Server configuration review', 'Security recommendations', 'Compliance report'], is_active: true },
    { service_id: 'f5bf5037-b224-4ff1-a659-574f86de9915', name: 'CMS & Plugin Security Scan', description: 'Scan WordPress or CMS plugins for known vulnerabilities', price: 2500, currency: 'KES', billing_cycle: 'one_time', features: ['CMS core and plugin scanning', 'Known vulnerability detection', 'Patch recommendations', 'Security hardening tips'], is_active: true },
    { service_id: 'f5bf5037-b224-4ff1-a659-574f86de9915', name: 'Security Misconfiguration Scan', description: 'Identify risky system or software configurations', price: 2000, currency: 'KES', billing_cycle: 'one_time', features: ['System configuration review', 'Risk scoring', 'Configuration guidelines', 'Remediation suggestions'], is_active: true },
    
    { service_id: 'aba11fe2-1697-4888-a3a5-80289b4fad39', name: 'Malware Removal & Cleanup', description: 'Remove viruses, spyware, and malicious software', price: 2500, currency: 'KES', billing_cycle: 'one_time', features: ['Malware detection and removal', 'System cleanup', 'Post-cleanup verification', 'Threat containment'], is_active: true },
    { service_id: 'aba11fe2-1697-4888-a3a5-80289b4fad39', name: 'Account Breach Recovery', description: 'Assist in recovering compromised email or online accounts', price: 2000, currency: 'KES', billing_cycle: 'one_time', features: ['Credential reset assistance', 'Session termination', 'Security reinforcement', 'Account recovery support'], is_active: true },
    { service_id: 'aba11fe2-1697-4888-a3a5-80289b4fad39', name: 'Website Hack Recovery', description: 'Remove malicious code and restore website functionality', price: 8000, currency: 'KES', billing_cycle: 'one_time', features: ['Malicious code removal', 'Website restoration', 'Security hardening', 'Post-recovery verification'], is_active: true },
    { service_id: 'aba11fe2-1697-4888-a3a5-80289b4fad39', name: 'System Compromise Investigation', description: 'Analyze compromised devices to identify attack sources', price: 6000, currency: 'KES', billing_cycle: 'one_time', features: ['Forensic analysis', 'Attack vector identification', 'Evidence collection', 'Mitigation report'], is_active: true },
    { service_id: 'aba11fe2-1697-4888-a3a5-80289b4fad39', name: 'Emergency Security Assistance', description: 'Immediate support for suspected cyber incidents', price: 3500, currency: 'KES', billing_cycle: 'one_time', features: ['24/7 incident response', 'Initial assessment', 'Containment actions', 'Rapid communication'], is_active: true },
    { service_id: 'aba11fe2-1697-4888-a3a5-80289b4fad39', name: 'Post-Incident Security Hardening', description: 'Strengthen systems after an attack to prevent recurrence', price: 5000, currency: 'KES', billing_cycle: 'one_time', features: ['Security audit', 'Vulnerability patching', 'Configuration hardening', 'Training recommendations'], is_active: true },
    
    { service_id: '68ee8b17-524b-463b-a3a9-c72173921fba', name: 'Deleted File Recovery', description: 'Recover lost or accidentally deleted data', price: 2000, currency: 'KES', billing_cycle: 'one_time', features: ['File carving and recovery', 'Recovery from HDD/SSD/USB', 'Recovery report', 'Legal evidentiary support'], is_active: true },
    { service_id: '68ee8b17-524b-463b-a3a9-c72173921fba', name: 'Storage Device Analysis', description: 'Investigate USB drives, external disks, or storage media', price: 3500, currency: 'KES', billing_cycle: 'one_time', features: ['Storage media analysis', 'Data extraction', 'Forensic imaging', 'Evidence documentation'], is_active: true },
    { service_id: '68ee8b17-524b-463b-a3a9-c72173921fba', name: 'Device Activity Investigation', description: 'Analyze computer usage and suspicious behavior', price: 4500, currency: 'KES', billing_cycle: 'one_time', features: ['Timeline and artifact analysis', 'User activity reconstruction', 'Process investigation', 'Findings report'], is_active: true },
    { service_id: '68ee8b17-524b-463b-a3a9-c72173921fba', name: 'Suspicious File Analysis', description: 'Examine unknown files or potential malware samples', price: 3000, currency: 'KES', billing_cycle: 'one_time', features: ['Static and dynamic analysis', 'Malware signature detection', 'Behavioral analysis', 'Technical report'], is_active: true },
    { service_id: '68ee8b17-524b-463b-a3a9-c72173921fba', name: 'Digital Evidence Collection', description: 'Extract and preserve digital evidence for investigations', price: 7000, currency: 'KES', billing_cycle: 'one_time', features: ['Forensic imaging', 'Chain of custody', 'Evidence preservation', 'Court-admissible documentation'], is_active: true },
    { service_id: '68ee8b17-524b-463b-a3a9-c72173921fba', name: 'Incident Timeline Reconstruction', description: 'Reconstruct events leading to a cyber incident', price: 5500, currency: 'KES', billing_cycle: 'one_time', features: ['Event timeline creation', 'Root cause analysis', 'Chronological reconstruction', 'Detailed incident report'], is_active: true },
    
    { service_id: 'ebf09336-74be-476f-b2f3-562fd1f564b0', name: 'Quick IT Services', description: 'OS installation, Office installation, app installation', price: 500, currency: 'KES', billing_cycle: 'one_time', features: ['Fresh OS install', 'Software setup', 'Basic configuration', 'Installation verification'], is_active: true },
    { service_id: 'ebf09336-74be-476f-b2f3-562fd1f564b0', name: 'System Optimization', description: 'Improve performance and clean unnecessary processes', price: 1500, currency: 'KES', billing_cycle: 'one_time', features: ['Performance tuning', 'Startup optimization', 'Process cleanup', 'System diagnostics'], is_active: true },
    { service_id: 'ebf09336-74be-476f-b2f3-562fd1f564b0', name: 'Security Setup', description: 'Install antivirus, configure firewall, enable system protection', price: 2000, currency: 'KES', billing_cycle: 'one_time', features: ['Antivirus installation', 'Firewall configuration', 'System hardening', 'Security monitoring setup'], is_active: true },
    { service_id: 'ebf09336-74be-476f-b2f3-562fd1f564b0', name: 'Network Setup', description: 'Configure routers, WiFi security, and network connectivity', price: 2500, currency: 'KES', billing_cycle: 'one_time', features: ['Network topology design', 'WiFi security configuration', 'IP addressing setup', 'Connectivity testing'], is_active: true },
    { service_id: 'ebf09336-74be-476f-b2f3-562fd1f564b0', name: 'Backup & Data Protection', description: 'Setup automated backups and cloud storage solutions', price: 3000, currency: 'KES', billing_cycle: 'one_time', features: ['Backup software config', 'Cloud sync setup', 'Recovery test', 'Encryption setup'], is_active: true },
    { service_id: 'ebf09336-74be-476f-b2f3-562fd1f564b0', name: 'Software & System Maintenance', description: 'Updates, driver installation, and system troubleshooting', price: 800, currency: 'KES', billing_cycle: 'one_time', features: ['OS updates', 'Driver installation', 'Software troubleshooting', 'System monitoring'], is_active: true },
    
    { service_id: '71493167-f188-4f7d-af27-f5df43b59dfc', name: 'Basic Cybersecurity Awareness', description: 'Online safety fundamentals', price: 500, currency: 'KES', billing_cycle: 'one_time', features: ['Security concept introduction', 'Threat awareness', 'Safe browsing practices', 'Reporting procedures'], is_active: true },
    { service_id: '71493167-f188-4f7d-af27-f5df43b59dfc', name: 'Phishing Awareness Training', description: 'Detect and avoid phishing attacks', price: 2000, currency: 'KES', billing_cycle: 'one_time', features: ['Phishing detection training', 'Email analysis skills', 'Reporting procedures', 'Real-world examples'], is_active: true },
    { service_id: '71493167-f188-4f7d-af27-f5df43b59dfc', name: 'Password Security Training', description: 'Password management and multi-factor authentication', price: 1500, currency: 'KES', billing_cycle: 'one_time', features: ['Password best practices', 'MFA setup guide', 'Credential protection', 'Password manager introduction'], is_active: true },
    { service_id: '71493167-f188-4f7d-af27-f5df43b59dfc', name: 'Safe Internet Usage Training', description: 'Secure browsing and online privacy practices', price: 1200, currency: 'KES', billing_cycle: 'one_time', features: ['Browser security settings', 'Privacy configuration', 'Tracking protection', 'Secure communication'], is_active: true },
    { service_id: '71493167-f188-4f7d-af27-f5df43b59dfc', name: 'Employee Security Awareness', description: 'Cyber hygiene training for staff', price: 3000, currency: 'KES', billing_cycle: 'one_time', features: ['Interactive workshop', 'Phishing simulations', 'Best practice drills', 'Certification of completion'], is_active: true },
    { service_id: '71493167-f188-4f7d-af27-f5df43b59dfc', name: 'Small Business Security Workshop', description: 'Practical security practices for SMEs', price: 4000, currency: 'KES', billing_cycle: 'one_time', features: ['Customized security strategy', 'Budget-friendly solutions', 'Implementation roadmap', 'Ongoing support options'], is_active: true }
];

async function syncPricingPlans() {
    console.log('Syncing 36 pricing plans to Supabase...\n');
    
    // Delete existing plans
    await supabase.from('service_plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Insert new plans
    const { data, error } = await supabase
        .from('service_plans')
        .insert(pricingPlans)
        .select();
    
    if (error) {
        console.log('Error:', error.message);
    } else {
        console.log(`✅ Synced ${data?.length || pricingPlans.length} pricing plans to Supabase!\n`);
        
        // Show summary
        const { data: allPlans } = await supabase.from('service_plans').select('*');
        console.log('Total plans in Supabase:', allPlans?.length);
    }
}

syncPricingPlans();