#!/bin/bash

# Trace Veil Forensics - Complete Supabase Setup Script
# This script generates all necessary SQL for database setup

echo "=========================================="
echo "Trace Veil Forensics - Database Setup"
echo "=========================================="
echo ""

# Generate admin password hash
echo "Generating admin password hash..."
HASH=$(node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Admin@123', 10, (err, h) => { console.log(h); })")

# Create complete setup SQL
cat > /tmp/full-setup.sql << 'SQLEOF'
-- =====================================================
-- TRACE VEIL FORENSICS - COMPLETE DATABASE SETUP
-- Run this entire file in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  company VARCHAR(200),
  role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SERVICES TABLE
-- =====================================================
DROP TABLE IF EXISTS services CASCADE;
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SERVICE PLANS (PRICING)
-- =====================================================
DROP TABLE IF EXISTS service_plans CASCADE;
CREATE TABLE service_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KES',
  billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('one_time', 'monthly', 'quarterly', 'annual')),
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================
DROP TABLE IF EXISTS customers CASCADE;
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(200),
  tax_id VARCHAR(50),
  billing_address TEXT,
  billing_city VARCHAR(100),
  billing_state VARCHAR(100),
  billing_postal_code VARCHAR(20),
  billing_country VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INVOICES TABLE
-- =====================================================
DROP TABLE IF EXISTS invoices CASCADE;
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date DATE,
  due_date DATE,
  paid_date DATE,
  subtotal DECIMAL(12, 2) DEFAULT 0,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 16,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'KES',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INVOICE ITEMS TABLE
