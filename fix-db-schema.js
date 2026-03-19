// This script should be run server-side with service role key
// For now, let me create SQL that needs to be run in Supabase dashboard

const SQL = `

-- Add email and user info columns to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS password TEXT;

-- Add customer_email and customer_name to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Add customer_email and customer_name to service_requests table  
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS service_name TEXT;

-- Update customers with user data (join via user_id)
UPDATE customers c SET 
    email = u.email,
    first_name = u.first_name,
    last_name = u.last_name,
    phone = u.phone,
    password = u.password_hash
FROM users u WHERE c.user_id = u.id;

-- Set email from user_id where possible
UPDATE customers SET email = 'customer@example.com' WHERE email IS NULL;

-- Update invoices with customer email
UPDATE invoices i SET 
    customer_email = (SELECT email FROM customers WHERE id = i.customer_id),
    customer_name = (SELECT company_name FROM customers WHERE id = i.customer_id)
WHERE customer_email IS NULL;

-- Update service_requests with customer email
UPDATE service_requests sr SET 
    customer_email = (SELECT email FROM customers WHERE id = sr.customer_id),
    customer_name = (SELECT company_name FROM customers WHERE id = sr.customer_id)
WHERE customer_email IS NULL;

`;

console.log('SQL to run in Supabase SQL Editor:');
console.log(SQL);
