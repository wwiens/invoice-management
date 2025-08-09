import { query, transaction } from "@/lib/db";
import { type Invoice, InvoiceItem, type InvoiceStatus } from "@/types/invoice";
import type { PoolClient } from "pg";

// Database types that match our schema
interface DbInvoice {
  id: string;
  number: string;
  client_id: string;
  status: InvoiceStatus;
  subtotal: string;
  tax: string;
  total: string;
  issued_date: string;
  due_date: string;
  payment_terms_days?: number;
  payment_terms_description?: string;
  notes?: string;
  payment_method?: string;
  transaction_id?: string;
  payment_date?: string;
  course_name?: string;
  course_id?: string;
  cohort?: string;
  training_dates?: string;
  created_at: string;
  updated_at: string;
}

interface DbClient {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  tax_id?: string;
}

interface DbInvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: string;
  amount: string;
}

interface DbInvoiceAttachment {
  id: string;
  invoice_id: string;
  name: string;
  file_size: string;
  file_type: string;
  file_path?: string;
}

// Convert database row to Invoice object
function dbToInvoice(
  invoiceRow: DbInvoice,
  clientRow: DbClient,
  itemRows: DbInvoiceItem[],
  attachmentRows: DbInvoiceAttachment[] = [],
): Invoice {
  return {
    id: invoiceRow.id,
    number: invoiceRow.number,
    status: invoiceRow.status,
    amount: Number.parseFloat(invoiceRow.total),
    dueDate: new Date(invoiceRow.due_date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    issuedDate: new Date(invoiceRow.issued_date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    client: {
      name: clientRow.name,
      address: clientRow.address,
      city: clientRow.city,
      state: clientRow.state,
      zipCode: clientRow.zip_code,
      taxId: clientRow.tax_id,
    },
    items: itemRows.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: Number.parseFloat(item.unit_price),
      amount: Number.parseFloat(item.amount),
    })),
    subtotal: Number.parseFloat(invoiceRow.subtotal),
    tax: Number.parseFloat(invoiceRow.tax),
    total: Number.parseFloat(invoiceRow.total),
    notes: invoiceRow.notes,
    paymentMethod: invoiceRow.payment_method,
    transactionId: invoiceRow.transaction_id,
    paymentDate: invoiceRow.payment_date
      ? new Date(invoiceRow.payment_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : undefined,
    paymentTerms: invoiceRow.payment_terms_days !== undefined && invoiceRow.payment_terms_description
      ? {
          days: invoiceRow.payment_terms_days,
          description: invoiceRow.payment_terms_description,
        }
      : undefined,
    courseInfo: invoiceRow.course_name
      ? {
          courseName: invoiceRow.course_name,
          courseId: invoiceRow.course_id || "",
          cohort: invoiceRow.cohort || "",
          trainingDates: invoiceRow.training_dates || "",
        }
      : undefined,
    attachments: attachmentRows.map((attachment) => ({
      name: attachment.name,
      size: attachment.file_size,
      type: attachment.file_type,
    })),
  };
}

// Get all invoices
export async function getAllInvoices(userId?: string): Promise<Invoice[]> {
  let invoicesQuery = `
    SELECT 
      i.*,
      c.name, c.address, c.city, c.state, c.zip_code, c.tax_id
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
  `;
  const values: any[] = [];

  if (userId) {
    invoicesQuery += ` WHERE i.user_id = $1 AND c.user_id = $1`;
    values.push(userId);
  }

  invoicesQuery += ` ORDER BY i.created_at DESC`;

  const invoiceRows = await query<DbInvoice & DbClient>(invoicesQuery, values);

  // Get all items for these invoices - filter by user_id to ensure data isolation
  const invoiceIds = invoiceRows.map((row) => row.id);
  if (invoiceIds.length === 0) return [];

  let itemsQuery = `
    SELECT * FROM invoice_items 
    WHERE invoice_id = ANY($1)
  `;
  let itemsValues: any[] = [invoiceIds];
  
  if (userId) {
    itemsQuery += ` AND user_id = $2`;
    itemsValues.push(userId);
  }
  
  itemsQuery += ` ORDER BY created_at ASC`;
  const itemRows = await query<DbInvoiceItem>(itemsQuery, itemsValues);

  // Get attachments - filter by user_id to ensure data isolation
  let attachmentsQuery = `
    SELECT * FROM invoice_attachments 
    WHERE invoice_id = ANY($1)
  `;
  let attachmentsValues: any[] = [invoiceIds];
  
  if (userId) {
    attachmentsQuery += ` AND user_id = $2`;
    attachmentsValues.push(userId);
  }
  
  attachmentsQuery += ` ORDER BY created_at ASC`;
  const attachmentRows = await query<DbInvoiceAttachment>(attachmentsQuery, attachmentsValues);

  // Group items and attachments by invoice_id
  const itemsByInvoice = itemRows.reduce(
    (acc, item) => {
      if (!acc[item.invoice_id]) acc[item.invoice_id] = [];
      acc[item.invoice_id].push(item);
      return acc;
    },
    {} as Record<string, DbInvoiceItem[]>,
  );

  const attachmentsByInvoice = attachmentRows.reduce(
    (acc, attachment) => {
      if (!acc[attachment.invoice_id]) acc[attachment.invoice_id] = [];
      acc[attachment.invoice_id].push(attachment);
      return acc;
    },
    {} as Record<string, DbInvoiceAttachment[]>,
  );

  return invoiceRows.map((row) =>
    dbToInvoice(
      row,
      row,
      itemsByInvoice[row.id] || [],
      attachmentsByInvoice[row.id] || [],
    ),
  );
}