-- =====================================================
DROP TABLE IF EXISTS invoice_items CASCADE;
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  service_plan_id UUID REFERENCES service_plans(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SERVICE REQUESTS TABLE
-- =====================================================
DROP TABLE IF EXISTS service_requests CASCADE;
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  service_plan_id UUID REFERENCES service_plans(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  requested_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ACTIVITY LOG TABLE
-- =====================================================
DROP TABLE IF EXISTS activity_log CASCADE;
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES
-- =====================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_service_requests_customer_id ON service_requests(customer_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS \$\$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
\$\$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_plans_updated_at BEFORE UPDATE ON service_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Public policies
CREATE POLICY "Public can view services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view service plans" ON service_plans FOR SELECT USING (is_active = true);

-- User policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);

-- Customer policies  
CREATE POLICY "Customers can view own data" ON customers FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage customers" ON customers FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Invoice policies
CREATE POLICY "Customers can view own invoices" ON invoices FOR SELECT USING (
  customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage invoices" ON invoices FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Service request policies
CREATE POLICY "Customers can view own requests" ON service_requests FOR SELECT USING (
  customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Customers can create requests" ON service_requests FOR INSERT WITH CHECK (
  customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can manage requests" ON service_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================
-- DEFAULT SERVICES
-- =====================================================
INSERT INTO services (name, slug, description, icon) VALUES
('Security Assessments', 'security-assessments', 'Comprehensive evaluation of your security posture with actionable recommendations', 'fa-shield-alt'),
('Vulnerability Scanning', 'vulnerability-scanning', 'Systematic identification and prioritization of security vulnerabilities', 'fa-search'),
('Incident Response', 'incident-response', 'Rapid response and recovery planning for security incidents', 'fa-exclamation-triangle'),
('Digital Forensics', 'digital-forensics', 'Digital evidence analysis, timeline reconstruction, and chain of custody management', 'fa-microscope'),
('IT Solutions', 'it-solutions', 'Network infrastructure, system administration, and technical support', 'fa-laptop-code'),
('Training & Awareness', 'training-awareness', 'Employee security education, phishing awareness, and best practices training', 'fa-graduation-cap');

-- =====================================================
-- DEFAULT PRICING PLANS
-- =====================================================
INSERT INTO service_plans (service_id, name, description, price, billing_cycle, features) VALUES
((SELECT id FROM services WHERE slug = 'security-assessments'), 'Basic Assessment', 'Essential security review for small businesses', 25000.00, 'one_time', '["Basic vulnerability scan", "Network security review", "Basic recommendations"]'::jsonb),
((SELECT id FROM services WHERE slug = 'security-assessments'), 'Comprehensive Assessment', 'Full security assessment for growing businesses', 75000.00, 'one_time', '["Deep vulnerability analysis", "Application security review", "Policy review", "Detailed report", "Recommendations"]'::jsonb),
((SELECT id FROM services WHERE slug = 'vulnerability-scanning'), 'Basic Scan', 'Automated vulnerability scanning', 15000.00, 'one_time', '["Automated scan", "Basic report", "Critical issues"]'::jsonb),
((SELECT id FROM services WHERE slug = 'vulnerability-scanning'), 'Advanced Scan', 'Manual + automated scanning', 35000.00, 'one_time', '["Automated + manual testing", "Detailed report", "Risk assessment", "Remediation guide"]'::jsonb),
((SELECT id FROM services WHERE slug = 'incident-response'), 'Basic Response', 'Emergency incident handling', 50000.00, 'one_time', '["Immediate response", "Containment", "Basic investigation", "Recovery guidance"]'::jsonb),
((SELECT id FROM services WHERE slug = 'incident-response'), 'Full Response', 'Complete incident management', 150000.00, 'one_time', '["Full investigation", "Forensic analysis", "Evidence preservation", "Recovery", "Post-incident report"]'::jsonb),
((SELECT id FROM services WHERE slug = 'digital-forensics'), 'Basic Forensics', 'Standard digital investigation', 100000.00, 'one_time', '["Evidence collection", "Basic analysis", "Report"]'::jsonb),
((SELECT id FROM services WHERE slug = 'digital-forensics'), 'Advanced Forensics', 'Comprehensive forensic analysis', 250000.00, 'one_time', '["Complete investigation", "Expert testimony ready", "Full documentation"]'::jsonb),
((SELECT id FROM services WHERE slug = 'it-solutions'), 'Basic Support', 'Essential IT support', 15000.00, 'monthly', '["Help desk", "Basic monitoring", "Email support"]'::jsonb),
((SELECT id FROM services WHERE slug = 'it-solutions'), 'Enterprise Support', 'Full IT management', 75000.00, 'monthly', '["24/7 support", "Full monitoring", "Proactive maintenance", "Strategic planning"]'::jsonb),
((SELECT id FROM services WHERE slug = 'training-awareness'), 'Phishing Training', 'Basic phishing awareness', 10000.00, 'one_time', '["Phishing simulation", "Basic training", "Report"]'::jsonb),
((SELECT id FROM services WHERE slug = 'training-awareness'), 'Full Security Training', 'Complete security awareness program', 50000.00, 'one_time', '["All security topics", "Hands-on training", "Certification", "Ongoing assessments"]'::jsonb);

-- =====================================================
-- ADMIN USER
-- =====================================================
INSERT INTO users (email, password_hash, first_name, last_name, role)
SELECT 'admin@traceveilforensics.com', '$HASH', 'Admin', 'User', 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@traceveilforensics.com'
);

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Users created:' as message, COUNT(*) as count FROM users;
SELECT 'Services created:' as message, COUNT(*) as count FROM services;
SELECT 'Pricing plans created:' as message, COUNT(*) as count FROM service_plans;

SQLEOF

# Replace the hash placeholder with actual hash
sed -i "s/\\\$HASH/$HASH/g" /tmp/full-setup.sql

echo ""
echo "SQL file created at: /tmp/full-setup.sql"
echo ""
echo "NEXT STEPS:"
echo "1. Go to https://supabase.com and create a new project"
echo "2. Go to SQL Editor in Supabase dashboard"
echo "3. Copy content from /tmp/full-setup.sql"
echo "4. Paste and click Run"
echo ""
echo "AFTER DATABASE IS SETUP:"
echo "1. Copy .env.example to .env"
echo "2. Edit .env with your Supabase URL and keys"
echo "3. Deploy to Netlify or run locally"
echo ""
echo "=========================================="
