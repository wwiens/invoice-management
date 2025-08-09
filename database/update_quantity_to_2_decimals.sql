-- Update quantity column to use 2 decimal places instead of 3
-- This is more practical for most use cases (e.g., 0.5, 1.25, 2.75)

-- Update the quantity column in invoice_items table to DECIMAL(10,2)
-- This allows up to 10 digits total with 2 decimal places (e.g., 99999999.99)
ALTER TABLE invoice_items 
ALTER COLUMN quantity TYPE DECIMAL(10,2);

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