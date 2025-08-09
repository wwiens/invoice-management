"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FilterOptions, Invoice } from "@/types/invoice";
import { PaymentService } from "@/utils/paymentService";
import { AlertCircle, CheckCircle, Clock, DollarSign, X } from "lucide-react";
import { toast } from "sonner";
import { InvoiceDetail } from "./InvoiceDetail";
import { StatusBadge } from "./StatusBadge";

interface InvoiceListProps {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  onSelectInvoice: (invoice: Invoice) => void;
  onPaymentStatusChange: (invoice: Invoice, isPaid: boolean) => void;
  onMarkPaid?: (invoice: Invoice) => void; // New prop for payment dialog
  filters: FilterOptions;
  onEditInvoice?: (invoice: Invoice) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
  showInlineDetails?: boolean;
}

export function InvoiceList({
  invoices,
  selectedInvoice,
  onSelectInvoice,
  onPaymentStatusChange,
  onMarkPaid,
  filters,
  onEditInvoice,
  onDeleteInvoice,
  showInlineDetails = false,
}: InvoiceListProps) {
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesStatus =
      filters.status === "all" || invoice.status === filters.status;
    const matchesSearch =
      !filters.search ||
      invoice.number.toLowerCase().includes(filters.search.toLowerCase()) ||
      invoice.client.name
        .toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      invoice.courseInfo?.courseName
        .toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      invoice.courseInfo?.courseId
        .toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      invoice.courseInfo?.cohort
        .toLowerCase()
        .includes(filters.search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleMarkAsPaid = (e: React.MouseEvent, invoice: Invoice) => {
    e.stopPropagation();
    if (onMarkPaid) {
      // Use payment dialog if available
      onMarkPaid(invoice);
    } else {
      // Fallback to direct status change
      onPaymentStatusChange(invoice, true);
      toast.success(`Invoice ${invoice.number} marked as paid`, {
        description: `Payment received from ${invoice.client.name}`,
        duration: 3000,
      });
    }
  };

  const handleMarkAsUnpaid = (e: React.MouseEvent, invoice: Invoice) => {
    e.stopPropagation();
    onPaymentStatusChange(invoice, false);
    toast.info(`Invoice ${invoice.number} marked as unpaid`, {
      description: `Payment status updated for ${invoice.client.name}`,
      duration: 3000,
    });
  };

  const getUrgencyIndicator = (invoice: Invoice) => {
    const urgency = PaymentService.getUrgencyLevel(invoice);

    switch (urgency) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "high":
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case "medium":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getRowBackgroundColor = (invoice: Invoice) => {
    if (selectedInvoice?.id === invoice.id) {
      return "bg-blue-50 border-blue-200";
    }

    const urgency = PaymentService.getUrgencyLevel(invoice);
    switch (urgency) {
      case "critical":
        return "hover:bg-red-50";
      case "high":
        return "hover:bg-orange-50";
      case "medium":
        return "hover:bg-yellow-50";
      default:
        return "hover:bg-gray-50";
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-1">
        {filteredInvoices.map((invoice) => (
          <div key={invoice.id}>
            <div
              onClick={() => onSelectInvoice(invoice)}
              className={cn(
                "p-4 cursor-pointer border-b border-gray-200 transition-colors",
                getRowBackgroundColor(invoice),
              )}
            >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {invoice.number}
                    </h3>
                    {getUrgencyIndicator(invoice)}
                  </div>
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">
                    {formatCurrency(invoice.amount)}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <p className="text-sm text-gray-600 truncate">{invoice.client.name}</p>
                  <p className="text-sm text-gray-500">{invoice.dueDate}</p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <StatusBadge status={invoice.status} />

              {/* Payment Action Buttons */}
              <div className="flex gap-2 w-full sm:w-auto">
                {invoice.status === "paid" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleMarkAsUnpaid(e, invoice)}
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 flex-1 sm:flex-none"
                  >
                    <X className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Mark Unpaid</span>
                    <span className="sm:hidden">Unpaid</span>
                  </Button>
                ) : invoice.status !== "draft" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleMarkAsPaid(e, invoice)}
                    className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 flex-1 sm:flex-none"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Mark Paid</span>
                    <span className="sm:hidden">Paid</span>
                  </Button>
                ) : null}
              </div>
            </div>

            {/* Payment Status Info */}
            {invoice.status === "paid" && invoice.paymentDate && (
              <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                <DollarSign className="h-3 w-3" />
                Paid on {invoice.paymentDate}
                {invoice.paymentMethod && ` via ${invoice.paymentMethod}`}
              </div>
            )}

            {invoice.status === "overdue" && (
              <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" />
                {PaymentService.generatePaymentReminder(invoice)}
              </div>
            )}
            </div>
            
            {/* Mobile Inline Details */}
            {showInlineDetails && selectedInvoice?.id === invoice.id && (
              <div className="lg:hidden bg-gray-50 border-l-4 border-blue-500">
                <InvoiceDetail
                  invoice={selectedInvoice}
                  onEditInvoice={onEditInvoice}
                  onMarkPaid={onMarkPaid}
                  onDeleteInvoice={onDeleteInvoice}
                />
              </div>
            )}
          </div>
        ))}

        {filteredInvoices.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No invoices found matching your criteria.
          </div>
        )}
      </div>

      {filteredInvoices.length > 0 && (
        <div className="p-4 text-center text-sm text-gray-500 border-t">
          Showing 1-{Math.min(filteredInvoices.length, 32)} of{" "}
          {filteredInvoices.length} invoices
        </div>
      )}
    </div>
  );
}
