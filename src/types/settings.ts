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
    name: "Warren Wiens",
    address: "2405 Bremerton Ct",
    city: "Columbia",
    state: "MO",
    zipCode: "65203",
    email: "wwiens@gmail.com",
    phone: "+1 (651) 724-4873",
  },
  payment: {
    bankTransfer: {
      bankName: "First National Bank",
      accountName: "Warren Wiens Consulting LLC",
      accountNumber: "1234567890",
      iban: "US33FIRS1234567890123456",
      swiftBic: "FIRSNYU1",
      currency: "USD",
    },
    check: {
      payeeName: "Warren Wiens",
      mailingAddress: "2405 Bremerton Ct, Columbia, MO 65203",
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