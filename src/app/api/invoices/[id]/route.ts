import {
  deleteInvoice,
  getInvoiceById,
  updateInvoice,
} from "@/services/invoiceService";
import { NextResponse } from "next/server";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/invoices/[id] - Get invoice by ID
export async function GET(request: Request, { params }: RouteParams) {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json(
        { error: "Invalid invoice ID format" },
        { status: 400 },
      );
    }

    const invoice = await getInvoiceById(params.id);

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Failed to fetch invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 },
    );
  }
}

// PUT /api/invoices/[id] - Update an invoice
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json(
        { error: "Invalid invoice ID format" },
        { status: 400 },
      );
    }

    const body = await request.json();

    // Basic validation for required fields
    if (!body.clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 },
      );
    }

    const invoiceData = {
      ...body,
      clientId: body.clientId,
    };

    const invoice = await updateInvoice(params.id, invoiceData);
    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Failed to update invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 },
    );
  }
}

// DELETE /api/invoices/[id] - Delete an invoice
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json(
        { error: "Invalid invoice ID format" },
        { status: 400 },
      );
    }

    const deleted = await deleteInvoice(params.id);

    if (!deleted) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete invoice:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 },
    );
  }
}
