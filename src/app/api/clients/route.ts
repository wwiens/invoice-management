import {
  createClient,
  getAllClients,
  getClientsWithInvoiceCounts,
  searchClients,
} from "@/services/clientService";
import type { CreateClientData } from "@/types/client";
import { NextResponse } from "next/server";

// GET /api/clients - Get all clients
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const withInvoiceCounts = searchParams.get("withCounts") === "true";

    let clients;

    if (search) {
      clients = await searchClients(search);
    } else if (withInvoiceCounts) {
      clients = await getClientsWithInvoiceCounts();
    } else {
      clients = await getAllClients();
    }

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Failed to fetch clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 },
    );
  }
}

// POST /api/clients - Create a new client
export async function POST(request: Request) {
  try {
    const clientData: CreateClientData = await request.json();

    // Basic validation
    if (!clientData.name || !clientData.address || !clientData.city || !clientData.state || !clientData.zipCode) {
      return NextResponse.json(
        { error: "Name, address, city, state, and zip code are required" },
        { status: 400 },
      );
    }

    const newClient = await createClient(clientData);
    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error("Failed to create client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 },
    );
  }
}
