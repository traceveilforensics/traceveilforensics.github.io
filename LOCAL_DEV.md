# Local Development Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Visit: http://localhost:3000

### 3. For Full Backend (Local API + Auth)
```bash
npm run server
```
Visit: http://localhost:8888

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run server` | Start Express server with local API |
| `npm run start` | Start production server on port 8888 |
| `npm run hash:generate` | Generate password hash |

---

## Workflow

### A. Develop with Local Server (Recommended)
1. Run `npm run server`
2. Open http://localhost:8888
3. All API endpoints work locally
4. Admin: admin@traceveilforensics.com / Admin@123

### B. Test Netlify Functions Locally
```bash
npm run netlify-functions:serve
```

---

## Deploy to Netlify

1. Push to GitHub:
```bash
git add .
git commit -m "Ready for production"
git push origin main
```

2. Connect to Netlify:
   - Go to https://netlify.com
   - Import your GitHub repository
   - Netlify auto-detects settings from netlify.toml
   - Deploy!

---

## Environment Variables (Netlify)

In Netlify Dashboard → Site Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| SUPABASE_URL | Your Supabase project URL |
| SUPABASE_ANON_KEY | Your Supabase anon key |
| JWT_SECRET | Any random secure string |

---

## Admin Login

- **Email:** admin@traceveilforensics.com
- **Password:** Admin@123

Change these credentials after first login!
