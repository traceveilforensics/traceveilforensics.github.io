# Admin Panel, Accounting & Customer Dashboard Setup Guide

## Overview
This guide explains how to set up the complete business management system for Trace Veil Forensics including:
- Admin Panel (services, pricing, invoices, customers, reports)
- Customer Dashboard (view invoices, request services, manage profile)
- Authentication system
- Accounting features (invoicing, payments tracking)

## Prerequisites
1. **Netlify Account** - For hosting and serverless functions
2. **Supabase Account** - For database and authentication
3. **Node.js 18+** - For local development

---

## Part 1: Database Setup (Supabase)

### Step 1.1: Create Supabase Project
1. Go to https://supabase.com
2. Click "Start your project" → "New project"
3. Enter project name: `traceveil-forensics`
4. Set a strong database password
5. Wait for provisioning (2-3 minutes)

### Step 1.2: Run Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Copy all content from `database/schema.sql`
3. Click "Run" to execute

### Step 1.3: Get API Credentials
1. Go to **Project Settings** → **API**
2. Copy these values:
   - Project URL → Save as `SUPABASE_URL`
   - anon key → Save as `SUPABASE_ANON_KEY`
   - service_role key → Save as `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### Step 1.4: Create Admin User
Run this SQL (replace password hash with bcrypt hash):
```sql
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES (
  'admin@traceveilforensics.com',
  '$2a$10$your_bcrypt_password_hash',
  'Admin',
  'User',
  'admin'
);
```

To generate password hash, run locally:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourPassword123', 10, (err, hash) => console.log(hash));"
```

---

## Part 2: Environment Variables

### Step 2.1: Create .env File
```bash
cp .env.example .env
```

### Step 2.2: Fill in Values
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

JWT_SECRET=generate_a_strong_random_string_here

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@yourdomain.com

SITE_URL=https://your-site.netlify.app
```

### Step 2.3: Add to Netlify
1. Go to Netlify dashboard → **Site settings** → **Environment variables**
2. Add all variables from `.env` file

---

## Part 3: Deploy to Netlify

### Option A: Automatic Deploy
1. Push all files to GitHub
2. Connect repository to Netlify
3. Netlify auto-detects settings from `netlify.toml`

### Option B: Manual Deploy
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=. --functions=netlify/functions
```

---

## Part 4: Local Development

### Step 4.1: Install Dependencies
```bash
npm install
```

### Step 4.2: Start Development Server
```bash
npm run netlify-functions:serve
```

### Step 4.3: Access Local Environment
- Site: http://localhost:3000
- Admin: http://localhost:3000/admin-login.html
- Customer Dashboard: http://localhost:3000/customer-dashboard.html

---

## Part 5: Testing the System

### Step 5.1: Test Admin Login
1. Go to `/admin-login.html`
2. Use admin credentials created in Step 1.4
3. Verify you can access the dashboard

### Step 5.2: Test Customer Registration
1. Go to `/register.html`
2. Create a new customer account
3. Verify automatic redirect to customer dashboard

### Step 5.3: Test Invoice Creation
1. Login as admin
2. Navigate to Invoices
3. Create a new invoice for a test customer
4. Verify invoice appears in customer dashboard

---

## Part 6: Email Configuration (Optional)

### For Gmail
1. Enable 2FA on Gmail account
2. Go to https://myaccount.google.com/apppasswords
3. Create app password
4. Use that password in `EMAIL_PASSWORD`

### For Other Providers
Update these in environment variables:
```env
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587  # or 465 for SSL
EMAIL_USER=your_email@provider.com
EMAIL_PASSWORD=your_password
```

---

## Part 7: Features Overview

### Admin Panel (admin-dashboard.html)
- **Dashboard**: Overview stats, recent invoices, recent requests
- **Services**: Add/edit/delete services and pricing plans
- **Invoices**: Create, view, update status, send to customers
- **Customers**: View all customers and their activity
- **Reports**: Financial reports and analytics

### Customer Dashboard (customer-dashboard.html)
- **Overview**: Quick stats, recent invoices, active requests
- **Invoices**: View and download invoices
- **Service Requests**: Submit and track service requests
- **Services**: Browse available services
- **Profile**: Manage account and billing information

### API Endpoints
```
/auth-login        - User login
/auth-register     - Customer registration
/auth-me            - Get current user

/admin-services    - CRUD services (admin only)
/admin-invoices    - CRUD invoices (admin only)
/admin-customers   - View customers (admin only)
/admin-reports     - Financial reports (admin only)

/customer-invoices - View own invoices
/customer-requests - Manage own requests
/customer-profile  - Manage own profile
/public-services   - Public services listing
```

---

## Part 8: Security Best Practices

1. **Never commit `.env` file** - Already in .gitignore
2. **Use strong JWT secret** - Minimum 32 characters
3. **Enable RLS policies** - Already in schema.sql
4. **Rotate keys regularly** - Especially service_role key
5. **Enable 2FA** - On Supabase and Netlify accounts
6. **Use HTTPS** - Automatic on Netlify

---

## Part 9: Troubleshooting

### "Missing Supabase credentials"
- Check `.env` file exists and has correct values
- Verify variables added to Netlify

### "Function not found (404)"
- Check `netlify.toml` has correct functions directory
- Redeploy after changes

### "Database table not found"
- Run schema.sql in Supabase SQL Editor
- Check table names match in functions

### "Unauthorized" errors
- Check token not expired
- Verify user has correct role for endpoint
- Clear localStorage and re-login

---

## File Structure
```
traceveilforensics.github.io/
├── admin-login.html           # Admin/customer login page
├── admin-dashboard.html       # Main admin panel
├── customer-dashboard.html    # Customer portal
├── register.html              # Customer registration
├── netlify/
│   ├── functions/
│   │   ├── auth-login.js      # Login endpoint
│   │   ├── auth-register.js   # Registration endpoint
│   │   ├── admin-services.js  # Services management
│   │   ├── admin-invoices.js  # Invoice management
│   │   ├── admin-customers.js # Customer management
│   │   ├── admin-reports.js   # Reports endpoint
│   │   ├── customer-invoices.js
│   │   ├── customer-requests.js
│   │   ├── customer-profile.js
│   │   └── utils/
│   │       ├── database.js    # Supabase client
│   │       ├── auth.js        # JWT helpers
│   │       └── helpers.js     # Utility functions
├── database/
│   └── schema.sql             # Database schema
├── .env.example               # Environment template
├── netlify.toml              # Netlify configuration
└── package.json              # Dependencies
```

---

## Support
For issues or questions:
1. Check browser console for errors
2. Verify all environment variables are set
3. Ensure database schema is properly executed
4. Check Netlify function logs in dashboard
