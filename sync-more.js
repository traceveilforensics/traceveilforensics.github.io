const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eapkpppftrxrwtwjbcen.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcGtwcHBmdHJ4cnd0d2piY2VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE5ODc0OCwiZXhwIjoyMDg1Nzc0NzQ4fQ.fVgPaQWfFbKu7ZacfLjK8mtKNlaLmSchS-XoY75Ejew';

const supabase = createClient(supabaseUrl, serviceKey);

// Sample invoices - using valid status values from constraint
const invoices = [
    { invoice_number: 'INV-001', customer_id: null, status: 'paid', issue_date: '2026-01-15', due_date: '2026-02-15', paid_date: '2026-01-20', subtotal: 3500, tax_amount: 560, tax_rate: 16, total: 4060, currency: 'KES', notes: 'Security Assessment completed' },
    { invoice_number: 'INV-002', customer_id: null, status: 'sent', issue_date: '2026-02-01', due_date: '2026-03-01', paid_date: null, subtotal: 8000, tax_amount: 1280, tax_rate: 16, total: 9280, currency: 'KES', notes: 'Website Hack Recovery' },
    { invoice_number: 'INV-003', customer_id: null, status: 'overdue', issue_date: '2025-12-01', due_date: '2026-01-01', paid_date: null, subtotal: 5000, tax_amount: 800, tax_rate: 16, total: 5800, currency: 'KES', notes: 'Vulnerability Scan' }
];

// Sample service requests - using valid priority values
const serviceRequests = [
    { customer_id: null, service_plan_id: null, title: 'Website Security Assessment', description: 'Need comprehensive security review for our e-commerce platform', status: 'pending', priority: 'high', notes: 'Urgent - customer data involved' },
    { customer_id: null, service_plan_id: null, title: 'Network Vulnerability Scan', description: 'Quarterly network security audit required', status: 'in_progress', priority: 'normal', notes: 'Scheduled for next week' },
    { customer_id: null, service_plan_id: null, title: 'Employee Security Training', description: 'Phishing awareness training for all staff', status: 'pending', priority: 'medium', notes: '50 employees' }
];

async function syncMore() {
    console.log('Syncing invoices and service requests...\n');
    
    // Get customers
    const { data: customers } = await supabase.from('customers').select('id');
    
    if (customers && customers.length > 0) {
        // Invoices with customer IDs
        const invWithCustomer = invoices.map((inv, i) => ({
            ...inv, 
            customer_id: customers[i % customers.length].id
        }));
        
        const { error: iErr } = await supabase.from('invoices').insert(invWithCustomer);
        if (iErr) console.log('Invoices Error:', iErr.message);
        else console.log('✅', invoices.length, 'invoices synced');
        
        // Service requests with customer IDs
        const reqWithCustomer = serviceRequests.map((req, i) => ({
            ...req, 
            customer_id: customers[i % customers.length].id
        }));
        
        const { error: rErr } = await supabase.from('service_requests').insert(reqWithCustomer);
        if (rErr) console.log('Requests Error:', rErr.message);
        else console.log('✅', serviceRequests.length, 'service requests synced');
    }
    
    // Final summary
    console.log('\n=== DATABASE SUMMARY ===\n');
    const tables = ['users', 'services', 'pricing_plans', 'customers', 'invoices', 'service_requests', 'activity_log'];
    for (const table of tables) {
        const { data } = await supabase.from(table).select('id');
        console.log(table + ': ' + (data?.length || 0) + ' records');
    }
}

syncMore();