// Get invoice by ID
export async function getInvoiceById(id: string, userId?: string): Promise<Invoice | null> {
  let invoiceQuery = `
    SELECT 
      i.*,
      c.name, c.address, c.city, c.state, c.zip_code, c.tax_id
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE i.id = $1
  `;
  const values = [id];

  if (userId) {
    invoiceQuery += ` AND i.user_id = $2 AND c.user_id = $2`;
    values.push(userId);
  }

  const invoiceRows = await query<DbInvoice & DbClient>(invoiceQuery, values);
  if (invoiceRows.length === 0) return null;

  const invoiceRow = invoiceRows[0];

  // Get items - filter by user_id to ensure data isolation
  let itemsQuery = "SELECT * FROM invoice_items WHERE invoice_id = $1";
  let itemValues = [id];
  
  if (userId) {
    itemsQuery += " AND user_id = $2";
    itemValues.push(userId);
  }
  
  itemsQuery += " ORDER BY created_at ASC";
  const itemRows = await query<DbInvoiceItem>(itemsQuery, itemValues);

  // Get attachments - filter by user_id to ensure data isolation
  let attachmentsQuery = "SELECT * FROM invoice_attachments WHERE invoice_id = $1";
  let attachmentValues = [id];
  
  if (userId) {
    attachmentsQuery += " AND user_id = $2";
    attachmentValues.push(userId);
  }
  
  attachmentsQuery += " ORDER BY created_at ASC";
  const attachmentRows = await query<DbInvoiceAttachment>(attachmentsQuery, attachmentValues);

  return dbToInvoice(invoiceRow, invoiceRow, itemRows, attachmentRows);
}

