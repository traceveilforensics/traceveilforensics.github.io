-- Migration: Add user_id column to customers table
-- This links Supabase Auth users to customer records
-- Run this in Supabase SQL Editor

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE customers ADD COLUMN user_id UUID;
        RAISE NOTICE 'Added user_id column to customers table';
    ELSE
        RAISE NOTICE 'user_id column already exists in customers table';
    END IF;
END $$;

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

-- Add unique constraint on user_id (one auth user = one customer)
DO $$
BEGIN
    -- First check if constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'customers_user_id_unique'
    ) THEN
        -- Remove duplicates first (keep the most recent one)
        WITH duplicates AS (
            SELECT id, 
                   ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
            FROM customers
            WHERE user_id IS NOT NULL
        )
        DELETE FROM customers WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
        
        -- Now add the constraint
        BEGIN
            ALTER TABLE customers ADD CONSTRAINT customers_user_id_unique UNIQUE (user_id);
            RAISE NOTICE 'Added unique constraint on user_id';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not add unique constraint: %', SQLERRM;
        END;
    END IF;
END $$;

-- Update existing customers to link with auth users based on email
-- This matches customers.email with auth.users.email
UPDATE customers c
SET user_id = au.id
FROM auth.users au
WHERE c.email = au.email
AND c.user_id IS NULL;

-- Verify the changes
SELECT 
    'user_id column exists' as status,
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'customers' AND column_name = 'user_id';

-- Count linked customers
SELECT 
    COUNT(*) as total_customers,
    COUNT(user_id) as linked_to_auth,
    COUNT(*) - COUNT(user_id) as not_linked
FROM customers;
