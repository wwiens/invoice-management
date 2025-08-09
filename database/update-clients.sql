-- Update clients table to match the Client interface
-- Add missing fields: email, phone, billing_address fields

-- Add email and phone columns
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- Add billing address fields (separate from main address)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_city VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_state VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_zip_code VARCHAR(20);

-- Update existing clients with email addresses
UPDATE clients SET email = 'finance@starkcorp.com' WHERE name = 'Stark Corporation';
UPDATE clients SET email = 'billing@globusent.com' WHERE name = 'Globus Enterprise';
UPDATE clients SET email = 'accounts@luxcamp.co.uk' WHERE name = 'Luxcamp PLC';
UPDATE clients SET email = 'finance@bondsent.com' WHERE name = 'Bonds Enterprise';
UPDATE clients SET email = 'billing@infinium.com' WHERE name = 'Infinium Ltd';
UPDATE clients SET email = 'payments@sterling.com' WHERE name = 'Sterling PLC';
UPDATE clients SET email = 'finance@evolinc.com' WHERE name = 'Evol Inc';

-- Update existing clients with phone numbers
UPDATE clients SET phone = '+1 (212) 555-0123' WHERE name = 'Stark Corporation';
UPDATE clients SET phone = '+1 (323) 555-0456' WHERE name = 'Globus Enterprise';
UPDATE clients SET phone = '+1 (312) 555-0789' WHERE name = 'Luxcamp PLC';
UPDATE clients SET phone = '+1 (305) 555-0321' WHERE name = 'Bonds Enterprise';
UPDATE clients SET phone = '+1 (512) 555-0654' WHERE name = 'Infinium Ltd';
UPDATE clients SET phone = '+1 (206) 555-0987' WHERE name = 'Sterling PLC';
UPDATE clients SET phone = '+1 (415) 555-0147' WHERE name = 'Evol Inc';