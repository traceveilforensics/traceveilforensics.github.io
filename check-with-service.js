const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eapkpppftrxrwtwjbcen.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcGtwcHBmdHJ4cnd0d2piY2VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE5ODc0OCwiZXhwIjoyMDg1Nzc0NzQ4fQ.fVgPaQWfFbKu7ZacfLjK8mtKNlaLmSchS-XoY75Ejew';

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function checkUsersWithServiceKey() {
    console.log('Using service role key to bypass RLS...\n');
    
    const { data, error } = await supabase
        .from('users')
        .select('*');
    
    console.log('Users:', data);
    console.log('Error:', error);
    
    if (data && data.length > 0) {
        console.log('\n✅ Admin user found!');
        console.log('Email:', data[0].email);
        console.log('Password hash:', data[0].password_hash);
    }
}

checkUsersWithServiceKey();