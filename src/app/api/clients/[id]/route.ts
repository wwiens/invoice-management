import {
  deleteClient,
  getClientById,
  updateClient,
} from "@/services/clientService";
import type { UpdateClientData } from "@/types/client";
import { NextResponse } from "next/server";

// GET /api/clients/[id] - Get a specific client
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const client = await getClientById(params.id);

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Failed to fetch client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 },
    );
  }
}

// PUT /api/clients/[id] - Update a client
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const clientData: Partial<UpdateClientData> = await request.json();

    // Validate email format if provided
    if (clientData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clientData.email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 },
        );
      }
    }

    const updatedClient = await updateClient({
      ...clientData,
      id: params.id,
    });

    if (!updatedClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error("Failed to update client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 },
    );
  }
}

// DELETE /api/clients/[id] - Delete a client
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const success = await deleteClient(params.id);

    if (!success) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Failed to delete client:", error);

    if (error instanceof Error && error.message.includes("existing invoices")) {
      return NextResponse.json(
        { error: "Cannot delete client with existing invoices" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 },
    );
  }
}
