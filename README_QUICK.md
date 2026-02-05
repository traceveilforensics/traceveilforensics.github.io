# Trace Veil Forensics - Complete Setup Guide

## Quick Setup (5 Minutes)

### Step 1: Create Supabase Database
1. Go to https://supabase.com
2. Create a new project
3. Go to **SQL Editor**
4. Copy content from `database/full-setup.sql`
5. Click **Run**

### Step 2: Configure Environment
```bash
cp .env.example .env
```
Edit `.env` and add your Supabase credentials from Project Settings → API

### Step 3: Start Development
```bash
npm start
```
Visit: http://127.0.0.1:8888

---

## Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@traceveilforensics.com | Admin@123 |
| Customer | Register at /register.html | Your choice |

---

## Website Navigation
- **Home:** http://127.0.0.1:8888/
- **Sign In:** http://127.0.0.1:8888/login.html
- **Sign Up:** http://127.0.0.1:8888/register.html
- **Admin Dashboard:** http://127.0.0.1:8888/admin-dashboard.html
- **Customer Dashboard:** http://127.0.0.1:8888/customer-dashboard.html

---

## Features
- **Public Website:** Home, About, Services, Pricing, Contact
- **Authentication:** Sign up / Sign in with JWT tokens
- **Admin Panel:** Manage services, invoices, customers, reports
- **Customer Portal:** View invoices, submit service requests, manage profile
- **Accounting:** Invoice creation, payment tracking, financial reports

---

## File Structure
```
├── index.html          # Main website
├── login.html          # Sign in page
├── register.html       # Customer registration
├── admin-dashboard.html # Admin panel
├── customer-dashboard.html # Customer portal
├── database/
│   └── full-setup.sql  # Complete database setup
├── netlify/functions/   # API endpoints
│   ├── auth-login.js
│   ├── auth-register.js
│   ├── admin-*.js
│   └── customer-*.js
└── .env.example       # Environment template
```

---

## For Production Deployment
1. Push to GitHub
2. Connect to Netlify
3. Add environment variables in Netlify dashboard
4. Deploy

---

## Support
See `ADMIN_PANEL_SETUP.md` for detailed documentation.
