"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Invoice } from "@/types/invoice";
import { DollarSign } from "lucide-react";
import React, { useState } from "react";

interface PaymentData {
  paymentMethod: string;
  transactionId: string;
  paymentDate: string;
  amount: number;
  notes?: string;
}

interface PaymentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onPaymentConfirmed: (paymentData: PaymentData) => void;
}

export function PaymentDetailsDialog({
  open,
  onOpenChange,
  invoice,
  onPaymentConfirmed,
}: PaymentDetailsDialogProps) {
  const [paymentData, setPaymentData] = useState<PaymentData>({
    paymentMethod: "",
    transactionId: "",
    paymentDate: new Date().toISOString().split("T")[0], // Today's date
    amount: invoice?.total || 0,
    notes: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onPaymentConfirmed(paymentData);
      handleClose();
    } catch (error) {
      console.error("Error processing payment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPaymentData({
      paymentMethod: "",
      transactionId: "",
      paymentDate: new Date().toISOString().split("T")[0],
      amount: invoice?.total || 0,
      notes: "",
    });
    onOpenChange(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Update amount when invoice changes
  React.useEffect(() => {
    if (invoice) {
      setPaymentData(prev => ({
        ...prev,
        amount: invoice.total,
      }));
    }
  }, [invoice]);

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Record Payment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invoice Info */}
          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <div className="font-medium">Invoice: {invoice.number}</div>
            <div className="text-gray-600">{invoice.client.name}</div>
            <div className="font-semibold text-green-600 mt-1">
              Amount Due: {formatCurrency(invoice.total)}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <Select
              value={paymentData.paymentMethod}
              onValueChange={(value) =>
                setPaymentData((prev) => ({ ...prev, paymentMethod: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="debit_card">Debit Card</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transaction ID */}
          <div className="space-y-2">
            <Label htmlFor="transactionId">Transaction ID / Reference</Label>
            <Input
              id="transactionId"
              placeholder="e.g., TRX-123456, Check #1234"
              value={paymentData.transactionId}
              onChange={(e) =>
                setPaymentData((prev) => ({
                  ...prev,
                  transactionId: e.target.value,
                }))
              }
            />
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date *</Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentData.paymentDate}
              onChange={(e) =>
                setPaymentData((prev) => ({
                  ...prev,
                  paymentDate: e.target.value,
                }))
              }
              required
            />
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={paymentData.amount}
              onChange={(e) =>
                setPaymentData((prev) => ({
                  ...prev,
                  amount: parseFloat(e.target.value) || 0,
                }))
              }
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional payment details..."
              rows={2}
              value={paymentData.notes}
              onChange={(e) =>
                setPaymentData((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !paymentData.paymentMethod}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Processing..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}