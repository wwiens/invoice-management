"use client";

import { ClientManagement } from "@/components/ClientManagement";
import { Dashboard } from "@/components/Dashboard";
import { FinancialReports } from "@/components/FinancialReports";
import { InvoiceManagement } from "@/components/InvoiceManagement";
import { Settings } from "@/components/Settings";
import { Sidebar } from "@/components/Sidebar";
import LoginPage from "@/components/LoginPage";
import { useAuth } from "@/contexts/AuthContext";
import type { Invoice } from "@/types/invoice";
import { PaymentService } from "@/utils/paymentService";
import { getAuthHeaders } from "@/lib/auth-utils";
import { useEffect, useState } from "react";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch invoices from database on component mount
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchInvoices = async () => {
      try {
        const headers = await getAuthHeaders(user);
        const response = await fetch("/api/invoices", { headers });
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Authentication required");
          }
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
  }, [user]);

  const handlePaymentStatusChange = async (
    invoice: Invoice,
    isPaid: boolean,
  ) => {
    if (!user) return;

    const updatedInvoice = isPaid
      ? PaymentService.markAsPaid(invoice)
      : PaymentService.markAsUnpaid(invoice);

    // Store original invoices for potential rollback
    const originalInvoices = invoices;
    
    // Optimistic update
    const updatedInvoices = invoices.map((inv) =>
      inv.id === invoice.id ? updatedInvoice : inv,
    );
    setInvoices(updatedInvoices);

    // Update database
    try {
      const headers = await getAuthHeaders(user);
      const response = await fetch("/api/invoices", {
        method: "PATCH",
        headers: {
          ...headers,
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
      setInvoices(originalInvoices);
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
        return <FinancialReports invoices={invoices} />;
      case "settings":
        return <Settings />;
      default:
        return (
          <Dashboard
            invoices={invoices}
            onPaymentStatusChange={handlePaymentStatusChange}
          />
        );
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
