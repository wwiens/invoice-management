import {
  createInvoice,
  getAllInvoices,
  updateInvoiceStatus,
} from "@/services/invoiceService";
import type { InvoiceStatus } from "@/types/invoice";
import { NextResponse } from "next/server";

// GET /api/invoices - Get all invoices
export async function GET() {
  try {
    const invoices = await getAllInvoices();
    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 },
    );
  }
}

// PATCH /api/invoices - Update invoice status
export async function PATCH(request: Request) {
  try {
    const { id, status, paymentData } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "Invoice ID and status are required" },
        { status: 400 },
      );
    }

    // Validate status
    const validStatuses = ['paid', 'pending', 'draft', 'overdue'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid invoice status" },
        { status: 400 },
      );
    }

    // Validate UUID format for id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid invoice ID format" },
        { status: 400 },
      );
    }

    const updatedInvoice = await updateInvoiceStatus(
      id,
      status as InvoiceStatus,
      paymentData,
    );

    if (!updatedInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error("Failed to update invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 },
    );
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Input validation
    if (!body.clientId || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "Client ID and at least one item are required" },
        { status: 400 },
      );
    }

    if (typeof body.subtotal !== 'number' || typeof body.tax !== 'number' || typeof body.total !== 'number') {
      return NextResponse.json(
        { error: "Invalid subtotal, tax, or total values" },
        { status: 400 },
      );
    }

    const invoiceData = {
      ...body,
      clientId: body.clientId,
    };

    const invoice = await createInvoice(invoiceData);
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Failed to create invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 },
    );
  }
}
