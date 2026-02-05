# Password Management Guide

## Default Admin Credentials
| Field | Value |
|-------|-------|
| Email | admin@traceveilforensics.com |
| Password | Admin@123 |

## Generate New Password Hash
```bash
# Interactive mode
npm run hash

# Generate hash for specific password
node password.js yourpassword

# Compare password with hash
npm run hash:compare
```

## Password Requirements
- Minimum 6 characters
- Use strong passwords in production

## Database Setup Order
1. Run `database/schema.sql` - Creates all tables
2. Run `database/admin-user.sql` - Creates admin account

## Changing Password
1. Generate new hash: `node password.js NewPass@123`
2. Update in Supabase:
```sql
UPDATE users 
SET password_hash = '$2a$10$new_hash_here', 
    updated_at = NOW()
WHERE email = 'admin@traceveilforensics.com';
```

## Security Tips
- Never share passwords
- Use unique passwords for each environment
- Enable 2FA on Supabase account
- Rotate passwords regularly
- Store hashes, never plain passwords
