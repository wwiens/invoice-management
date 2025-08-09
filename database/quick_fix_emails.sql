-- Quick fix to add email column if it doesn't exist
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Update existing clients with proper emails
UPDATE clients SET email = 'finance@starkcorp.com' WHERE name = 'Stark Corporation';
UPDATE clients SET email = 'billing@globusent.com' WHERE name = 'Globus Enterprise';
UPDATE clients SET email = 'accounts@luxcamp.co.uk' WHERE name = 'Luxcamp PLC';
UPDATE clients SET email = 'finance@bondsent.com' WHERE name = 'Bonds Enterprise';
UPDATE clients SET email = 'billing@infinium.com' WHERE name = 'Infinium Ltd';
UPDATE clients SET email = 'payments@sterling.com' WHERE name = 'Sterling PLC';
UPDATE clients SET email = 'finance@evolinc.com' WHERE name = 'Evol Inc';

-- Set a default for any remaining nulls
UPDATE clients 
SET email = CONCAT(LOWER(REPLACE(name, ' ', '.')), '@example.com')
WHERE email IS NULL OR email LIKE 'client-%@example.com';

-- Now make email required for future inserts
ALTER TABLE clients 
ALTER COLUMN email SET NOT NULL;