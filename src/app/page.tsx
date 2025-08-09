"use client";

import { ClientManagement } from "@/components/ClientManagement";
import { Dashboard } from "@/components/Dashboard";
import { InvoiceManagement } from "@/components/InvoiceManagement";
import { Sidebar } from "@/components/Sidebar";
import type { Invoice } from "@/types/invoice";
import { PaymentService } from "@/utils/paymentService";
import { useEffect, useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch invoices from database on component mount
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch("/api/invoices");
        if (!response.ok) {
          throw new Error("Failed to fetch invoices");
        }
        const data = await response.json();
        setInvoices(
          data.map((invoice: Invoice) =>
            PaymentService.updateInvoiceStatus(invoice),
          ),
        );
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load invoices",
        );
        console.error("Error fetching invoices:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const handlePaymentStatusChange = async (
    invoice: Invoice,
    isPaid: boolean,
  ) => {
    const updatedInvoice = isPaid
      ? PaymentService.markAsPaid(invoice)
      : PaymentService.markAsUnpaid(invoice);

    // Optimistic update
    const updatedInvoices = invoices.map((inv) =>
      inv.id === invoice.id ? updatedInvoice : inv,
    );
    setInvoices(updatedInvoices);

    // Update database
    try {
      const response = await fetch("/api/invoices", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: invoice.id,
          status: updatedInvoice.status,
          paymentData: {
            paymentMethod: updatedInvoice.paymentMethod,
            transactionId: updatedInvoice.transactionId,
            paymentDate: updatedInvoice.paymentDate,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update invoice status");
      }
    } catch (err) {
      console.error("Error updating invoice status:", err);
      // Revert optimistic update on error
      setInvoices(invoices);
    }
  };

  const handleInvoicesChange = (newInvoices: Invoice[]) => {
    setInvoices(newInvoices);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            invoices={invoices}
            onPaymentStatusChange={handlePaymentStatusChange}
          />
        );
      case "invoices":
        return (
          <InvoiceManagement
            invoices={invoices}
            onInvoicesChange={handleInvoicesChange}
            onPaymentStatusChange={handlePaymentStatusChange}
          />
        );
      case "clients":
        return <ClientManagement />;
      case "reports":
        return (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Reports content coming soon...</p>
          </div>
        );
      case "settings":
        return (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Settings content coming soon...</p>
          </div>
        );
      default:
        return (
          <Dashboard
            invoices={invoices}
            onPaymentStatusChange={handlePaymentStatusChange}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading invoices from database...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      {renderContent()}
    </div>
  );
}
