const { createClient } = require('@supabase/supabase-js');

// Using anon key like the frontend
const supabaseUrl = 'https://eapkpppftrxrwtwjbcen.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcGtwcHBmdHJ4cnd0d2piY2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxOTg3NDgsImV4cCI6MjA4NTc3NDc0OH0.5sYSUDqWAp2iId_LMGAZp0Pap-ZChispV8KedbVSBEY';

const supabase = createClient(supabaseUrl, anonKey);

async function checkUsers() {
    console.log('Checking users table...');
    const { data, error } = await supabase
        .from('users')
        .select('id, email, role, first_name');
    
    console.log('Data:', data);
    console.log('Error:', error);
}

checkUsers();