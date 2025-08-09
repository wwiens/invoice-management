-- Seed data for Profitsor Invoice Management System
-- This script populates the database with existing mock data

-- Insert clients
INSERT INTO clients (id, name, address, city, state, zip_code, tax_id) VALUES 
('d85e7c8f-4b2a-4f6e-9d3a-1b2c3d4e5f6a', 'Stark Corporation', '350 Fifth Avenue', 'New York', 'NY', '10118', '6263727'),
('e95f8d9f-5c3b-5f7f-ae4b-2c3d4e5f6a7b', 'Globus Enterprise', '1234 Business Ave', 'Los Angeles', 'CA', '90210', null),
('fa608ea0-6d4c-6f8f-bf5c-3d4e5f6a7b8c', 'Luxcamp PLC', '789 Corporate Blvd', 'Chicago', 'IL', '60601', null),
('0b719fb1-7e5d-7f9f-cf6d-4e5f6a7b8c9d', 'Bonds Enterprise', '456 Finance St', 'Miami', 'FL', '33101', null),
('1c82a0c2-8f6e-8faf-df7e-5f6a7b8c9dae', 'Infinium Ltd', '321 Tech Park', 'Austin', 'TX', '73301', null),
('2d93b1d3-9f7f-9fbf-ef8f-6a7b8c9daebf', 'Sterling PLC', '654 Enterprise Way', 'Seattle', 'WA', '98101', null),
('3ea4c2e4-af8f-afcf-ff9f-7b8c9daeb0f1', 'Evol Inc', '987 Innovation Dr', 'San Francisco', 'CA', '94105', null);

-- Insert invoices
INSERT INTO invoices (
  id, number, client_id, status, subtotal, tax, total, 
  issued_date, due_date, payment_method, transaction_id, payment_date,
  course_name, course_id, cohort, training_dates, notes
) VALUES 
(
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'INV-2025-0428',
  'd85e7c8f-4b2a-4f6e-9d3a-1b2c3d4e5f6a',
  'paid',
  7500.00,
  0.00,
  7500.00,
  '2025-04-28',
  '2025-04-30',
  'Bank Transfer',
  'TRX-8313521',
  '2025-04-30',
  'Advanced React Development',
  'RCT-101',
  'Fall 2025 Batch A',
  'Jan 15-17, 22-24, 29-31, 2025',
  'Thank you for your business. Payment is due within 14 days of invoice date. Please make payment via bank transfer using the reference number INV-2025-0428.'
),
(
  'f57bd21c-59dd-5483-b678-1f13c3d4e58a',
  'INV-2025-0423',
  'e95f8d9f-5c3b-5f7f-ae4b-2c3d4e5f6a7b',
  'pending',
  2500.00,
  0.00,
  2500.00,
  '2025-04-23',
  '2025-04-23',
  null,
  null,
  null,
  'Project Management Fundamentals',
  'PMF-202',
  'Winter 2025 Cohort',
  'Feb 5-7, 12-14, 19-21, 2025',
  null
),
(
  'f68ce32d-6aee-6594-c789-2024d4e5f69b',
  'INV-2025-0420',
  'fa608ea0-6d4c-6f8f-bf5c-3d4e5f6a7b8c',
  'draft',
  9000.00,
  0.00,
  9000.00,
  '2025-04-20',
  '2025-04-20',
  null,
  null,
  null,
  'Full-Stack Web Development Bootcamp',
  'FSD-401',
  'Spring 2025 Intensive',
  'Mar 10-14, 17-21, 24-28, 31-Apr 4, 2025',
  null
),
(
  'f79df43e-7bff-76a5-d89a-3135e5f6f7ac',
  'INV-2025-0418',
  '0b719fb1-7e5d-7f9f-cf6d-4e5f6a7b8c9d',
  'overdue',
  2520.00,
  0.00,
  2520.00,
  '2025-04-15',
  '2025-04-18',
  null,
  null,
  null,
  'Data Analytics for Finance',
  'DAF-301',
  'Q1 2025 Executive Program',
  'Jan 8-10, 15-17, 2025',
  null
),
(
  'f8aef54f-8cf0-87b6-e9ab-4246f6f7f8bd',
  'INV-2025-0413',
  '1c82a0c2-8f6e-8faf-df7e-5f6a7b8c9dae',
  'pending',
  2500.00,
  0.00,
  2500.00,
  '2025-04-10',
  '2025-04-13',
  null,
  null,
  null,
  'Modern JavaScript Frameworks',
  'JSF-501',
  'Winter 2025 Evening Class',
  'Dec 2-4, 9-11, 16-18, 2024',
  null
),
(
  'f9bf065f-9df1-98c7-fabc-5357f7f8f9ce',
  'INV-2025-0410',
  '2d93b1d3-9f7f-9fbf-ef8f-6a7b8c9daebf',
  'paid',
  9500.00,
  0.00,
  9500.00,
  '2025-04-10',
  '2025-04-28',
  'Credit Card',
  null,
  '2025-04-25',
  'Enterprise Architecture & Design',
  'EAD-601',
  'Q2 2025 Professional Track',
  'Apr 1-3, 8-10, 15-17, 2025',
  null
),
(
  'facf1760-aef2-a9d8-0bcd-6468f8f9face',
  'INV-2025-0408',
  '3ea4c2e4-af8f-afcf-ff9f-7b8c9daeb0f1',
  'draft',
  6000.00,
  0.00,
  6000.00,
  '2025-04-08',
  '2025-04-28',
  null,
  null,
  null,
  'Advanced UI/UX Design Principles',
  'UXD-701',
  'Design Masters 2025',
  'May 6-8, 13-15, 20-22, 2025',
  null
);

