-- Migration: Add new fields to clients table
-- Run this script to update existing database with new client fields

-- Add email column (required, but we'll set a default first)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Update existing rows with a placeholder email
UPDATE clients 
SET email = CONCAT('client-', id, '@example.com')
WHERE email IS NULL;

-- Now make email required
ALTER TABLE clients 
ALTER COLUMN email SET NOT NULL;

-- Add phone column (optional)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- Add default unit price column (optional)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS default_unit_price DECIMAL(10,2);

-- Add billing address columns (all optional)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS billing_address_street TEXT,
ADD COLUMN IF NOT EXISTS billing_address_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS billing_address_state VARCHAR(50),
ADD COLUMN IF NOT EXISTS billing_address_zip VARCHAR(20);

-- Update some sample clients with default unit prices if they exist
UPDATE clients SET default_unit_price = 150.00 WHERE name = 'Stark Corporation';
UPDATE clients SET default_unit_price = 250.00 WHERE name = 'Globus Enterprise';
UPDATE clients SET default_unit_price = 200.00 WHERE name = 'Luxcamp PLC';
UPDATE clients SET default_unit_price = 210.00 WHERE name = 'Bonds Enterprise';
UPDATE clients SET default_unit_price = 100.00 WHERE name = 'Infinium Ltd';
UPDATE clients SET default_unit_price = 180.00 WHERE name = 'Sterling PLC';
UPDATE clients SET default_unit_price = 200.00 WHERE name = 'Evol Inc';

-- Add sample emails for existing clients if they match our mock data
UPDATE clients SET email = 'finance@starkcorp.com' WHERE name = 'Stark Corporation' AND email LIKE 'client-%@example.com';
UPDATE clients SET email = 'billing@globusent.com' WHERE name = 'Globus Enterprise' AND email LIKE 'client-%@example.com';
UPDATE clients SET email = 'accounts@luxcamp.co.uk' WHERE name = 'Luxcamp PLC' AND email LIKE 'client-%@example.com';
UPDATE clients SET email = 'finance@bondsent.com' WHERE name = 'Bonds Enterprise' AND email LIKE 'client-%@example.com';
UPDATE clients SET email = 'billing@infinium.com' WHERE name = 'Infinium Ltd' AND email LIKE 'client-%@example.com';
UPDATE clients SET email = 'payments@sterling.com' WHERE name = 'Sterling PLC' AND email LIKE 'client-%@example.com';
UPDATE clients SET email = 'finance@evolinc.com' WHERE name = 'Evol Inc' AND email LIKE 'client-%@example.com';

-- Add sample phone numbers for existing clients
UPDATE clients SET phone = '+1 (212) 555-0123' WHERE name = 'Stark Corporation';
UPDATE clients SET phone = '+1 (323) 555-0456' WHERE name = 'Globus Enterprise';
UPDATE clients SET phone = '+1 (312) 555-0789' WHERE name = 'Luxcamp PLC';
UPDATE clients SET phone = '+1 (305) 555-0321' WHERE name = 'Bonds Enterprise';
UPDATE clients SET phone = '+1 (512) 555-0654' WHERE name = 'Infinium Ltd';
UPDATE clients SET phone = '+1 (206) 555-0987' WHERE name = 'Sterling PLC';
UPDATE clients SET phone = '+1 (415) 555-0147' WHERE name = 'Evol Inc';