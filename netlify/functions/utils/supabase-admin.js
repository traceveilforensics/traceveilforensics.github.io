const { createClient } = require('@supabase/supabase-js');

const SB_URL = process.env.SUPABASE_URL;
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SB_URL || !SB_SERVICE_KEY) {
  console.error('FATAL: Supabase credentials not configured');
}

const supabase = createClient(SB_URL, SB_SERVICE_KEY, {
  auth: { persistSession: false }
});

const withRLS = async (tableName, userId, queryFn) => {
  const { data, error } = await queryFn(supabase);
  if (error) throw error;
  return data;
};

const adminQuery = async (queryFn) => {
  const { data, error } = await queryFn(supabase);
  if (error) throw error;
  return data;
};

module.exports = { supabase, withRLS, adminQuery };
