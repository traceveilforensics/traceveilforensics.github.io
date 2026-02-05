-- Admin User for Trace Veil Forensics
-- Run this after database/schema.sql

-- Admin credentials: admin@traceveilforensics.com / Admin@123
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin@traceveilforensics.com',
  '$2a$10$EU2YseVTHJJUGBeN3BBmWe2mKzy6VTD3gwZI3rM2B5ffxc52z7O9W',
  'Admin',
  'User',
  'admin',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@traceveilforensics.com'
);

-- Verify admin was created
SELECT id, email, first_name, last_name, role, is_active FROM users WHERE email = 'admin@traceveilforensics.com';
