# Netlify Deployment Guide for Trace Veil Forensics

## Quick Deploy

1. Push this repository to GitHub/GitLab/Bitbucket

2. Go to https://netlify.com and sign up/login

3. Click "Add new site" → "Import an existing project"

4. Select your repository

5. Click "Deploy site"

---

## Configure Email Notifications (Netlify Forms)

1. In Netlify Dashboard, go to **Site settings → Forms**

2. Find "Form notifications" section

3. Click "Add notification" → "Email notification"

4. Enter: `traceveilforensics@gmail.com`

5. Click "Save"

Now you'll receive emails for every form submission!

---

## Configure WhatsApp Notifications

### Step 1: Get CallMeBot API Key
1. Go to https://www.callmebot.com/whatsapp.php
2. Follow instructions to link your WhatsApp number
3. Copy your API key

### Step 2: Add Environment Variables
1. In Netlify Dashboard, go to **Site settings → Environment variables**

2. Add these variables:
   - `WHATSAPP_NUMBER` = `254731570131`
   - `CALLMEBOT_API_KEY` = `your-api-key-here`

3. Click "Save"

### Step 3: Redeploy
- The WhatsApp function will automatically use these variables
- Trigger a new deploy if needed

---

## Test the Setup

1. Visit your deployed site
2. Fill out the contact form
3. Check:
   - [ ] Email arrives at traceveilforensics@gmail.com
   - [ ] WhatsApp message received (if API key configured)

---

## Files for Netlify

```
netlify/
├── functions/
│   └── whatsapp-notify.js    # Serverless function for WhatsApp
├── netlify.toml              # Build configuration
└── README.md                 # This file
```

---

## Troubleshooting

**No email received?**
- Check Netlify form submissions log
- Verify email notification is enabled in settings
- Check spam folder

**WhatsApp not working?**
- Verify CallMeBot API key is correct
- Check Netlify Function logs (Functions → whatsapp-notify)
- Ensure environment variables are set

**Form not submitting?**
- Ensure `data-netlify="true"` is on the form tag
- Check browser console for errors
- Verify no JavaScript errors on the page
