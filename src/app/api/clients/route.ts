import {
  createClient,
  getAllClients,
  getClientsWithInvoiceCounts,
  searchClients,
} from "@/services/clientService";
import type { CreateClientData } from "@/types/client";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-middleware";

// GET /api/clients - Get all clients
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const withInvoiceCounts = searchParams.get("withCounts") === "true";

    let clients;

    if (search) {
      clients = await searchClients(search, userId);
    } else if (withInvoiceCounts) {
      clients = await getClientsWithInvoiceCounts(userId);
    } else {
      clients = await getAllClients(userId);
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
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientData: CreateClientData = await request.json();

    // Basic validation
    if (!clientData.name || !clientData.address || !clientData.city || !clientData.state || !clientData.zipCode) {
      return NextResponse.json(
        { error: "Name, address, city, state, and zip code are required" },
        { status: 400 },
      );
    }

    const newClient = await createClient(clientData, userId);
    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error("Failed to create client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 },
    );
  }
}
