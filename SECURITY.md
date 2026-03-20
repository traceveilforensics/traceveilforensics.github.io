# Security Setup Guide

## Environment Variables for Netlify

Set these in Netlify Dashboard → Site Settings → Environment Variables:

```
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcGtwcHBmdHJ4cnd0d2piY2VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE5ODc0OCwiZXhwIjoyMDg1Nzc0NzQ4fQ.fVgPaQWfFbKu7ZacfLjK8mtKNlaLmSchS-XoY75Ejew
```

## Supabase Security Checklist

1. ✅ Enable RLS on all tables
2. ✅ Set up proper RLS policies
3. ✅ Use anon key for public operations
4. ⚠️ Move service role key to server-side (Netlify Functions)

## Current Status

| Operation | Security Level |
|-----------|---------------|
| Login/Register | ✅ Secure (Supabase Auth) |
| Read data | ✅ Secure (RLS policies) |
| Admin CRUD | ⚠️ Uses service key in frontend |
| Customer data | ✅ Secure (RLS policies) |

## To Fully Secure

1. Move all `SB_SVC` calls to use Netlify Functions
2. Use `nfFetch()` helper for data operations
3. Use `nfAuth()` for admin auth operations

## Supabase Dashboard Settings

Go to Authentication → Settings:
- Enable email confirmations: OFF (for testing) or ON (for production)
- Set minimum password length: 6
- Enable sign in with email: ON
