import type { PaymentTerms } from "@/types/invoice";

// Common payment terms options
export const PAYMENT_TERMS_OPTIONS: PaymentTerms[] = [
  { days: 0, description: "Due on Receipt" },
  { days: 15, description: "Net 15" },
  { days: 30, description: "Net 30" },
  { days: 45, description: "Net 45" },
  { days: 60, description: "Net 60" },
  { days: 90, description: "Net 90" },
];

/**
 * Calculate due date based on issue date and payment terms
 */
export function calculateDueDate(issuedDate: string | Date, paymentTerms: PaymentTerms): Date {
  const issueDate = typeof issuedDate === 'string' ? new Date(issuedDate) : issuedDate;
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + paymentTerms.days);
  return dueDate;
}

/**
 * Get payment terms by days
 */
export function getPaymentTermsByDays(days: number): PaymentTerms | undefined {
  return PAYMENT_TERMS_OPTIONS.find(term => term.days === days);
}

/**
 * Format payment terms for display
 */
export function formatPaymentTerms(paymentTerms: PaymentTerms): string {
  return paymentTerms.description;
}

/**
 * Create custom payment terms
 */
export function createCustomPaymentTerms(days: number, description?: string): PaymentTerms {
  return {
    days,
    description: description || `Net ${days}${days === 1 ? ' day' : ' days'}`,
  };
}