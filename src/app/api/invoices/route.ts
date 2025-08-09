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
