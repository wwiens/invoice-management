-- Remove the default 'temp_user' values from user_id columns
-- This ensures new records must have a proper user_id set

-- Remove default values from user_id columns
ALTER TABLE clients ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE courses ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE invoices ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE invoice_items ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE invoice_attachments ALTER COLUMN user_id DROP DEFAULT;

-- Verify the constraints
SELECT 
    table_name,
    column_name,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE column_name = 'user_id' 
AND table_schema = 'public'
ORDER BY table_name;