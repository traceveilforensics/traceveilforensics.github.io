const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eapkpppftrxrwtwjbcen.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcGtwcHBmdHJ4cnd0d2piY2VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE5ODc0OCwiZXhwIjoyMDg1Nzc0NzQ4fQ.fVgPaQWfFbKu7ZacfLjK8mtKNlaLmSchS-XoY75Ejew';

const supabase = createClient(supabaseUrl, serviceKey);

async function disableRLS() {
    console.log('Disabling RLS on tables...');
    
    const tables = ['users', 'services', 'service_plans', 'customers', 'invoices', 'invoice_items', 'service_requests', 'payment_transactions', 'activity_log'];
    
    for (const table of tables) {
        try {
            const { error } = await supabase.rpc('exec', { 
                sql: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;` 
            });
            
            // Direct SQL approach
            const { error: e2 } = await supabase.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
            
            if (e2) {
                console.log(`${table}: RLS might already be disabled or error: ${e2.message}`);
            } else {
                console.log(`${table}: RLS disabled`);
            }
        } catch(e) {
            console.log(`${table}: ${e.message}`);
        }
    }
    
    console.log('\nDone!');
}

disableRLS();