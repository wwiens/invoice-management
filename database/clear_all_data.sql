-- Clear all existing data from database tables
-- This will remove all invoices, clients, courses, etc. to start fresh with multi-user setup

-- Disable foreign key checks temporarily (PostgreSQL equivalent)
SET session_replication_role = replica;

-- Clear all data from tables (order matters due to foreign keys)
DELETE FROM invoice_attachments;
DELETE FROM invoice_items;
DELETE FROM invoices;
DELETE FROM clients;
DELETE FROM courses;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Reset sequences if needed (optional, keeps IDs starting from 1)
-- Note: Since we're using UUIDs, we don't need to reset sequences

-- Verify tables are empty
SELECT 'clients' as table_name, COUNT(*) as row_count FROM clients
UNION ALL
SELECT 'courses' as table_name, COUNT(*) as row_count FROM courses  
UNION ALL
SELECT 'invoices' as table_name, COUNT(*) as row_count FROM invoices
UNION ALL
SELECT 'invoice_items' as table_name, COUNT(*) as row_count FROM invoice_items
UNION ALL
SELECT 'invoice_attachments' as table_name, COUNT(*) as row_count FROM invoice_attachments;