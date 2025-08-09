-- Migration: Add user_id column for Firebase authentication
-- This migration adds user_id column to all tables to support multi-user data isolation

-- Add user_id column to clients table
ALTER TABLE clients ADD COLUMN user_id VARCHAR(255) NOT NULL DEFAULT 'temp_user';
CREATE INDEX idx_clients_user_id ON clients(user_id);

-- Add user_id column to courses table  
ALTER TABLE courses ADD COLUMN user_id VARCHAR(255) NOT NULL DEFAULT 'temp_user';
CREATE INDEX idx_courses_user_id ON courses(user_id);

-- Add user_id column to invoices table
ALTER TABLE invoices ADD COLUMN user_id VARCHAR(255) NOT NULL DEFAULT 'temp_user';
CREATE INDEX idx_invoices_user_id ON invoices(user_id);

-- Add user_id column to invoice_items table
ALTER TABLE invoice_items ADD COLUMN user_id VARCHAR(255) NOT NULL DEFAULT 'temp_user';
CREATE INDEX idx_invoice_items_user_id ON invoice_items(user_id);

-- Add user_id column to invoice_attachments table
ALTER TABLE invoice_attachments ADD COLUMN user_id VARCHAR(255) NOT NULL DEFAULT 'temp_user';
CREATE INDEX idx_invoice_attachments_user_id ON invoice_attachments(user_id);

-- Update the invoice_summary view to include user_id filtering
DROP VIEW IF EXISTS invoice_summary;
CREATE VIEW invoice_summary AS
SELECT 
  i.id,
  i.number,
  i.status,
  i.total,
  i.issued_date,
  i.due_date,
  i.payment_date,
  i.user_id,
  c.name as client_name,
  c.city,
  c.state,
  i.course_name,
  i.cohort,
  CASE 
    WHEN i.status = 'paid' THEN 'paid'
    WHEN i.due_date < CURRENT_DATE AND i.status != 'paid' THEN 'overdue'
    ELSE i.status
  END as computed_status
FROM invoices i
JOIN clients c ON i.client_id = c.id AND i.user_id = c.user_id
ORDER BY i.created_at DESC;

-- Note: After this migration, you'll need to:
-- 1. Remove the DEFAULT 'temp_user' constraints 
-- 2. Update all records with actual Firebase user IDs
-- 3. Add NOT NULL constraints without defaults