export interface BankTransferInfo {
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban?: string;
  swiftBic?: string;
  currency: string;
}

export interface CheckInfo {
  payeeName: string;
  mailingAddress: string;
}

export interface BusinessPaymentSettings {
  bankTransfer: BankTransferInfo;
  check: CheckInfo;
}

export const BUSINESS_PAYMENT_SETTINGS: BusinessPaymentSettings = {
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
};