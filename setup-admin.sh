#!/bin/bash

# Quick Setup Script - Run Database migrations

echo "=========================================="
echo "Trace Veil Forensics - Quick Setup"
echo "=========================================="
echo ""

# Generate admin password hash
echo "Generating admin password hash..."
HASH=$(node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Admin@123', 10, (err, h) => { console.log(h); })")
echo "Hash: $HASH"
echo ""

# Create admin user SQL
cat > /tmp/admin-user-temp.sql << EOF
-- Admin User
INSERT INTO users (email, password_hash, first_name, last_name, role)
SELECT 'admin@traceveilforensics.com', '$HASH', 'Admin', 'User', 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@traceveilforensics.com'
);

-- Default Services
INSERT INTO services (name, slug, description, icon) VALUES
('Security Assessments', 'security-assessments', 'Comprehensive security evaluation', 'fa-shield-alt'),
('Vulnerability Scanning', 'vulnerability-scanning', 'Systematic vulnerability identification', 'fa-search'),
('Incident Response', 'incident-response', 'Rapid incident handling', 'fa-exclamation-triangle'),
('Digital Forensics', 'digital-forensics', 'Digital evidence analysis', 'fa-microscope'),
('IT Solutions', 'it-solutions', 'IT infrastructure services', 'fa-laptop-code'),
('Training & Awareness', 'training-awareness', 'Security training programs', 'fa-graduation-cap')
ON CONFLICT DO NOTHING;

-- Sample Pricing Plans
INSERT INTO service_plans (service_id, name, description, price, billing_cycle, features)
SELECT s.id, 'Basic', 'Essential package', 25000.00, 'one_time', '["Basic scan", "Report"]'::jsonb
FROM services s WHERE s.slug = 'security-assessments'
ON CONFLICT DO NOTHING;

INSERT INTO service_plans (service_id, name, description, price, billing_cycle, features)
SELECT s.id, 'Professional', 'Complete package', 75000.00, 'one_time', '["Full assessment", "Detailed report", "Recommendations"]'::jsonb
FROM services s WHERE s.slug = 'security-assessments'
ON CONFLICT DO NOTHING;
EOF

echo "Admin user SQL created at /tmp/admin-user-temp.sql"
echo ""
echo "NEXT STEPS:"
echo "1. Copy /tmp/admin-user-temp.sql content"
echo "2. Paste into Supabase SQL Editor"
echo "3. Click Run"
echo ""
echo "Or use Supabase CLI:"
echo "  npx supabase db push"
echo ""
echo "=========================================="