-- Insert invoice items
INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, amount) VALUES 
-- Items for INV-2025-0428 (Stark Corporation)
('11111111-1111-1111-1111-111111111111', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Financial Software License', 3, 1500.00, 4500.00),
('11111111-1111-1111-1111-111111111112', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Implementation Services', 20, 115.00, 2300.00),
('11111111-1111-1111-1111-111111111113', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Technical Support', 1, 700.00, 700.00),

-- Items for INV-2025-0423 (Globus Enterprise)
('22222222-2222-2222-2222-222222222221', 'f57bd21c-59dd-5483-b678-1f13c3d4e58a', 'Consulting Services', 10, 250.00, 2500.00),

-- Items for INV-2025-0420 (Luxcamp PLC)
('33333333-3333-3333-3333-333333333331', 'f68ce32d-6aee-6594-c789-2024d4e5f69b', 'Software Development', 45, 200.00, 9000.00),

-- Items for INV-2025-0418 (Bonds Enterprise)
('44444444-4444-4444-4444-444444444441', 'f79df43e-7bff-76a5-d89a-3135e5f6f7ac', 'Financial Analysis', 12, 210.00, 2520.00),

-- Items for INV-2025-0413 (Infinium Ltd)
('55555555-5555-5555-5555-555555555551', 'f8aef54f-8cf0-87b6-e9ab-4246f6f7f8bd', 'Web Development', 25, 100.00, 2500.00),

-- Items for INV-2025-0410 (Sterling PLC)
('66666666-6666-6666-6666-666666666661', 'f9bf065f-9df1-98c7-fabc-5357f7f8f9ce', 'Enterprise License', 1, 9500.00, 9500.00),

-- Items for INV-2025-0408 (Evol Inc)
('77777777-7777-7777-7777-777777777771', 'facf1760-aef2-a9d8-0bcd-6468f8f9face', 'UI/UX Design', 30, 200.00, 6000.00);

-- Insert sample attachments for the paid invoice
INSERT INTO invoice_attachments (id, invoice_id, name, file_size, file_type) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Invoice_2025-0428.pdf', '235 KB', 'pdf'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Service_Details.xlsx', '156 KB', 'xlsx');