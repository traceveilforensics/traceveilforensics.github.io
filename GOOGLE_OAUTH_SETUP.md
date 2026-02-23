# Google OAuth Setup Guide for Trace Veil Forensics

This guide will walk you through setting up Google OAuth 2.0 for your website's sign-in functionality.

## Prerequisites
- A Google Account (personal or workspace)
- Access to [Google Cloud Console](https://console.cloud.google.com/)

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the **project dropdown** in the top-left corner
3. Click **"New Project"**
4. Enter project name: `Trace Veil Forensics`
5. Click **"Create"**
6. Wait for the project to be created (you'll see a notification)

---

## Step 2: Enable the Google People API

1. In the left sidebar, go to **APIs & Services** → **Library**
2. In the search bar, type **"People API"** or **"Google+ API"**
3. Click on **"Google People API"**
4. Click **"Enable"**
5. Wait for the API to enable

---

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **"External"** (since this is a public website)
3. Click **"Create"**

4. Fill in the required fields:
   - **App name**: `Trace Veil Forensics`
   - **User support email**: Your email address
   - **Developer contact email**: Your email address

5. Scroll down and click **"Save and Continue"**

6. On the **Scopes** page:
   - Click **"Add or remove scopes"**
   - Select these scopes:
     - `.../auth/userinfo.email` (See your primary email address)
     - `.../auth/userinfo.profile` (See your personal info)
   - Click **"Update"**
   - Click **"Save and Continue"**

7. On the **Test users** page:
   - Click **"Add users"**
   - Enter your email address (you need to add yourself as a test user to test before publishing)
   - Click **"Save and Continue"**

8. Review the summary and click **"Back to Dashboard"**

---

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ Create Credentials"**
3. Select **"OAuth client ID"**
4. Select **"Web application"** as the application type
5. Enter a name: `Trace Veil Web Client`

6. Under **Authorized JavaScript origins**, click **"+ Add URI"** and add:
   ```
   http://localhost
   https://traceveilforensics.netlify.app
   ```

7. Under **Authorized redirect URIs**, click **"+ Add URI"** and add:
   ```
   https://traceveilforensics.netlify.app/
   ```

8. Click **"Create"**

9. A modal will appear with your **Client ID** and **Client Secret**:
   - Copy the **Client ID** (it will look like: `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`)
   - Copy the **Client Secret**

---

## Step 5: Update Your Website Code

### Option A: Update the HTML files directly

**In `login.html` (line 12):**
```html
<meta name="google-signin-client_id" content="YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com">
```

**In `register.html` (line 12):**
```html
<meta name="google-signin-client_id" content="YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com">
```

Replace `YOUR_ACTUAL_CLIENT_ID` with the Client ID you copied.

### Option B: Using JavaScript (alternative)

You can also set the client ID dynamically in the `handleGoogleLogin()` and `handleGoogleRegister()` functions by replacing:
```javascript
const clientId = document.querySelector('meta[name="google-signin-client_id"]').content;
```

With your actual client ID:
```javascript
const clientId = 'xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com';
```

---

## Step 6: Publish Your OAuth App (Optional - for production)

By default, your OAuth app is in "Test" mode and only allows the test users you added. To allow anyone with a Google account to sign in:

1. Go to **APIs & Services** → **OAuth consent screen**
2. Click **"Publish App"**
3. Click **"Confirm"**

---

## Step 7: Test the Integration

1. Run your website locally or deploy to Netlify
2. Go to the login page: `https://traceveilforensics.netlify.app/login.html`
3. Click the **"Continue with Google"** button
4. A Google sign-in popup should appear
5. Sign in with your Google account
6. You should be redirected to the customer dashboard

---

## Troubleshooting

### "Error: origin_mismatch"
- Make sure your JavaScript origin URLs match exactly in Google Console
- Check for trailing slashes - they must match

### "Error: disallowed_user"
- Go to OAuth consent screen and add your email as a test user
- Or publish your app

### "Error: popup_closed_by_user"
- User closed the popup before completing sign-in
- This is normal behavior

### Google button not showing
- Check that the Google script is loading: `https://accounts.google.com/gsi/client`
- Check browser console for JavaScript errors

---

## Security Notes

1. **Keep your Client Secret secure** - Never commit it to GitHub
2. **Validate the ID token** - In production, validate the JWT on the server side
3. **Use HTTPS** - Required for OAuth in production
4. **Review permissions** - Only request necessary scopes

---

## Your Credentials (Fill this in)

| Field | Value |
|-------|-------|
| Client ID | `________________________________` |
| Client Secret | `________________________________` |

---

## Need Help?

If you encounter issues, check:
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Identity Services](https://developers.google.com/identity/gsi/web/guides/overview)
