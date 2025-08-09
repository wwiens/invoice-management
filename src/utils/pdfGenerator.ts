import type { Invoice } from "@/types/invoice";
import type { Settings } from "@/types/settings";
import jsPDF from "jspdf";
import { formatPaymentTerms } from "@/utils/paymentTerms";
import { DEFAULT_SETTINGS } from "@/types/settings";

export class InvoicePDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private settings: Settings;

  constructor(settings?: Settings) {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.settings = settings || DEFAULT_SETTINGS;
  }

  generateInvoicePDF(invoice: Invoice, settings?: Settings): void {
    if (settings) {
      this.settings = settings;
    }
    this.setupDocument();
    this.addHeader();
    this.addInvoiceInfo(invoice);
    this.addCourseInfo(invoice);
    const itemsEndY = this.addItemsTable(invoice);
    this.addPaymentInfo(invoice, itemsEndY);
    this.addFooter(invoice);

    // Download the PDF
    this.doc.save(`${invoice.number}.pdf`);
  }

  private setupDocument(): void {
    // Set document metadata
    this.doc.setProperties({
      title: "Invoice",
      subject: "Invoice Document",
      author: this.settings.company.name,
      creator: `${this.settings.company.name} Invoice Management System`,
    });
  }

  private addHeader(): void {
    // INVOICE title at top right
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(28);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text("INVOICE", this.pageWidth - this.margin - 50, this.margin + 10);

    // Company name
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(24);
    this.doc.text(this.settings.company.name, this.margin, this.margin + 10);

    // Company details
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);
    this.doc.setTextColor(100, 100, 100);
    const addressLine = `${this.settings.company.address}, ${this.settings.company.city}, ${this.settings.company.state}, ${this.settings.company.zipCode}`;
    this.doc.text(
      addressLine,
      this.margin,
      this.margin + 16,
    );
    const contactLine = `${this.settings.company.email} | ${this.settings.company.phone}`;
    this.doc.text(
      contactLine,
      this.margin,
      this.margin + 21,
    );
    
    // Add website if available
    if (this.settings.company.website) {
      this.doc.text(
        this.settings.company.website,
        this.margin,
        this.margin + 26,
      );
    }
  }

  private addInvoiceInfo(invoice: Invoice): void {
    const startY = this.margin + 30;

    // Bill To section (left side)
    this.doc.setFillColor(248, 249, 250);
    this.doc.rect(this.margin, startY, 85, 35, "F");

    this.doc.setTextColor(100, 100, 100);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(10);
    this.doc.text("BILL TO", this.margin + 5, startY + 8);

    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(12);
    this.doc.text(invoice.client.name, this.margin + 5, startY + 16);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);
    this.doc.text(invoice.client.address, this.margin + 5, startY + 22);
    this.doc.text(
      `${invoice.client.city}, ${invoice.client.state} ${invoice.client.zipCode}`,
      this.margin + 5,
      startY + 27,
    );

    if (invoice.client.taxId) {
      this.doc.text(
        `Tax ID: ${invoice.client.taxId}`,
        this.margin + 5,
        startY + 32,
      );
    }

    // Invoice details (right side) - moved down slightly
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(11);
    this.doc.setTextColor(60, 60, 60);

    const rightColumnX = this.pageWidth - this.margin - 80;
    const invoiceDetailsY = startY + 5; // Move down by 5 units

    this.doc.text("Invoice Number:", rightColumnX, invoiceDetailsY);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(invoice.number, rightColumnX + 35, invoiceDetailsY);

    this.doc.setFont("helvetica", "normal");
    this.doc.text("Issue Date:", rightColumnX, invoiceDetailsY + 7);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(invoice.issuedDate, rightColumnX + 35, invoiceDetailsY + 7);

    this.doc.setFont("helvetica", "normal");
    this.doc.text("Due Date:", rightColumnX, invoiceDetailsY + 14);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(invoice.dueDate, rightColumnX + 35, invoiceDetailsY + 14);

    // Payment terms if available
    if (invoice.paymentTerms) {
      this.doc.setFont("helvetica", "normal");
      this.doc.text("Payment Terms:", rightColumnX, invoiceDetailsY + 21);
      this.doc.setFont("helvetica", "bold");
      this.doc.text(formatPaymentTerms(invoice.paymentTerms), rightColumnX + 35, invoiceDetailsY + 21);
    }
  }

  private addCourseInfo(invoice: Invoice): void {
    if (!invoice.courseInfo) return;

    const startY = this.margin + (invoice.paymentTerms ? 77 : 70);

    // Course Information section
    this.doc.setFillColor(245, 247, 250); // Light blue background
    this.doc.rect(
      this.margin,
      startY,
      this.pageWidth - 2 * this.margin,
      25,
      "F",
    );

    this.doc.setTextColor(37, 99, 235); // Blue text
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(11);
    this.doc.text("COURSE INFORMATION", this.margin + 5, startY + 8);

    // Course details in two columns
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);

    // Left column
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Course Name:", this.margin + 5, startY + 16);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(invoice.courseInfo.courseName, this.margin + 30, startY + 16);

    this.doc.setFont("helvetica", "bold");
    this.doc.text("Course ID:", this.margin + 5, startY + 22);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(invoice.courseInfo.courseId, this.margin + 25, startY + 22);

    // Right column
    const midPoint = this.pageWidth / 2;
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Cohort:", midPoint, startY + 16);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(invoice.courseInfo.cohort, midPoint + 15, startY + 16);

    this.doc.setFont("helvetica", "bold");
    this.doc.text("Training Dates:", midPoint, startY + 22);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(invoice.courseInfo.trainingDates, midPoint + 30, startY + 22);
  }


  private addItemsTable(invoice: Invoice): number {
    let baseOffset = 92;  // Reduced from 110 to move up ~1/2 inch (18 points)
    if (invoice.paymentTerms) baseOffset += 7;
    const startY = invoice.courseInfo ? this.margin + baseOffset + 15 : this.margin + baseOffset;
    const tableWidth = this.pageWidth - 2 * this.margin;
    const colWidths = [
      tableWidth * 0.5, // Description
      tableWidth * 0.15, // Quantity
      tableWidth * 0.175, // Unit Price
      tableWidth * 0.175, // Amount
    ];

    // Table header
    this.doc.setFillColor(37, 99, 235);
    this.doc.rect(this.margin, startY, tableWidth, 12, "F");

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(10);

    let currentX = this.margin + 3;
    this.doc.text("DESCRIPTION", currentX, startY + 8);
    currentX += colWidths[0];
    this.doc.text("QTY", currentX, startY + 8);
    currentX += colWidths[1];
    this.doc.text("UNIT PRICE", currentX, startY + 8);
    currentX += colWidths[2];
    this.doc.text("AMOUNT", currentX, startY + 8);

    // Table rows
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);

    let rowY = startY + 12;
    invoice.items.forEach((item, index) => {
      // Alternate row colors
      if (index % 2 === 0) {
        this.doc.setFillColor(249, 250, 251);
        this.doc.rect(this.margin, rowY, tableWidth, 10, "F");
      }

      currentX = this.margin + 3;
      this.doc.text(item.description, currentX, rowY + 7);
      currentX += colWidths[0];
      this.doc.text(item.quantity.toString(), currentX, rowY + 7);
      currentX += colWidths[1];
      this.doc.text(this.formatCurrency(item.unitPrice), currentX, rowY + 7);
      currentX += colWidths[2];
      this.doc.text(this.formatCurrency(item.amount), currentX, rowY + 7);

      rowY += 10;
    });

    // Table border
    this.doc.setDrawColor(200, 200, 200);
    this.doc.rect(this.margin, startY, tableWidth, rowY - startY);

    // Totals section
    const totalsStartY = rowY + 10;
    const totalsX = this.pageWidth - this.margin - 80;

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(11);
    this.doc.text("Sub-total:", totalsX, totalsStartY);
    this.doc.text(
      this.formatCurrency(invoice.subtotal),
      totalsX + 40,
      totalsStartY,
    );

    this.doc.text("Tax (0%):", totalsX, totalsStartY + 8);
    this.doc.text(
      this.formatCurrency(invoice.tax),
      totalsX + 40,
      totalsStartY + 8,
    );

    // Total line
    this.doc.setDrawColor(0, 0, 0);
    this.doc.line(totalsX, totalsStartY + 12, totalsX + 60, totalsStartY + 12);

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(14);
    this.doc.text("Total:", totalsX, totalsStartY + 20);
    this.doc.text(
      this.formatCurrency(invoice.total),
      totalsX + 40,
      totalsStartY + 20,
    );
    
    return totalsStartY + 30; // Return position after totals with some spacing
  }

  private addPaymentInfo(invoice: Invoice, startYPosition: number): void {
    const startY = startYPosition;

    this.doc.setFillColor(37, 99, 235);
    this.doc.rect(this.margin, startY, this.pageWidth - 2 * this.margin, 12, "F");

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(10);
    this.doc.text("PAYMENT INFORMATION", this.margin + 5, startY + 8);

    const leftColumnX = this.margin + 5;
    const rightColumnX = this.pageWidth / 2 + 10;
    const baseY = startY + 20;
    
    // Bank Transfer section (left side)
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(9);
    this.doc.text("Bank Transfer", leftColumnX, baseY);
    
    let leftY = baseY + 6;
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(8);

    const bankInfo = this.settings.payment.bankTransfer;
    this.doc.text(`Bank Name: ${bankInfo.bankName}`, leftColumnX + 5, leftY);
    leftY += 5;
    this.doc.text(`Account Name: ${bankInfo.accountName}`, leftColumnX + 5, leftY);
    leftY += 5;
    
    if (bankInfo.routingNumber) {
      this.doc.text(`Routing Number: ${bankInfo.routingNumber}`, leftColumnX + 5, leftY);
      leftY += 5;
    }
    
    this.doc.text(`Account Number: ${bankInfo.accountNumber}`, leftColumnX + 5, leftY);
    leftY += 5;

    if (bankInfo.iban) {
      this.doc.text(`IBAN: ${bankInfo.iban}`, leftColumnX + 5, leftY);
      leftY += 5;
    }

    if (bankInfo.swiftBic) {
      this.doc.text(`SWIFT/BIC Code: ${bankInfo.swiftBic}`, leftColumnX + 5, leftY);
      leftY += 5;
    }

    this.doc.text(`Currency: ${bankInfo.currency}`, leftColumnX + 5, leftY);

    // Check Payment section (right side)
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(9);
    this.doc.text("Check Payment", rightColumnX, baseY);

    let rightY = baseY + 6;
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(8);

    const checkInfo = this.settings.payment.check;
    this.doc.text(`Payee Name: ${checkInfo.payeeName}`, rightColumnX + 5, rightY);
    rightY += 5;

    this.doc.text("Mailing Address:", rightColumnX + 5, rightY);
    rightY += 5;

    const addressLines = this.doc.splitTextToSize(
      checkInfo.mailingAddress,
      (this.pageWidth / 2) - 20
    );
    this.doc.text(addressLines, rightColumnX + 5, rightY);
  }

  private addFooter(invoice: Invoice): void {
    let footerY = this.pageHeight - 60;

    // Notes section
    if (invoice.notes) {
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(11);
      this.doc.setTextColor(0, 0, 0);
      this.doc.text("Notes:", this.margin, footerY);

      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(10);
      this.doc.setTextColor(60, 60, 60);

      // Split long notes into multiple lines
      const splitNotes = this.doc.splitTextToSize(
        invoice.notes,
        this.pageWidth - 2 * this.margin,
      );
      this.doc.text(splitNotes, this.margin, footerY + 8);
      
      // Adjust Y position for footer text if notes exist
      const notesHeight = splitNotes.length * 5;
      footerY = footerY + notesHeight + 15;
    }

    // Invoice footer text from settings
    if (this.settings.invoiceDefaults.invoiceFooter) {
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(9);
      this.doc.setTextColor(100, 100, 100);
      
      const footerLines = this.doc.splitTextToSize(
        this.settings.invoiceDefaults.invoiceFooter,
        this.pageWidth - 2 * this.margin,
      );
      
      // Draw a separator line
      this.doc.setDrawColor(200, 200, 200);
      this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);
      
      this.doc.text(footerLines, this.margin, footerY);
    }

  }

  private getStatusConfig(status: string) {
    const configs = {
      paid: {
        bgColor: [34, 197, 94] as [number, number, number],
        textColor: [255, 255, 255] as [number, number, number],
        label: "PAID",
      },
      pending: {
        bgColor: [168, 85, 247] as [number, number, number],
        textColor: [255, 255, 255] as [number, number, number],
        label: "PENDING",
      },
      draft: {
        bgColor: [251, 146, 60] as [number, number, number],
        textColor: [255, 255, 255] as [number, number, number],
        label: "DRAFT",
      },
      overdue: {
        bgColor: [239, 68, 68] as [number, number, number],
        textColor: [255, 255, 255] as [number, number, number],
        label: "OVERDUE",
      },
    };
    return configs[status as keyof typeof configs] || configs.draft;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }
}

export const generateInvoicePDF = (invoice: Invoice, settings?: Settings): void => {
  const generator = new InvoicePDFGenerator(settings);
  generator.generateInvoicePDF(invoice, settings);
};
