-- Migration: Add plan_name column to service_requests table

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_requests' AND column_name = 'plan_name'
    ) THEN
        ALTER TABLE service_requests ADD COLUMN plan_name VARCHAR(200);
        RAISE NOTICE 'Added plan_name column';
    END IF;
END $$;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'service_requests' 
ORDER BY ordinal_position;
