# Database Setup Guide

## Supabase Database Setup

### 1. Create a Supabase Project
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up/Login with your account
4. Create a new project for Trace Veil Forensics
5. Wait for the project to be provisioned (2-3 minutes)

### 2. Get Your Credentials
1. Go to Project Settings → API
2. Copy these values to your `.env` file:
   - Project URL → `SUPABASE_URL`
   - anon public → `SUPABASE_ANON_KEY`
   - service_role → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Run the Schema
1. Go to the SQL Editor in Supabase dashboard
2. Copy all content from `database/schema.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the schema

### 4. Enable Row Level Security (RLS) Policies
Run these in the SQL Editor to secure your database:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Public can view services
CREATE POLICY "Public can view services"
  ON services FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Public can view service plans"
  ON service_plans FOR SELECT
  TO public
  USING (is_active = true);

-- Users can only see their own data
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id OR auth.uid()::text = (SELECT id FROM users WHERE role = 'admin' LIMIT 1));

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Customers can view their own data
CREATE POLICY "Customers can view own customers"
  ON customers FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Customers can update own data"
  ON customers FOR UPDATE
  USING (user_id = auth.uid());

-- Invoices
CREATE POLICY "Customers can view own invoices"
  ON invoices FOR SELECT
  USING (customer_id IN (
    SELECT id FROM customers WHERE user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage invoices"
  ON invoices FOR ALL
  TO public
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Service Requests
CREATE POLICY "Customers can view own requests"
  ON service_requests FOR SELECT
  USING (customer_id IN (
    SELECT id FROM customers WHERE user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Customers can create requests"
  ON service_requests FOR INSERT
  WITH CHECK (customer_id IN (
    SELECT id FROM customers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage requests"
  ON service_requests FOR ALL
  TO public
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Activity Log
CREATE POLICY "Users can view own activity"
  ON activity_log FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can create activity"
  ON activity_log FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

### 5. Create Admin User
Run this in SQL Editor to create your admin account (replace password hash):

```sql
-- First, generate a password hash using bcryptjs in Node.js
-- Then insert the admin user
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES (
  'admin@traceveilforensics.com',
  '$2a$10$your_hashed_password_here',
  'Admin',
  'User',
  'admin'
);
```

### 6. Initialize Default Services
Run this to add default services:

```sql
INSERT INTO services (name, slug, description, icon) VALUES
('Security Assessments', 'security-assessments', 'Comprehensive evaluation of your security posture with actionable recommendations', 'fa-shield-alt'),
('Vulnerability Scanning', 'vulnerability-scanning', 'Systematic identification and prioritization of security vulnerabilities', 'fa-search'),
('Incident Response', 'incident-response', 'Rapid response and recovery planning for security incidents', 'fa-exclamation-triangle'),
('Digital Forensics', 'digital-forensics', 'Digital evidence analysis, timeline reconstruction, and chain of custody management', 'fa-microscope'),
('IT Solutions', 'it-solutions', 'Network infrastructure, system administration, and technical support for businesses', 'fa-laptop-code'),
('Training & Awareness', 'training-awareness', 'Employee security education, phishing awareness, and best practices training', 'fa-graduation-cap');

-- Add default pricing plans
INSERT INTO service_plans (service_id, name, description, price, billing_cycle, features) VALUES
((SELECT id FROM services WHERE slug = 'security-assessments'), 'Basic Assessment', 'Essential security review for small businesses', 25000.00, 'one_time', '["Basic vulnerability scan", "Network security review", "Basic recommendations"]'::jsonb),
((SELECT id FROM services WHERE slug = 'security-assessments'), 'Comprehensive Assessment', 'Full security assessment for growing businesses', 75000.00, 'one_time', '["Deep vulnerability analysis", "Application security review", "Policy review", "Detailed report", "Recommendations"]'::jsonb),
((SELECT id FROM services WHERE slug = 'vulnerability-scanning'), 'Basic Scan', 'Automated vulnerability scanning', 15000.00, 'one_time', '["Automated scan", "Basic report", "Critical issues"]'::jsonb),
((SELECT id FROM services WHERE slug = 'vulnerability-scanning'), 'Advanced Scan', 'Manual + automated scanning', 35000.00, 'one_time', '["Automated + manual testing", "Detailed report", "Risk assessment", "Remediation guide"]'::jsonb),
((SELECT id FROM services WHERE slug = 'incident-response'), 'Basic Response', 'Emergency incident handling', 50000.00, 'one_time', '["Immediate response", "Containment", "Basic investigation", "Recovery guidance"]'::jsonb),
((SELECT id FROM services WHERE slug = 'incident-response'), 'Full Response', 'Complete incident management', 150000.00, 'one_time', '["Full investigation", "Forensic analysis", "Evidence preservation", "Recovery", "Post-incident report"]'::jsonb);
```

### 7. Environment Variables Setup
1. Copy `.env.example` to `.env`
2. Fill in all the required values
3. Add `.env` to `.gitignore` (already done)

### 8. Testing
Once everything is set up, you can test by:
1. Creating a Netlify dev environment
2. Running the authentication endpoints
3. Accessing the admin panel

## Security Notes
- Never commit `.env` file to git
- Use strong passwords and JWT secrets
- Rotate API keys regularly
- Enable 2FA on Supabase account
- Monitor database activity logs
