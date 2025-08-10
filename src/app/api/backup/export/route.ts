import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  const pool = getPool();
  
  try {
    // Fetch all clients
    const clientsResult = await pool.query(
      "SELECT * FROM clients ORDER BY name"
    );

    // Fetch all invoices with their items
    const invoicesResult = await pool.query(`
      SELECT 
        i.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ii.id,
              'invoiceId', ii.invoice_id,
              'description', ii.description,
              'quantity', ii.quantity,
              'price', ii.unit_price,
              'amount', ii.amount
            ) ORDER BY ii.id
          ) FILTER (WHERE ii.id IS NOT NULL),
          '[]'::json
        ) as items
      FROM invoices i
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `);

    const invoices = invoicesResult.rows.map((invoice: any) => ({
      ...invoice,
      items: invoice.items || []
    }));

    // Settings will be handled on the client side from localStorage
    const backupData = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      settings: {}, // Will be filled in by client-side code with localStorage data
      clients: clientsResult.rows,
      invoices: invoices
    };

    return NextResponse.json(backupData);
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}