import type { PaymentTerms } from "@/types/invoice";

export interface CompanyDetails {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  email: string;
  phone: string;
  website?: string;
  taxId?: string;
  logo?: string;
}

export interface BankTransferInfo {
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban?: string;
  swiftBic?: string;
  currency: string;
  routingNumber?: string;
}

export interface CheckInfo {
  payeeName: string;
  mailingAddress: string;
}

export interface PaymentSettings {
  bankTransfer: BankTransferInfo;
  check: CheckInfo;
  acceptedMethods: string[];
  paymentInstructions?: string;
}

export interface InvoiceDefaults {
  paymentTerms: PaymentTerms;
  defaultStatus: "draft" | "pending";
  currency: string;
  taxRate: number;
  invoiceNotes?: string;
  invoiceFooter?: string;
}

export interface Settings {
  company: CompanyDetails;
  payment: PaymentSettings;
  invoiceDefaults: InvoiceDefaults;
  lastUpdated?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  company: {
    name: "Your Company Name",
    address: "123 Business Street",
    city: "City",
    state: "State",
    zipCode: "12345",
    email: "contact@yourcompany.com",
    phone: "+1 (555) 123-4567",
  },
  payment: {
    bankTransfer: {
      bankName: "Your Bank Name",
      accountName: "Your Company Name",
      accountNumber: "1234567890",
      iban: "",
      swiftBic: "",
      currency: "USD",
    },
    check: {
      payeeName: "Your Company Name",
      mailingAddress: "123 Business Street, City, State 12345",
    },
    acceptedMethods: ["Bank Transfer", "Check", "Credit Card"],
  },
  invoiceDefaults: {
    paymentTerms: { days: 30, description: "Net 30" },
    defaultStatus: "draft",
    currency: "USD",
    taxRate: 0,
  },
};