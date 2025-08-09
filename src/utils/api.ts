import type { Client } from "@/types/client";

/**
 * Common API utility functions to reduce code duplication
 */

export class ApiService {
  /**
   * Fetch all clients from the API
   */
  static async fetchClients(): Promise<Client[]> {
    const response = await fetch("/api/clients");
    if (!response.ok) {
      throw new Error(`Failed to fetch clients: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Generic fetch helper with error handling
   */
  static async fetchWithErrorHandling<T>(
    url: string,
    options?: RequestInit,
  ): Promise<T> {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    return response.json();
  }
}

/**
 * Common validation utilities
 */
export class ValidationUtils {
  /**
   * Validate UUID v4 format
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate invoice status
   */
  static isValidInvoiceStatus(status: string): boolean {
    const validStatuses = ['paid', 'pending', 'draft', 'overdue'];
    return validStatuses.includes(status);
  }
}