// Create a new invoice
export async function createInvoice(
  invoiceData: Partial<Invoice> & { clientId?: string },
  userId: string,
): Promise<Invoice> {
  try {
    return await transaction(async (client: PoolClient) => {
      // Insert invoice
      const invoiceInsert = `
        INSERT INTO invoices (
          number, client_id, status, subtotal, tax, total,
          issued_date, due_date, payment_terms_days, payment_terms_description, notes, payment_method, transaction_id, payment_date,
          course_name, course_id, cohort, training_dates, user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING id
      `;

      const insertResult = await client.query(invoiceInsert, [
        invoiceData.number,
        invoiceData.clientId,
        invoiceData.status,
        invoiceData.subtotal,
        invoiceData.tax,
        invoiceData.total,
        new Date(invoiceData.issuedDate || ""),
        new Date(invoiceData.dueDate || ""),
        invoiceData.paymentTerms?.days,
        invoiceData.paymentTerms?.description,
        invoiceData.notes,
        invoiceData.paymentMethod,
        invoiceData.transactionId,
        invoiceData.paymentDate ? new Date(invoiceData.paymentDate) : null,
        invoiceData.courseInfo?.courseName,
        invoiceData.courseInfo?.courseId,
        invoiceData.courseInfo?.cohort,
        invoiceData.courseInfo?.trainingDates,
        userId,
      ]);

      const invoiceId = insertResult.rows[0].id;

      // Insert items
      if (invoiceData.items && invoiceData.items.length > 0) {
        const itemInsert = `
        INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount, user_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;

        for (const item of invoiceData.items) {
          await client.query(itemInsert, [
            invoiceId,
            item.description,
            item.quantity,
            item.unitPrice,
            item.amount,
            userId,
          ]);
        }
      }

      // Get the created invoice data immediately
      const invoiceQuery = `
      SELECT 
        i.*,
        c.name, c.address, c.city, c.state, c.zip_code, c.tax_id
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      WHERE i.id = $1
    `;

      const invoiceResult = await client.query(invoiceQuery, [invoiceId]);
      if (invoiceResult.rows.length === 0)
        throw new Error("Failed to retrieve created invoice");

      const invoiceRow = invoiceResult.rows[0];

      // Get items if any
      const itemsQuery =
        "SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at ASC";
      const itemResult = await client.query(itemsQuery, [invoiceId]);

      // Return the created invoice
      return dbToInvoice(invoiceRow, invoiceRow, itemResult.rows, []);
    });
  } catch (error) {
    console.error("Error in createInvoice:", error);
    throw error;
  }
}

// Update invoice status (for payments)
export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus,
  paymentData?: {
    paymentMethod?: string;
    transactionId?: string;
    paymentDate?: string;
  },
  userId?: string,
): Promise<Invoice | null> {
  let updateQuery = `
    UPDATE invoices 
    SET status = $1, payment_method = $2, transaction_id = $3, payment_date = $4
    WHERE id = $5
  `;
  const values = [
    status,
    paymentData?.paymentMethod,
    paymentData?.transactionId,
    paymentData?.paymentDate ? new Date(paymentData.paymentDate) : null,
    id,
  ];

  if (userId) {
    updateQuery += ` AND user_id = $6`;
    values.push(userId);
  }

  await query(updateQuery, values);

  return await getInvoiceById(id, userId);
}

// Update an invoice
export async function updateInvoice(
  id: string,
  invoiceData: Partial<Invoice> & { clientId?: string },
  userId?: string,
): Promise<Invoice> {
  try {
    return await transaction(async (client) => {
      // Update invoice
      let invoiceUpdate = `
        UPDATE invoices SET
          number = $1, client_id = $2, status = $3, subtotal = $4, tax = $5, total = $6,
          issued_date = $7, due_date = $8, payment_terms_days = $9, payment_terms_description = $10, notes = $11, payment_method = $12, transaction_id = $13, payment_date = $14,
          course_name = $15, course_id = $16, cohort = $17, training_dates = $18, updated_at = NOW()
        WHERE id = $19
      `;

      const values = [
        invoiceData.number,
        invoiceData.clientId,
        invoiceData.status,
        invoiceData.subtotal,
        invoiceData.tax,
        invoiceData.total,
        invoiceData.issuedDate ? new Date(invoiceData.issuedDate) : null,
        invoiceData.dueDate ? new Date(invoiceData.dueDate) : null,
        invoiceData.paymentTerms?.days,
        invoiceData.paymentTerms?.description,
        invoiceData.notes,
        invoiceData.paymentMethod,
        invoiceData.transactionId,
        invoiceData.paymentDate ? new Date(invoiceData.paymentDate) : null,
        invoiceData.courseInfo?.courseName,
        invoiceData.courseInfo?.courseId,
        invoiceData.courseInfo?.cohort,
        invoiceData.courseInfo?.trainingDates,
        id,
      ];

      if (userId) {
        invoiceUpdate += ` AND user_id = $20`;
        values.push(userId);
      }

      await client.query(invoiceUpdate, values);

      // Delete existing items
      if (userId) {
        await client.query("DELETE FROM invoice_items WHERE invoice_id = $1 AND user_id = $2", [
          id, userId,
        ]);
      } else {
        await client.query("DELETE FROM invoice_items WHERE invoice_id = $1", [
          id,
        ]);
      }

      // Insert updated items
      if (invoiceData.items && invoiceData.items.length > 0) {
        const itemInsert = `
          INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount, user_id)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;

        for (const item of invoiceData.items) {
          if (!userId) {
            throw new Error("User ID is required for creating invoice items");
          }
          await client.query(itemInsert, [
            id,
            item.description,
            item.quantity,
            item.unitPrice,
            item.amount,
            userId,
          ]);
        }
      }

      // Get the updated invoice data
      const invoiceQuery = `
        SELECT 
          i.*,
          c.name, c.address, c.city, c.state, c.zip_code, c.tax_id
        FROM invoices i
        JOIN clients c ON i.client_id = c.id
        WHERE i.id = $1
      `;

      const invoiceResult = await client.query(invoiceQuery, [id]);
      if (invoiceResult.rows.length === 0)
        throw new Error("Failed to retrieve updated invoice");

      const invoiceRow = invoiceResult.rows[0];

      // Get updated items
      const itemsQuery =
        "SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at ASC";
      const itemResult = await client.query(itemsQuery, [id]);

      // Return the updated invoice
      return dbToInvoice(invoiceRow, invoiceRow, itemResult.rows, []);
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    throw error;
  }
}

// Delete an invoice
export async function deleteInvoice(id: string, userId?: string): Promise<boolean> {
  try {
    return await transaction(async (client) => {
      // Delete invoice attachments first
      if (userId) {
        await client.query(
          "DELETE FROM invoice_attachments WHERE invoice_id = $1 AND user_id = $2",
          [id, userId],
        );

        // Delete invoice items
        await client.query("DELETE FROM invoice_items WHERE invoice_id = $1 AND user_id = $2", [
          id, userId,
        ]);

        // Delete the invoice
        const result = await client.query("DELETE FROM invoices WHERE id = $1 AND user_id = $2", [
          id, userId,
        ]);
        
        return (result.rowCount ?? 0) > 0;
      } else {
        await client.query(
          "DELETE FROM invoice_attachments WHERE invoice_id = $1",
          [id],
        );

        // Delete invoice items
        await client.query("DELETE FROM invoice_items WHERE invoice_id = $1", [
          id,
        ]);

        // Delete the invoice
        const result = await client.query("DELETE FROM invoices WHERE id = $1", [
          id,
        ]);
        
        return (result.rowCount ?? 0) > 0;
      }
    });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    throw error;
  }
}
