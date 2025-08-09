"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Invoice } from "@/types/invoice";
import { generateInvoicePDF } from "@/utils/pdfGenerator";
import { formatPaymentTerms } from "@/utils/paymentTerms";
import {
  Calendar,
  Download,
  FileText,
  GraduationCap,
  Hash,
  MoreHorizontal,
  Printer,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface InvoiceDetailProps {
  invoice: Invoice | null;
  onEditInvoice?: (invoice: Invoice) => void;
  onMarkPaid?: (invoice: Invoice) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
}

export function InvoiceDetail({
  invoice,
  onEditInvoice,
  onMarkPaid,
  onDeleteInvoice,
}: InvoiceDetailProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!invoice) {
    return (
      <div className="w-full bg-gray-50 flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500">Select an invoice to view details</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handlePrint = () => {
    try {
      generateInvoicePDF(invoice);
      toast.success(`PDF generated successfully!`, {
        description: `Invoice ${invoice.number} has been downloaded as PDF.`,
        duration: 3000,
      });
    } catch (error) {
      toast.error("Failed to generate PDF", {
        description:
          "Please try again or contact support if the issue persists.",
        duration: 4000,
      });
    }
  };

  const handleEditClick = () => {
    if (onEditInvoice && invoice) {
      onEditInvoice(invoice);
    }
  };

  const handleMarkPaidClick = () => {
    if (onMarkPaid && invoice) {
      onMarkPaid(invoice);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (onDeleteInvoice && invoice) {
      onDeleteInvoice(invoice.id);
      setShowDeleteDialog(false);
      toast.success("Invoice deleted successfully", {
        description: `Invoice ${invoice.number} has been deleted.`,
        duration: 3000,
      });
    }
  };

  const getPaymentMethodDisplay = (method: string): string => {
    const paymentMethods: Record<string, string> = {
      bank_transfer: "Bank Transfer",
      credit_card: "Credit Card",
      debit_card: "Debit Card",
      check: "Check",
      cash: "Cash",
      paypal: "PayPal",
      stripe: "Stripe",
      other: "Other",
      Manual: "Manual", // Legacy fallback
    };
    return paymentMethods[method] || method;
  };

  return (
    <div className="w-full bg-white border-gray-200 overflow-auto">
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-4">
          <h2 className="text-lg md:text-xl font-semibold">Invoice Details</h2>
          <div className="flex space-x-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1 sm:flex-none">
              <Printer className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
              <span className="sm:hidden">Print</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handlePrint}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEditClick}>
                  Edit Invoice
                </DropdownMenuItem>
                {invoice.status !== "paid" && (
                  <DropdownMenuItem
                    onClick={handleMarkPaidClick}
                    className="text-green-600"
                  >
                    Mark Paid
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={handleDeleteClick}
                  className="text-red-600"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          <div>
            <h3 className="font-semibold text-lg mb-1">{invoice.number}</h3>
            <p className="text-sm text-gray-600">
              Issued: {invoice.issuedDate}
            </p>
            <p className="text-sm text-gray-600">Due: {invoice.dueDate}</p>
            {invoice.status === "paid" && invoice.paymentDate && (
              <p className="text-sm text-green-600 font-medium">
                Paid on {invoice.paymentDate}
              </p>
            )}
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-gray-600 mb-1">Amount Due</p>
            <p className="text-xl md:text-2xl font-bold">
              {formatCurrency(invoice.amount)}
            </p>
            {invoice.amount !== invoice.total && (
              <p className="text-sm text-gray-600">
                Original: {formatCurrency(invoice.total)}
              </p>
            )}
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Course Information */}
        {invoice.courseInfo && (
          <>
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  COURSE INFORMATION
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Course Name</p>
                      <p className="font-medium">
                        {invoice.courseInfo.courseName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1 flex items-center">
                        <Hash className="mr-1 h-3 w-3" />
                        Course ID
                      </p>
                      <p className="font-medium font-mono text-sm">
                        {invoice.courseInfo.courseId}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Cohort</p>
                      <p className="font-medium">{invoice.courseInfo.cohort}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1 flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        Training Dates
                      </p>
                      <p className="font-medium">
                        {invoice.courseInfo.trainingDates}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Separator className="mb-6" />
          </>
        )}

        {/* Bill To & Payment Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                BILL TO
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                <p className="font-semibold">{invoice.client.name}</p>
                <p className="text-sm text-gray-600">
                  {invoice.client.address}
                </p>
                <p className="text-sm text-gray-600">
                  {invoice.client.city}, {invoice.client.state}{" "}
                  {invoice.client.zipCode}
                </p>
                {invoice.client.taxId && (
                  <p className="text-sm text-gray-600">
                    Tax ID: {invoice.client.taxId}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                PAYMENT DETAILS
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {invoice.paymentTerms && (
                  <p className="text-sm">
                    <span className="text-gray-600">Payment Terms:</span>{" "}
                    {formatPaymentTerms(invoice.paymentTerms)}
                  </p>
                )}
                {invoice.paymentMethod && (
                  <p className="text-sm">
                    <span className="text-gray-600">Payment Method:</span>{" "}
                    {getPaymentMethodDisplay(invoice.paymentMethod)}
                  </p>
                )}
                {invoice.transactionId && (
                  <p className="text-sm">
                    <span className="text-gray-600">Transaction ID:</span>{" "}
                    {invoice.transactionId}
                  </p>
                )}
                {invoice.paymentDate && (
                  <p className="text-sm">
                    <span className="text-gray-600">Payment Date:</span>{" "}
                    {invoice.paymentDate}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Items */}
        <Card className="mb-4 md:mb-6">
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DESCRIPTION</TableHead>
                    <TableHead className="text-center">QUANTITY</TableHead>
                    <TableHead className="text-right">UNIT PRICE</TableHead>
                    <TableHead className="text-right">AMOUNT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.description}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {invoice.items.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="font-medium mb-2">{item.description}</div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex gap-4">
                      <span>Qty: {item.quantity}</span>
                      <span>@{formatCurrency(item.unitPrice)}</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(item.amount)}</span>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Sub-total</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (0%)</span>
                <span>{formatCurrency(invoice.tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Attachments */}
        {invoice.attachments && invoice.attachments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {invoice.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-red-500 mr-3" />
                      <div>
                        <p className="font-medium text-sm">{attachment.name}</p>
                        <p className="text-xs text-gray-500">
                          {attachment.size}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice {invoice?.number}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
