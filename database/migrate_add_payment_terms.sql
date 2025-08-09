-- Migration: Add payment terms to invoices table
-- Run this migration to add payment terms functionality

-- Add payment terms columns to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_terms_description VARCHAR(100);

-- Add index for payment terms lookups
CREATE INDEX IF NOT EXISTS idx_invoices_payment_terms_days ON invoices(payment_terms_days);

-- Update the invoice_summary view to include payment terms
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
  i.payment_terms_days,
  i.payment_terms_description,
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
JOIN clients c ON i.client_id = c.id
ORDER BY i.created_at DESC;