-- Migration: Add requires_course_info column to clients table
-- This field determines whether course information should be collected and displayed for a client

-- Add the column with a default value of false
ALTER TABLE clients 
ADD COLUMN requires_course_info BOOLEAN DEFAULT FALSE;

-- Update existing clients with some example settings
-- In a real migration, you might want to set this based on business logic
UPDATE clients 
SET requires_course_info = TRUE 
WHERE name IN ('Stark Corporation', 'Luxcamp PLC', 'Infinium Ltd', 'Evol Inc');

-- Add a comment to document the column
COMMENT ON COLUMN clients.requires_course_info IS 'Whether this client requires course information on invoices';