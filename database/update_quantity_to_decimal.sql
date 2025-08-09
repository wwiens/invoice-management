-- Update quantity column to support decimal values
-- This allows quantities like 1.5, 0.25, etc.

-- Update the quantity column in invoice_items table to DECIMAL(10,3)
-- This allows up to 10 digits total with 3 decimal places (e.g., 9999999.123)
ALTER TABLE invoice_items 
ALTER COLUMN quantity TYPE DECIMAL(10,3);

-- Verify the column change
SELECT 
    column_name, 
    data_type, 
    numeric_precision, 
    numeric_scale,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoice_items' 
  AND column_name = 'quantity';