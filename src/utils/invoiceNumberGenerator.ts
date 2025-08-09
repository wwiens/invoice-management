/**
 * Invoice number generation utility
 * Generates sequential invoice numbers with format: INV-YYYY-NNNN
 * Where YYYY is the current year and NNNN is a sequential 4-digit number
 */

const INVOICE_NUMBER_KEY = 'invoice_number_sequence';
const INVOICE_YEAR_KEY = 'invoice_year';

/**
 * Get the next sequential invoice number
 * Format: INV-YYYY-NNNN (e.g., INV-2025-0001)
 */
export function generateInvoiceNumber(): string {
  const currentYear = new Date().getFullYear();
  
  // Get stored values from localStorage
  const storedYear = localStorage.getItem(INVOICE_YEAR_KEY);
  const storedSequence = localStorage.getItem(INVOICE_NUMBER_KEY);
  
  let sequence = 1;
  const parsedStoredYear = storedYear ? parseInt(storedYear, 10) : null;
  
  // If it's a new year, reset the sequence to 1
  if (parsedStoredYear !== currentYear) {
    sequence = 1;
    localStorage.setItem(INVOICE_YEAR_KEY, currentYear.toString());
  } else {
    // Continue from the last sequence number
    sequence = storedSequence ? parseInt(storedSequence, 10) + 1 : 1;
  }
  
  // Store the new sequence number
  localStorage.setItem(INVOICE_NUMBER_KEY, sequence.toString());
  
  // Format: INV-YYYY-NNNN
  const paddedSequence = sequence.toString().padStart(4, '0');
  return `INV-${currentYear}-${paddedSequence}`;
}

/**
 * Get the current sequence number without incrementing
 */
export function getCurrentSequence(): number {
  const storedSequence = localStorage.getItem(INVOICE_NUMBER_KEY);
  return storedSequence ? parseInt(storedSequence, 10) : 0;
}

/**
 * Preview the next invoice number without generating it
 */
export function previewNextInvoiceNumber(): string {
  const currentYear = new Date().getFullYear();
  const storedYear = localStorage.getItem(INVOICE_YEAR_KEY);
  const storedSequence = localStorage.getItem(INVOICE_NUMBER_KEY);
  
  let nextSequence = 1;
  const parsedStoredYear = storedYear ? parseInt(storedYear, 10) : null;
  
  if (parsedStoredYear === currentYear && storedSequence) {
    nextSequence = parseInt(storedSequence, 10) + 1;
  }
  
  const paddedSequence = nextSequence.toString().padStart(4, '0');
  return `INV-${currentYear}-${paddedSequence}`;
}

/**
 * Reset the invoice numbering system (use with caution)
 */
export function resetInvoiceNumbering(): void {
  localStorage.removeItem(INVOICE_NUMBER_KEY);
  localStorage.removeItem(INVOICE_YEAR_KEY);
}

/**
 * Set a specific starting sequence number (use with caution)
 */
export function setInvoiceSequence(sequence: number, year?: number): void {
  const targetYear = year || new Date().getFullYear();
  localStorage.setItem(INVOICE_NUMBER_KEY, (sequence - 1).toString()); // Subtract 1 because generateInvoiceNumber adds 1
  localStorage.setItem(INVOICE_YEAR_KEY, targetYear.toString());
}