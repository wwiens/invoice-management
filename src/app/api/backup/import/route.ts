import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { BackupService } from "@/utils/backup";

export async function POST(request: Request) {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const body = await request.json();
    const { clearExisting = false, ...data } = body;
    const validatedData = await BackupService.validateBackup(data);
    
    await client.query("BEGIN");

    // Only clear existing data if explicitly requested
    if (clearExisting) {
      await client.query("DELETE FROM invoice_items");
      await client.query("DELETE FROM invoices");  
      await client.query("DELETE FROM clients");
    }

    // Import clients (skip duplicates)
    for (const clientData of validatedData.clients) {
      const cd = clientData as any;
      await client.query(
        `INSERT INTO clients (
          id, name, address, city, state, zip_code, tax_id,
          email, phone, default_unit_price, billing_address_street, billing_address_city, 
          billing_address_state, billing_address_zip, requires_course_info, user_id,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO NOTHING`,
        [
          cd.id,
          cd.name,
          cd.address || '',
          cd.city || '',
          cd.state || '',
          cd.zip_code || '',
          cd.tax_id || '',
          cd.email || '',
          cd.phone || null,
          cd.default_unit_price || null,
          cd.billing_address_street || null,
          cd.billing_address_city || null,
          cd.billing_address_state || null,
          cd.billing_address_zip || null,
          cd.requires_course_info || false,
          cd.user_id || 'imported-user',
          cd.created_at || new Date().toISOString(),
          cd.updated_at || new Date().toISOString()
        ]
      );
    }

    // Import invoices and their items
    for (const invoice of validatedData.invoices) {
      // Insert invoice
      const inv = invoice as any;
      await client.query(
        `INSERT INTO invoices (
          id, number, client_id, status, subtotal, tax, total,
          issued_date, due_date, notes, payment_method, transaction_id, payment_date,
          course_name, course_id, cohort, training_dates,
          payment_terms_days, payment_terms_description, user_id,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        ON CONFLICT (id) DO NOTHING`,
        [
          inv.id,
          inv.number || inv.invoice_number || inv.invoiceNumber,
          inv.client_id || inv.clientId,
          inv.status || "pending",
          inv.subtotal || 0,
          inv.tax || inv.taxAmount || inv.tax_amount || 0,
          inv.total || inv.amount || 0,
          inv.issued_date || inv.issuedDate || inv.issueDate,
          inv.due_date || inv.dueDate,
          inv.notes || null,
          inv.payment_method || inv.paymentMethod || null,
          inv.transaction_id || null,
          inv.payment_date || inv.paymentDate || null,
          inv.course_name || null,
          inv.course_id || null,
          inv.cohort || null,
          inv.training_dates || null,
          inv.payment_terms_days || null,
          inv.payment_terms_description || null,
          inv.user_id || 'imported-user',
          inv.created_at || new Date().toISOString(),
          inv.updated_at || new Date().toISOString()
        ]
      );

      // Insert invoice items
      if (invoice.items && Array.isArray(invoice.items)) {
        for (const item of invoice.items) {
          const itm = item as any;
          await client.query(
            `INSERT INTO invoice_items (
              id, invoice_id, description, 
              quantity, unit_price, amount, user_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO NOTHING`,
            [
              itm.id,
              itm.invoiceId || itm.invoice_id || invoice.id,
              itm.description,
              itm.quantity || 1,
              itm.price || itm.unit_price || 0,
              itm.amount || 0,
              itm.user_id || inv.user_id || 'imported-user'
            ]
          );
        }
      }
    }

    await client.query("COMMIT");

    return NextResponse.json({ 
      success: true, 
      message: "Data imported successfully",
      stats: {
        clients: validatedData.clients.length,
        invoices: validatedData.invoices.length
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error importing data:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import data" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}