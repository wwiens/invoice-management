import type { Invoice, InvoiceStatus } from "@/types/invoice";

export interface PaymentUpdate {
  invoiceId: string;
  status: InvoiceStatus;
  paymentDate?: string;
  transactionId?: string;
}

export interface OverdueInvoice {
  invoice: Invoice;
  daysOverdue: number;
  reminderSent?: boolean;
}

export class PaymentService {
  static markAsPaid(invoice: Invoice): Invoice {
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });

    return {
      ...invoice,
      status: "paid" as InvoiceStatus,
      paymentDate: today,
      paymentMethod: invoice.paymentMethod || "Bank Transfer",
      transactionId:
        invoice.transactionId || `TRX-${Date.now().toString().slice(-8)}`,
    };
  }

  static markAsUnpaid(invoice: Invoice): Invoice {
    const {
      paymentDate,
      paymentMethod,
      transactionId,
      ...invoiceWithoutPayment
    } = invoice;

    // Determine new status based on due date
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    const isOverdue = today > dueDate;

    return {
      ...invoiceWithoutPayment,
      status: isOverdue
        ? ("overdue" as InvoiceStatus)
        : ("pending" as InvoiceStatus),
    };
  }

  static getOverdueInvoices(invoices: Invoice[]): OverdueInvoice[] {
    const today = new Date();

    return invoices
      .filter((invoice) => {
        const dueDate = new Date(invoice.dueDate);
        return (
          invoice.status !== "paid" &&
          invoice.status !== "draft" &&
          today > dueDate
        );
      })
      .map((invoice) => {
        const dueDate = new Date(invoice.dueDate);
        const daysOverdue = Math.floor(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        return {
          invoice,
          daysOverdue,
          reminderSent: false, // Could be stored in a separate tracking system
        };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }

  static getDueSoonInvoices(invoices: Invoice[], daysAhead = 7): Invoice[] {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + daysAhead);

    return invoices.filter((invoice) => {
      const dueDate = new Date(invoice.dueDate);
      return (
        invoice.status === "pending" &&
        dueDate >= today &&
        dueDate <= futureDate
      );
    });
  }

  static isOverdue(invoice: Invoice): boolean {
    if (invoice.status === "paid" || invoice.status === "draft") {
      return false;
    }

    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    return today > dueDate;
  }

  static updateInvoiceStatus(invoice: Invoice): Invoice {
    if (invoice.status === "paid" || invoice.status === "draft") {
      return invoice;
    }

    const dueDate = new Date(invoice.dueDate);
    const today = new Date();

    if (today > dueDate && invoice.status !== "overdue") {
      return {
        ...invoice,
        status: "overdue" as InvoiceStatus,
      };
    }

    return invoice;
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  static formatDaysOverdue(days: number): string {
    if (days === 1) return "1 day overdue";
    return `${days} days overdue`;
  }

  static getPaymentStatusColor(status: InvoiceStatus): string {
    switch (status) {
      case "paid":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "overdue":
        return "text-red-600";
      case "draft":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  }

  static getUrgencyLevel(
    invoice: Invoice,
  ): "low" | "medium" | "high" | "critical" {
    if (invoice.status === "paid" || invoice.status === "draft") {
      return "low";
    }

    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    const daysUntilDue = Math.floor(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilDue < 0) {
      const daysOverdue = Math.abs(daysUntilDue);
      if (daysOverdue > 30) return "critical";
      if (daysOverdue > 7) return "high";
      return "medium";
    }

    if (daysUntilDue <= 3) return "medium";
    return "low";
  }

  static generatePaymentReminder(invoice: Invoice): string {
    const overdueInvoices = this.getOverdueInvoices([invoice]);
    if (overdueInvoices.length === 0) return "";

    const overdue = overdueInvoices[0];
    const daysText = this.formatDaysOverdue(overdue.daysOverdue);

    return `Invoice ${invoice.number} is ${daysText} (Due: ${invoice.dueDate}). Amount: ${this.formatCurrency(invoice.total)}`;
  }
}
