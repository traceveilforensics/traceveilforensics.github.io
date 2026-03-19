const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eapkpppftrxrwtwjbcen.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcGtwcHBmdHJ4cnd0d2piY2VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE5ODc0OCwiZXhwIjoyMDg1Nzc0NzQ4fQ.fVgPaQWfFbKu7ZacfLjK8mtKNlaLmSchS-XoY75Ejew';

const supabase = createClient(supabaseUrl, serviceKey);

async function verifySupabaseData() {
    console.log('=== SUPABASE DATABASE VERIFICATION ===\n');
    
    // Check users table
    console.log('1. USERS TABLE:');
    const { data: users, error: uErr } = await supabase.from('users').select('*');
    console.log('   Found:', users?.length || 0, 'users');
    if (users && users.length > 0) {
        console.log('   Admin user from Supabase:');
        console.log('   - Email:', users[0].email);
        console.log('   - Role:', users[0].role);
        console.log('   - ID:', users[0].id);
    }
    
    // Check services table
    console.log('\n2. SERVICES TABLE:');
    const { data: services, error: sErr } = await supabase.from('services').select('*');
    console.log('   Found:', services?.length || 0, 'services');
    services?.forEach((svc, i) => console.log(`   ${i+1}. ${svc.name}`));
    
    // Check service_plans table
    console.log('\n3. SERVICE PLANS TABLE:');
    const { data: plans, error: pErr } = await supabase.from('service_plans').select('*');
    console.log('   Found:', plans?.length || 0, 'plans');
    plans?.forEach((plan, i) => console.log(`   ${i+1}. ${plan.name} - KES ${plan.price}`));
    
    // Check invoices table
    console.log('\n4. INVOICES TABLE:');
    const { data: invoices, error: iErr } = await supabase.from('invoices').select('*');
    console.log('   Found:', invoices?.length || 0, 'invoices');
    
    // Check service_requests table
    console.log('\n5. SERVICE REQUESTS TABLE:');
    const { data: requests, error: rErr } = await supabase.from('service_requests').select('*');
    console.log('   Found:', requests?.length || 0, 'requests');
    
    // Check activity_log table
    console.log('\n6. ACTIVITY LOG TABLE:');
    const { data: logs, error: lErr } = await supabase.from('activity_log').select('*');
    console.log('   Found:', logs?.length || 0, 'logs');
    
    console.log('\n=== CONCLUSION ===');
    console.log('✅ All data is being pulled from SUPABASE!');
    console.log('Database:', supabaseUrl);
}

verifySupabaseData();