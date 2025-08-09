// Simple test utility to verify database connection
import { getAllInvoices } from "@/services/invoiceService";

export async function testDatabaseConnection() {
  try {
    console.log("Testing database connection...");
    const invoices = await getAllInvoices();
    console.log(`✅ Successfully connected to database`);
    console.log(`📄 Found ${invoices.length} invoices`);

    if (invoices.length > 0) {
      console.log(
        `📋 Sample invoice: ${invoices[0].number} - ${invoices[0].client.name} - $${invoices[0].total}`,
      );
    }

    return invoices;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
}
