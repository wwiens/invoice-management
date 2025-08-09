"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Invoice } from "@/types/invoice";
import { OverdueInvoice, PaymentService } from "@/utils/paymentService";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface PaymentRemindersProps {
  invoices: Invoice[];
  onPaymentStatusChange: (invoice: Invoice, isPaid: boolean) => void;
  onMarkPaid?: (invoice: Invoice) => void; // New prop for payment dialog
}

export function PaymentReminders({
  invoices,
  onPaymentStatusChange,
  onMarkPaid,
}: PaymentRemindersProps) {
  const overdueInvoices = PaymentService.getOverdueInvoices(invoices);
  const dueSoonInvoices = PaymentService.getDueSoonInvoices(invoices);

  const handleMarkAsPaid = (invoice: Invoice) => {
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

  const getUrgencyColor = (daysOverdue: number) => {
    if (daysOverdue > 30) return "border-red-500 bg-red-50";
    if (daysOverdue > 7) return "border-orange-500 bg-orange-50";
    return "border-yellow-500 bg-yellow-50";
  };

  const getUrgencyIcon = (daysOverdue: number) => {
    if (daysOverdue > 30)
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    if (daysOverdue > 7) return <Clock className="h-4 w-4 text-orange-600" />;
    return <Calendar className="h-4 w-4 text-yellow-600" />;
  };

  const formatCurrency = PaymentService.formatCurrency;

  if (overdueInvoices.length === 0 && dueSoonInvoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-medium text-green-800 mb-1">All caught up!</h3>
            <p className="text-sm text-green-600">
              No overdue payments or upcoming due dates
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overdue Invoices */}
      {overdueInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Overdue Payments ({overdueInvoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueInvoices.map((overdue) => (
                <div
                  key={overdue.invoice.id}
                  className={`border rounded-lg p-4 ${getUrgencyColor(overdue.daysOverdue)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getUrgencyIcon(overdue.daysOverdue)}
                      <div>
                        <h4 className="font-medium">
                          {overdue.invoice.number}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {overdue.invoice.client.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Due: {overdue.invoice.dueDate} •{" "}
                          {PaymentService.formatDaysOverdue(
                            overdue.daysOverdue,
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold">
                          {formatCurrency(overdue.invoice.total)}
                        </p>
                        <Badge variant="destructive" className="text-xs">
                          {PaymentService.formatDaysOverdue(
                            overdue.daysOverdue,
                          )}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleMarkAsPaid(overdue.invoice)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Paid
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Due Soon */}
      {dueSoonInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Due Soon ({dueSoonInvoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dueSoonInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="border border-blue-200 bg-blue-50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <div>
                        <h4 className="font-medium">{invoice.number}</h4>
                        <p className="text-sm text-gray-600">
                          {invoice.client.name}
                        </p>
                        <p className="text-xs text-blue-600">
                          Due: {invoice.dueDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold">
                          {formatCurrency(invoice.total)}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-xs border-blue-300 text-blue-700"
                        >
                          Pending
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleMarkAsPaid(invoice)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Paid
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
