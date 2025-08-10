import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { BackupService } from "@/utils/backup";

export async function POST(request: Request) {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const data = await request.json();
    const validatedData = await BackupService.validateBackup(data);
    
    await client.query("BEGIN");

    // Clear existing data (optional - you might want to make this configurable)
    await client.query("DELETE FROM invoice_items");
    await client.query("DELETE FROM invoices");
    await client.query("DELETE FROM clients");

    // Import clients
    for (const clientData of validatedData.clients) {
      await client.query(
        `INSERT INTO clients (
          id, name, email, phone, address, 
          contact_person, notes, requires_course_info,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          clientData.id,
          clientData.name,
          clientData.email || null,
          clientData.phone || null,
          clientData.address || null,
          (clientData as any).contactPerson || (clientData as any).contact_person || null,
          (clientData as any).notes || null,
          clientData.requiresCourseInfo || (clientData as any).requires_course_info || false,
          clientData.createdAt || (clientData as any).created_at || new Date().toISOString(),
          clientData.updatedAt || (clientData as any).updated_at || new Date().toISOString()
        ]
      );
    }

    // Import invoices and their items
    for (const invoice of validatedData.invoices) {
      // Insert invoice
      const inv = invoice as any;
      await client.query(
        `INSERT INTO invoices (
          id, client_id, invoice_number, issue_date, due_date,
          status, subtotal, tax_rate, tax_amount, discount_amount,
          total, notes, payment_method, payment_date,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          inv.id,
          inv.client || inv.client_id || inv.clientId,
          inv.number || inv.invoice_number || inv.invoiceNumber,
          inv.issuedDate || inv.issue_date || inv.issueDate,
          inv.dueDate || inv.due_date,
          inv.status || "pending",
          inv.subtotal || 0,
          inv.taxRate || inv.tax_rate || 0,
          inv.taxAmount || inv.tax_amount || 0,
          inv.discountAmount || inv.discount_amount || 0,
          inv.total || inv.amount || 0,
          inv.notes || null,
          inv.paymentMethod || inv.payment_method || null,
          inv.paymentDate || inv.payment_date || null,
          inv.createdAt || inv.created_at || new Date().toISOString(),
          inv.updatedAt || inv.updated_at || new Date().toISOString()
        ]
      );

      // Insert invoice items
      if (invoice.items && Array.isArray(invoice.items)) {
        for (const item of invoice.items) {
          const itm = item as any;
          await client.query(
            `INSERT INTO invoice_items (
              id, invoice_id, description, 
              quantity, unit_price, amount
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              itm.id,
              itm.invoiceId || itm.invoice_id || invoice.id,
              itm.description,
              itm.quantity || 1,
              itm.price || itm.unit_price || 0,
              itm.amount || 0
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