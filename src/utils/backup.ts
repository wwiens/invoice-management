import type { Client } from "@/types/client";
import type { Invoice } from "@/types/invoice";

export interface BackupData {
  version: string;
  timestamp: string;
  settings: Record<string, any>;
  clients: Client[];
  invoices: Invoice[];
}

export class BackupService {
  private static readonly BACKUP_VERSION = "1.0.0";

  static async exportData(
    settings: Record<string, any>,
    clients: Client[],
    invoices: Invoice[]
  ): Promise<string> {
    const backup: BackupData = {
      version: this.BACKUP_VERSION,
      timestamp: new Date().toISOString(),
      settings,
      clients,
      invoices,
    };

    return JSON.stringify(backup, null, 2);
  }

  static async validateBackup(data: any): Promise<BackupData> {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid backup data format");
    }

    if (!data.version) {
      throw new Error("Backup version is missing");
    }

    if (!data.timestamp) {
      throw new Error("Backup timestamp is missing");
    }

    if (!data.settings || typeof data.settings !== "object") {
      throw new Error("Settings data is missing or invalid");
    }

    if (!Array.isArray(data.clients)) {
      throw new Error("Clients data is missing or invalid");
    }

    if (!Array.isArray(data.invoices)) {
      throw new Error("Invoices data is missing or invalid");
    }

    // Validate each client has required fields
    for (const client of data.clients) {
      if (!client.id || !client.name) {
        throw new Error("Invalid client data: missing required fields");
      }
    }

    // Validate each invoice has required fields (check multiple field name formats)
    for (const invoice of data.invoices) {
      const hasClientId = invoice.client_id || invoice.clientId || invoice.client;
      const hasInvoiceNumber = invoice.invoice_number || invoice.invoiceNumber || invoice.number;
      
      if (!invoice.id || !hasClientId || !hasInvoiceNumber) {
        console.error("Invalid invoice:", invoice);
        throw new Error(`Invalid invoice data: missing required fields (id: ${!!invoice.id}, client: ${!!hasClientId}, number: ${!!hasInvoiceNumber})`);
      }
    }

    return data as BackupData;
  }

  static downloadAsFile(data: string, filename: string) {
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
}