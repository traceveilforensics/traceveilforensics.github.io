-- Migration: Add service_name column to service_requests table
-- This stores the service name for display purposes

-- Add service_name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_requests' AND column_name = 'service_name'
    ) THEN
        ALTER TABLE service_requests ADD COLUMN service_name VARCHAR(200);
        RAISE NOTICE 'Added service_name column to service_requests table';
    ELSE
        RAISE NOTICE 'service_name column already exists in service_requests table';
    END IF;
END $$;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'service_requests' 
ORDER BY ordinal_position;
