const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eapkpppftrxrwtwjbcen.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcGtwcHBmdHJ4cnd0d2piY2VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE5ODc0OCwiZXhwIjoyMDg1Nzc0NzQ4fQ.fVgPaQWfFbKu7ZacfLjK8mtKNlaLmSchS-XoY75Ejew';

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false }
});

async function createAdminUser() {
    console.log('Creating admin user in Supabase...');
    
    const adminUser = {
        email: 'admin@traceveilforensics.com',
        password_hash: 'admin123', // Plain text for demo (use bcrypt hash in production)
        first_name: 'Admin',
        last_name: 'User',
        phone: '+254731570131',
        role: 'admin',
        is_active: true
    };
    
    const { data, error } = await supabase
        .from('users')
        .upsert([adminUser], { onConflict: 'email' })
        .select();
    
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('✅ Admin user created!');
        console.log(data);
    }
}

createAdminUser();