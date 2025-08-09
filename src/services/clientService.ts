import { query, transaction } from "@/lib/db";
import type {
  Client,
  CreateClientData,
  UpdateClientData,
} from "@/types/client";
import { PoolClient } from "pg";

// Database types that match our actual schema
interface DbClient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  tax_id?: string;
  default_unit_price?: number;
  requires_course_info?: boolean;
  billing_address_street?: string;
  billing_address_city?: string;
  billing_address_state?: string;
  billing_address_zip?: string;
  created_at: string;
  updated_at: string;
}

// Convert database row to Client object
function dbToClient(row: any): Client {
  return {
    id: row.id,
    name: row.name,
    email: row.email || `client-${row.id}@example.com`, // Fallback for missing email
    phone: row.phone,
    address: row.address,
    city: row.city,
    state: row.state,
    zipCode: row.zip_code,
    taxId: row.tax_id,
    defaultUnitPrice: row.default_unit_price ? parseFloat(row.default_unit_price) : undefined,
    requiresCourseInfo: row.requires_course_info || false,
    billingAddress: row.billing_address_street ? {
      address: row.billing_address_street,
      city: row.billing_address_city!,
      state: row.billing_address_state!,
      zipCode: row.billing_address_zip!,
    } : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Get all clients
export async function getAllClients(userId?: string): Promise<Client[]> {
  let clientsQuery = `
    SELECT * FROM clients 
  `;
  const values: any[] = [];

  if (userId) {
    clientsQuery += ` WHERE user_id = $1 `;
    values.push(userId);
  }
  
  clientsQuery += ` ORDER BY name ASC`;

  const rows = await query<DbClient>(clientsQuery, values);
  return rows.map(dbToClient);
}

// Get client by ID
export async function getClientById(id: string, userId?: string): Promise<Client | null> {
  let clientQuery = "SELECT * FROM clients WHERE id = $1";
  const values = [id];
  
  if (userId) {
    clientQuery += " AND user_id = $2";
    values.push(userId);
  }
  
  const rows = await query<DbClient>(clientQuery, values);

  if (rows.length === 0) return null;
  return dbToClient(rows[0]);
}

// Create a new client
export async function createClient(
  clientData: CreateClientData,
  userId: string,
): Promise<Client> {
  const insertQuery = `
    INSERT INTO clients (
      name, email, phone, address, city, state, zip_code, tax_id, default_unit_price, requires_course_info,
      billing_address_street, billing_address_city, billing_address_state, billing_address_zip, user_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *
  `;

  const values = [
    clientData.name,
    clientData.email,
    clientData.phone,
    clientData.address,
    clientData.city,
    clientData.state,
    clientData.zipCode,
    clientData.taxId,
    clientData.defaultUnitPrice,
    clientData.requiresCourseInfo || false,
    clientData.billingAddress?.address,
    clientData.billingAddress?.city,
    clientData.billingAddress?.state,
    clientData.billingAddress?.zipCode,
    userId,
  ];

  const rows = await query<DbClient>(insertQuery, values);
  return dbToClient(rows[0]);
}

// Update an existing client
export async function updateClient(
  clientData: UpdateClientData,
  userId?: string,
): Promise<Client | null> {
  const updateFields = [];
  const values = [];
  let paramCount = 1;

  if (clientData.name !== undefined) {
    updateFields.push(`name = $${paramCount}`);
    values.push(clientData.name);
    paramCount++;
  }

  if (clientData.email !== undefined) {
    updateFields.push(`email = $${paramCount}`);
    values.push(clientData.email);
    paramCount++;
  }

  if (clientData.phone !== undefined) {
    updateFields.push(`phone = $${paramCount}`);
    values.push(clientData.phone);
    paramCount++;
  }

  if (clientData.address !== undefined) {
    updateFields.push(`address = $${paramCount}`);
    values.push(clientData.address);
    paramCount++;
  }

  if (clientData.city !== undefined) {
    updateFields.push(`city = $${paramCount}`);
    values.push(clientData.city);
    paramCount++;
  }

  if (clientData.state !== undefined) {
    updateFields.push(`state = $${paramCount}`);
    values.push(clientData.state);
    paramCount++;
  }

  if (clientData.zipCode !== undefined) {
    updateFields.push(`zip_code = $${paramCount}`);
    values.push(clientData.zipCode);
    paramCount++;
  }

  if (clientData.taxId !== undefined) {
    updateFields.push(`tax_id = $${paramCount}`);
    values.push(clientData.taxId);
    paramCount++;
  }

  if (clientData.defaultUnitPrice !== undefined) {
    updateFields.push(`default_unit_price = $${paramCount}`);
    values.push(clientData.defaultUnitPrice);
    paramCount++;
  }

  if (clientData.requiresCourseInfo !== undefined) {
    updateFields.push(`requires_course_info = $${paramCount}`);
    values.push(clientData.requiresCourseInfo);
    paramCount++;
  }

  if (clientData.billingAddress !== undefined) {
    updateFields.push(`billing_address_street = $${paramCount}`);
    values.push(clientData.billingAddress?.address);
    paramCount++;
    updateFields.push(`billing_address_city = $${paramCount}`);
    values.push(clientData.billingAddress?.city);
    paramCount++;
    updateFields.push(`billing_address_state = $${paramCount}`);
    values.push(clientData.billingAddress?.state);
    paramCount++;
    updateFields.push(`billing_address_zip = $${paramCount}`);
    values.push(clientData.billingAddress?.zipCode);
    paramCount++;
  }

  if (updateFields.length === 0) {
    // No fields to update
    return await getClientById(clientData.id, userId);
  }

  let updateQuery = `
    UPDATE clients 
    SET ${updateFields.join(", ")}, updated_at = NOW()
    WHERE id = $${paramCount}
  `;

  values.push(clientData.id);
  paramCount++;

  if (userId) {
    updateQuery += ` AND user_id = $${paramCount}`;
    values.push(userId);
  }

  updateQuery += ` RETURNING *`;

  const rows = await query<DbClient>(updateQuery, values);
  if (rows.length === 0) return null;

  return dbToClient(rows[0]);
}

// Delete a client
export async function deleteClient(id: string, userId?: string): Promise<boolean> {
  // First check if client has any invoices
  let invoiceCheckQuery = "SELECT COUNT(*) as count FROM invoices WHERE client_id = $1";
  const invoiceCheckValues = [id];
  
  if (userId) {
    invoiceCheckQuery += " AND user_id = $2";
    invoiceCheckValues.push(userId);
  }
  
  const invoiceRows = await query<{ count: string }>(invoiceCheckQuery, invoiceCheckValues);

  if (Number.parseInt(invoiceRows[0].count) > 0) {
    throw new Error("Cannot delete client with existing invoices");
  }

  let deleteQuery = "DELETE FROM clients WHERE id = $1";
  const deleteValues = [id];
  
  if (userId) {
    deleteQuery += " AND user_id = $2";
    deleteValues.push(userId);
  }
  
  const result = await query(deleteQuery, deleteValues);

  return result.length > 0;
}

// Search clients by name
export async function searchClients(searchTerm: string, userId?: string): Promise<Client[]> {
  let searchQuery = `
    SELECT * FROM clients 
    WHERE name ILIKE $1
  `;
  const values = [`%${searchTerm}%`];
  
  if (userId) {
    searchQuery += ` AND user_id = $2`;
    values.push(userId);
  }
  
  searchQuery += `
    ORDER BY name ASC
    LIMIT 50
  `;

  const rows = await query<DbClient>(searchQuery, values);
  return rows.map(dbToClient);
}

// Get clients with invoice counts
export async function getClientsWithInvoiceCounts(userId?: string): Promise<
  Array<Client & { invoiceCount: number }>
> {
  let clientsQuery = `
    SELECT 
      c.*,
      COUNT(i.id) as invoice_count
    FROM clients c
    LEFT JOIN invoices i ON c.id = i.client_id AND i.user_id = c.user_id
  `;
  const values: any[] = [];
  
  if (userId) {
    clientsQuery += ` WHERE c.user_id = $1`;
    values.push(userId);
  }
  
  clientsQuery += `
    GROUP BY c.id
    ORDER BY c.name ASC
  `;

  const rows = await query<DbClient & { invoice_count: string }>(clientsQuery, values);
  return rows.map((row) => ({
    ...dbToClient(row),
    invoiceCount: Number.parseInt(row.invoice_count),
  }));
}
