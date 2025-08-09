"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { FilterOptions, Invoice, InvoiceStatus } from "@/types/invoice";
import { PaymentService } from "@/utils/paymentService";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthHeaders } from "@/lib/auth-utils";
import { AlertCircle, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EditInvoiceForm } from "./EditInvoiceForm";
import { InvoiceDetail } from "./InvoiceDetail";
import { InvoiceList } from "./InvoiceList";
import { NewInvoiceForm } from "./NewInvoiceForm";
import { PaymentDetailsDialog } from "./PaymentDetailsDialog";
import { PaymentReminders } from "./PaymentReminders";
import { generateInvoiceNumber } from "@/utils/invoiceNumberGenerator";

interface InvoiceManagementProps {
  invoices?: Invoice[];
  onInvoicesChange?: (invoices: Invoice[]) => void;
  onPaymentStatusChange?: (invoice: Invoice, isPaid: boolean) => void;
}

export function InvoiceManagement({
  invoices: propInvoices,
  onInvoicesChange,
  onPaymentStatusChange,
}: InvoiceManagementProps) {
  const { user } = useAuth();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showNewInvoiceForm, setShowNewInvoiceForm] = useState(false);
  const [showEditInvoiceForm, setShowEditInvoiceForm] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [invoiceBeingPaid, setInvoiceBeingPaid] = useState<Invoice | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    status: "all",
    search: "",
  });

  // Use prop invoices if provided, otherwise empty array
  const invoices = useMemo(() => propInvoices || [], [propInvoices]);

  // Set initial selected invoice when invoices change
  useEffect(() => {
    if (invoices.length > 0 && !selectedInvoice) {
      setSelectedInvoice(invoices[0]);
    }
  }, [invoices, selectedInvoice]);

  const overdueCount = useMemo(
    () => PaymentService.getOverdueInvoices(invoices).length,
    [invoices],
  );

  const statusTabs: Array<{
    label: string;
    value: InvoiceStatus | "all" | "overdue";
    count?: number;
  }> = [
    { label: "All Invoices", value: "all", count: invoices.length },
    {
      label: "Drafts",
      value: "draft",
      count: invoices.filter((i) => i.status === "draft").length,
    },
    {
      label: "Pending",
      value: "pending",
      count: invoices.filter((i) => i.status === "pending").length,
    },
    {
      label: "Paid",
      value: "paid",
      count: invoices.filter((i) => i.status === "paid").length,
    },
    {
      label: "Overdue",
      value: "overdue",
      count: overdueCount,
    },
  ];

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleNewInvoice = (newInvoice: Invoice) => {
    if (onInvoicesChange) {
      const updatedInvoices = [newInvoice, ...invoices];
      onInvoicesChange(updatedInvoices);
      setSelectedInvoice(newInvoice);
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowEditInvoiceForm(true);
  };

  const handleInvoiceUpdated = (updatedInvoice: Invoice) => {
    if (onInvoicesChange) {
      const updatedInvoices = invoices.map((inv) =>
        inv.id === updatedInvoice.id ? updatedInvoice : inv,
      );
      onInvoicesChange(updatedInvoices);
      setSelectedInvoice(updatedInvoice);
    }
  };

  const handleMarkPaid = (invoice: Invoice) => {
    setInvoiceBeingPaid(invoice);
    setShowPaymentDialog(true);
  };

  const handlePaymentConfirmed = async (paymentData: {
    paymentMethod: string;
    transactionId: string;
    paymentDate: string;
    amount: number;
    notes?: string;
  }) => {
    if (!invoiceBeingPaid || !user) return;

    try {
      // Fetch clients to find the correct client ID
      const headers = await getAuthHeaders(user);
      const clientsResponse = await fetch("/api/clients", { headers });
      if (!clientsResponse.ok) {
        console.error("Failed to fetch clients");
        return;
      }
      const clients = await clientsResponse.json();
      const client = clients.find((c: { id: string; name: string }) => c.name === invoiceBeingPaid.client.name);

      if (!client) {
        console.error("Client not found");
        return;
      }

      const invoiceData = {
        number: invoiceBeingPaid.number,
        clientId: client.id,
        status: "paid" as const,
        subtotal: invoiceBeingPaid.subtotal,
        tax: invoiceBeingPaid.tax,
        total: invoiceBeingPaid.total,
        issuedDate: new Date(invoiceBeingPaid.issuedDate).toISOString(),
        dueDate: new Date(invoiceBeingPaid.dueDate).toISOString(),
        notes: invoiceBeingPaid.notes,
        items: invoiceBeingPaid.items,
        courseInfo: invoiceBeingPaid.courseInfo,
        paymentDate: new Date(paymentData.paymentDate).toISOString(),
        paymentMethod: paymentData.paymentMethod,
        transactionId: paymentData.transactionId,
      };

      const response = await fetch(`/api/invoices/${invoiceBeingPaid.id}`, {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      if (response.ok) {
        const updatedInvoice = await response.json();
        handleInvoiceUpdated(updatedInvoice);
      } else {
        console.error("Failed to mark invoice as paid");
      }
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!user) return;

    try {
      const headers = await getAuthHeaders(user);
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
        headers,
      });

      if (response.ok) {
        if (onInvoicesChange) {
          const updatedInvoices = invoices.filter(
            (inv) => inv.id !== invoiceId,
          );
          onInvoicesChange(updatedInvoices);

          // Update selected invoice
          if (selectedInvoice?.id === invoiceId) {
            setSelectedInvoice(
              updatedInvoices.length > 0 ? updatedInvoices[0] : null,
            );
          }
        }
      } else {
        console.error("Failed to delete invoice");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

  const handleDuplicateInvoice = async (invoice: Invoice) => {
    if (!user) return;
    
    try {
      const headers = await getAuthHeaders(user);
      
      // Generate new invoice number in the regular format (INV-YYYY-NNNN)
      const newInvoiceNumber = generateInvoiceNumber();
      
      // Create today's date for issued date
      const today = new Date();
      const issuedDate = today.toISOString().split('T')[0];
      
      // Calculate due date based on payment terms (default to 30 days if not specified)
      const paymentTermsDays = invoice.paymentTerms?.days || 30;
      const dueDate = new Date(today.getTime() + paymentTermsDays * 24 * 60 * 60 * 1000);
      const dueDateString = dueDate.toISOString().split('T')[0];

      // Get client ID - we need to fetch the client details since invoice only has client data, not ID
      const clientsResponse = await fetch("/api/clients", { headers });
      if (!clientsResponse.ok) {
        throw new Error("Failed to fetch clients");
      }
      const clients = await clientsResponse.json();
      const client = clients.find((c: { id: string; name: string }) => c.name === invoice.client.name);
      
      if (!client) {
        throw new Error("Client not found");
      }

      // Create duplicate invoice data - reset payment-related fields
      const duplicateData = {
        number: newInvoiceNumber,
        clientId: client.id,
        status: "draft",
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        issuedDate: issuedDate,
        dueDate: dueDateString,
        paymentTerms: invoice.paymentTerms,
        notes: invoice.notes,
        items: invoice.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
        })),
        courseInfo: invoice.courseInfo,
        // Reset payment-related fields for the duplicate
        paymentMethod: undefined,
        transactionId: undefined,
        paymentDate: undefined,
      };

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(duplicateData),
      });

      if (response.ok) {
        const newInvoice = await response.json();
        if (onInvoicesChange) {
          const updatedInvoices = [newInvoice, ...invoices];
          onInvoicesChange(updatedInvoices);
          setSelectedInvoice(newInvoice);
        }
      } else {
        throw new Error("Failed to create duplicate invoice");
      }
    } catch (error) {
      console.error("Failed to duplicate invoice:", error);
      // The error will be handled by the InvoiceDetail component for user feedback
    }
  };

  const handlePaymentStatusChangeLocal = (
    invoice: Invoice,
    isPaid: boolean,
  ) => {
    if (onPaymentStatusChange) {
      onPaymentStatusChange(invoice, isPaid);

      // Update selected invoice if it's the one being modified
      if (selectedInvoice?.id === invoice.id) {
        const updatedInvoice = isPaid
          ? PaymentService.markAsPaid(invoice)
          : PaymentService.markAsUnpaid(invoice);
        setSelectedInvoice(updatedInvoice);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-semibold">Invoices</h1>
            {overdueCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                <AlertCircle className="h-3 w-3" />
                {overdueCount} overdue
              </div>
            )}
          </div>
          <div className="flex space-x-3 w-full sm:w-auto">
            <Button onClick={() => setShowNewInvoiceForm(true)} className="flex-1 sm:flex-none">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">New Invoice</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search for invoices..."
            className="pl-10"
            value={filters.search}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
          />
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1 overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleFilterChange({ status: tab.value })}
              className={cn(
                "px-3 md:px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                filters.status === tab.value
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
              )}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">
                {tab.label.replace(' Invoices', '').replace('Invoices', 'All')}
              </span>
              {tab.count !== undefined && (
                <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content with Tabs */}
      <div className="flex-1 flex">
        <Tabs defaultValue="invoices" className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mt-4 mb-4">
            <TabsTrigger value="invoices" className="text-sm">
              <span className="hidden sm:inline">Invoice List</span>
              <span className="sm:hidden">Invoices</span>
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2 text-sm">
              <span className="hidden sm:inline">Payment Reminders</span>
              <span className="sm:hidden">Reminders</span>
              {overdueCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                  {overdueCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="flex-1 flex flex-col lg:flex-row">
            {/* Mobile: Only show invoice list with inline details */}
            <div className="w-full lg:w-1/2 lg:border-r border-gray-200 flex-shrink-0 lg:block">
              <InvoiceList
                invoices={invoices}
                selectedInvoice={selectedInvoice}
                onSelectInvoice={setSelectedInvoice}
                onPaymentStatusChange={handlePaymentStatusChangeLocal}
                onMarkPaid={handleMarkPaid}
                filters={filters}
                onEditInvoice={handleEditInvoice}
                onDeleteInvoice={handleDeleteInvoice}
                onDuplicateInvoice={handleDuplicateInvoice}
                showInlineDetails={true}
              />
            </div>
            {/* Desktop: Show separate detail panel */}
            <div className="hidden lg:block w-1/2 border-t lg:border-t-0 lg:border-l border-gray-200">
              <InvoiceDetail
                invoice={selectedInvoice}
                onEditInvoice={handleEditInvoice}
                onMarkPaid={handleMarkPaid}
                onDeleteInvoice={handleDeleteInvoice}
                onDuplicateInvoice={handleDuplicateInvoice}
              />
            </div>
          </TabsContent>

          <TabsContent value="reminders" className="p-4 md:p-6">
            <PaymentReminders
              invoices={invoices}
              onPaymentStatusChange={handlePaymentStatusChangeLocal}
              onMarkPaid={handleMarkPaid}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* New Invoice Form */}
      <NewInvoiceForm
        open={showNewInvoiceForm}
        onOpenChange={setShowNewInvoiceForm}
        onInvoiceCreated={handleNewInvoice}
      />

      {/* Edit Invoice Form */}
      <EditInvoiceForm
        open={showEditInvoiceForm}
        onOpenChange={setShowEditInvoiceForm}
        invoice={selectedInvoice}
        onInvoiceUpdated={handleInvoiceUpdated}
      />

      {/* Payment Details Dialog */}
      <PaymentDetailsDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        invoice={invoiceBeingPaid}
        onPaymentConfirmed={handlePaymentConfirmed}
      />
    </div>
  );
}
