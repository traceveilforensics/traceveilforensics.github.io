const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eapkpppftrxrwtwjbcen.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcGtwcHBmdHJ4cnd0d2piY2VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE5ODc0OCwiZXhwIjoyMDg1Nzc0NzQ4fQ.fVgPaQWfFbKu7ZacfLjK8mtKNlaLmSchS-XoY75Ejew';

const supabase = createClient(supabaseUrl, serviceKey);

async function createAdmin() {
    const { data, error } = await supabase
        .from('users')
        .insert([{
            email: 'admin@traceveilforensics.com',
            password_hash: 'admin123',
            first_name: 'Admin',
            last_name: 'User',
            phone: '+254731570131',
            role: 'admin',
            is_active: true
        }])
        .select();
    
    if (error) {
        console.log('Error:', error.message);
        // Try upsert
        console.log('Trying upsert...');
        const { data: d2, error: e2 } = await supabase
            .from('users')
            .upsert([{
                email: 'admin@traceveilforensics.com',
                password_hash: 'admin123',
                first_name: 'Admin',
                last_name: 'User',
                phone: '+254731570131',
                role: 'admin',
                is_active: true
            }], { onConflict: 'email' })
            .select();
        console.log('Upsert result:', d2, e2);
    } else {
        console.log('Created:', data);
    }
}

createAdmin();