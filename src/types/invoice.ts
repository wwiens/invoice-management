export type InvoiceStatus = "paid" | "pending" | "draft" | "overdue";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Course {
  id: string;
  name: string;
  created_at: string;
}

export interface CourseInfo {
  courseName: string;
  courseId: string;
  cohort: string;
  trainingDates: string;
}

export interface PaymentTerms {
  days: number;
  description: string; // e.g., "Net 30", "Due on Receipt", "2/10 Net 30"
}

export interface Invoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  amount: number;
  dueDate: string;
  issuedDate: string;
  paymentTerms?: PaymentTerms;
  client: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    taxId?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  paymentMethod?: string;
  transactionId?: string;
  paymentDate?: string;
  courseInfo?: CourseInfo;
  attachments?: Array<{
    name: string;
    size: string;
    type: string;
  }>;
}

export interface FilterOptions {
  status: InvoiceStatus | "all" | "overdue";
  search: string;
}
