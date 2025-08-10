"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CourseSelect } from "@/components/ui/course-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { Client } from "@/types/client";
import type {
  CourseInfo,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  PaymentTerms,
} from "@/types/invoice";
import { generateInvoiceNumber } from "@/utils/invoiceNumberGenerator";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthHeaders } from "@/lib/auth-utils";
import {
  PAYMENT_TERMS_OPTIONS,
  calculateDueDate,
} from "@/utils/paymentTerms";
import { FileText, GraduationCap, Plus, Trash2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";

interface NewInvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceCreated: (invoice: Invoice) => void;
}

interface FormData {
  clientId: string;
  status: InvoiceStatus;
  issuedDate: string;
  dueDate: string;
  paymentTerms: PaymentTerms;
  notes: string;
  items: Omit<InvoiceItem, "id" | "amount">[];
  courseInfo: CourseInfo;
}

export function NewInvoiceForm({
  open,
  onOpenChange,
  onInvoiceCreated,
}: NewInvoiceFormProps) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    clientId: "",
    status: (settings?.invoiceDefaults?.defaultStatus as InvoiceStatus) || "draft",
    issuedDate: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
    dueDate: "",
    paymentTerms: settings?.invoiceDefaults?.paymentTerms || { days: 30, description: "Net 30" },
    notes: settings?.invoiceDefaults?.invoiceNotes || "",
    items: [{ description: "", quantity: 1, unitPrice: 0 }],
    courseInfo: {
      courseName: "",
      courseId: "",
      cohort: "",
      trainingDates: "",
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch clients when form opens
  useEffect(() => {
    if (open && user) {
      fetchClients();
    }
  }, [open, user]);

  // Auto-calculate due date when issued date or payment terms change
  useEffect(() => {
    if (formData.issuedDate && formData.paymentTerms) {
      try {
        const calculatedDueDate = calculateDueDate(formData.issuedDate, formData.paymentTerms);
        if (calculatedDueDate && !isNaN(calculatedDueDate.getTime())) {
          const dueDateString = calculatedDueDate.toISOString().split("T")[0];
          if (dueDateString !== formData.dueDate) {
            setFormData((prev) => ({ ...prev, dueDate: dueDateString }));
          }
        }
      } catch (error) {
        console.error("Error calculating due date:", error);
      }
    }
  }, [formData.issuedDate, formData.paymentTerms]);

  // Update item prices when client changes (handles edge cases)
  useEffect(() => {
    if (formData.clientId && clients.length > 0) {
      const selectedClient = clients.find((c) => c.id === formData.clientId);
      const defaultPrice = selectedClient?.defaultUnitPrice || 0;
      
      // Only update items that still have 0 price (haven't been manually edited)
      setFormData((prev) => ({
        ...prev,
        items: prev.items.map((item) => ({
          ...item,
          unitPrice: item.unitPrice === 0 ? defaultPrice : item.unitPrice
        }))
      }));
    }
  }, [formData.clientId, clients]);

  const fetchClients = async () => {
    if (!user) {
      console.error("No authenticated user");
      return;
    }

    setLoadingClients(true);
    try {
      const headers = await getAuthHeaders(user);
      const response = await fetch("/api/clients", { headers });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required");
        }
        throw new Error("Failed to fetch clients");
      }
      
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    } finally {
      setLoadingClients(false);
    }
  };


  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const addItem = () => {
    const selectedClient = clients.find((c) => c.id === formData.clientId);
    const defaultPrice = selectedClient?.defaultUnitPrice || 0;
    
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, unitPrice: defaultPrice }],
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const updateItem = (
    index: number,
    field: keyof Omit<InvoiceItem, "id" | "amount">,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const updateCourseInfo = (field: keyof CourseInfo, value: string) => {
    setFormData((prev) => ({
      ...prev,
      courseInfo: {
        ...prev.courseInfo,
        [field]: value,
      },
    }));
  };

  const calculateItemAmount = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce(
      (sum, item) => sum + calculateItemAmount(item.quantity, item.unitPrice),
      0,
    );
    const tax = 0; // No tax for simplicity
    const total = subtotal + tax;

    return { subtotal, tax, total };
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientId) {
      newErrors.client = "Please select a client";
    }

    if (!formData.issuedDate) {
      newErrors.issuedDate = "Please select an issued date";
    }

    if (!formData.dueDate) {
      newErrors.dueDate = "Please select a due date";
    }

    // Validate course info only if client requires it
    const selectedClient = clients.find((c) => c.id === formData.clientId);
    if (selectedClient?.requiresCourseInfo) {
      if (!formData.courseInfo.courseName.trim()) {
        newErrors.courseName = "Course name is required";
      }

      if (!formData.courseInfo.courseId.trim()) {
        newErrors.courseId = "Course ID is required";
      }

      if (!formData.courseInfo.cohort.trim()) {
        newErrors.cohort = "Cohort is required";
      }

      if (!formData.courseInfo.trainingDates.trim()) {
        newErrors.trainingDates = "Training dates are required";
      }
    }

    formData.items.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item-${index}-description`] = "Description is required";
      }
      if (item.quantity < 0.01) {
        newErrors[`item-${index}-quantity`] = "Quantity must be at least 0.01";
      }
      if (item.unitPrice < 0) {
        newErrors[`item-${index}-unitPrice`] = "Unit price cannot be negative";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const { subtotal, tax, total } = calculateTotals();
    const issuedDate = new Date(formData.issuedDate);
    const dueDate = new Date(formData.dueDate);

    const items: InvoiceItem[] = formData.items.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: calculateItemAmount(item.quantity, item.unitPrice),
    }));

    const selectedClient = clients.find((c) => c.id === formData.clientId);
    const invoiceData = {
      number: generateInvoiceNumber(),
      clientId: formData.clientId,
      status: formData.status,
      subtotal,
      tax,
      total,
      issuedDate: issuedDate.toISOString(),
      dueDate: dueDate.toISOString(),
      paymentTerms: formData.paymentTerms,
      notes: formData.notes || undefined,
      items,
      courseInfo: selectedClient?.requiresCourseInfo ? formData.courseInfo : undefined,
    };

    try {
      if (!user) {
        console.error("No authenticated user");
        return;
      }

      const authHeaders = await getAuthHeaders(user);
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      if (response.ok) {
        const newInvoice = await response.json();
        onInvoiceCreated(newInvoice);
        handleClose();
      } else {
        console.error("Failed to create invoice");
      }
    } catch (error) {
      console.error("Failed to create invoice:", error);
    }
  };

  const handleClose = () => {
    setFormData({
      clientId: "",
      status: (settings?.invoiceDefaults?.defaultStatus as InvoiceStatus) || "draft",
      issuedDate: new Date().toISOString().split("T")[0], // Reset to today's date
      dueDate: "",
      paymentTerms: settings?.invoiceDefaults?.paymentTerms || { days: 30, description: "Net 30" },
      notes: settings?.invoiceDefaults?.invoiceNotes || "",
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
      courseInfo: {
        courseName: "",
        courseId: "",
        cohort: "",
        trainingDates: "",
      },
    });
    setErrors({});
    onOpenChange(false);
  };

  const selectedClient = clients.find((c) => c.id === formData.clientId);
  const { subtotal, tax, total } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Create New Invoice
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <User className="mr-2 h-4 w-4" />
                CLIENT INFORMATION
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="client">Select Client</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => {
                    const selectedClient = clients.find((c) => c.id === value);
                    const defaultPrice = selectedClient?.defaultUnitPrice || 0;
                    
                    setFormData((prev) => ({
                      ...prev,
                      clientId: value,
                      // Update ALL items to use the new client's default price
                      // This ensures rate changes when switching clients
                      items: prev.items.map((item) => ({
                        ...item,
                        unitPrice: defaultPrice
                      }))
                    }));
                  }}
                >
                  <SelectTrigger
                    className={errors.client ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Choose a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingClients ? (
                      <SelectItem value="loading" disabled>
                        Loading clients...
                      </SelectItem>
                    ) : clients.length === 0 ? (
                      <SelectItem value="no-clients" disabled>
                        No clients available
                      </SelectItem>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="text-left">
                            <div className="font-medium text-left">{client.name.trim()}</div>
                            <div className="text-sm text-gray-500 text-left">
                              {client.email}
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.client && (
                  <p className="text-sm text-red-500 mt-1">{errors.client}</p>
                )}
              </div>

              {selectedClient && (
                <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                  <div className="font-medium">{selectedClient.name.trim()}</div>
                  <div className="text-sm text-gray-600">
                    {selectedClient.address}
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedClient.city}, {selectedClient.state}{" "}
                    {selectedClient.zipCode}
                  </div>
                  {selectedClient.taxId && (
                    <div className="text-sm text-gray-600">
                      Tax ID: {selectedClient.taxId}
                    </div>
                  )}
                  {selectedClient.defaultUnitPrice && (
                    <div className="text-sm text-blue-600 font-medium mt-1">
                      Default Rate: ${Number(selectedClient.defaultUnitPrice).toFixed(2)}/hour
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Course Information - Only show if client requires it */}
          {selectedClient?.requiresCourseInfo && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  COURSE INFORMATION
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="courseName">Course Name</Label>
                    <CourseSelect
                      value={formData.courseInfo.courseName}
                      onValueChange={(value) => updateCourseInfo("courseName", value)}
                      placeholder="Select or create course..."
                      className={errors.courseName ? "border-red-500" : ""}
                    />
                    {errors.courseName && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.courseName}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="courseId">Course ID</Label>
                    <Input
                      placeholder="e.g., RCT-101"
                      value={formData.courseInfo.courseId}
                      onChange={(e) =>
                        updateCourseInfo("courseId", e.target.value)
                      }
                      className={errors.courseId ? "border-red-500" : ""}
                    />
                    {errors.courseId && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.courseId}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cohort">Cohort</Label>
                    <Input
                      placeholder="e.g., Fall 2025 Batch A"
                      value={formData.courseInfo.cohort}
                      onChange={(e) => updateCourseInfo("cohort", e.target.value)}
                      className={errors.cohort ? "border-red-500" : ""}
                    />
                    {errors.cohort && (
                      <p className="text-sm text-red-500 mt-1">{errors.cohort}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="trainingDates">Training Dates</Label>
                    <Input
                      placeholder="e.g., Jan 15-17, 22-24, 29-31, 2025"
                      value={formData.courseInfo.trainingDates}
                      onChange={(e) =>
                        updateCourseInfo("trainingDates", e.target.value)
                      }
                      className={errors.trainingDates ? "border-red-500" : ""}
                    />
                    {errors.trainingDates && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.trainingDates}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: InvoiceStatus) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select
                  value={`${formData.paymentTerms.days}-${formData.paymentTerms.description}`}
                  onValueChange={(value) => {
                    const [days, ...descParts] = value.split("-");
                    const description = descParts.join("-");
                    const paymentTerms = { days: parseInt(days), description };
                    setFormData((prev) => ({ ...prev, paymentTerms }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS_OPTIONS.map((terms) => (
                      <SelectItem 
                        key={`${terms.days}-${terms.description}`} 
                        value={`${terms.days}-${terms.description}`}
                      >
                        {terms.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="issuedDate">Issued Date</Label>
                <Input
                  type="date"
                  value={formData.issuedDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      issuedDate: e.target.value,
                    }))
                  }
                  className={errors.issuedDate ? "border-red-500" : ""}
                />
                {errors.issuedDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.issuedDate}</p>
                )}
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                  }
                  className={errors.dueDate ? "border-red-500" : ""}
                />
                {errors.dueDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.dueDate}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Auto-calculated from payment terms
                </p>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium text-gray-600">
                  INVOICE ITEMS
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-600">
                <div className="col-span-5">DESCRIPTION</div>
                <div className="col-span-2 text-center">QUANTITY</div>
                <div className="col-span-2 text-right">UNIT PRICE</div>
                <div className="col-span-2 text-right">AMOUNT</div>
                <div className="col-span-1"></div>
              </div>

              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-start"
                >
                  <div className="col-span-5">
                    <Input
                      placeholder="Item description..."
                      value={item.description}
                      onChange={(e) =>
                        updateItem(index, "description", e.target.value)
                      }
                      className={
                        errors[`item-${index}-description`]
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {errors[`item-${index}-description`] && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors[`item-${index}-description`]}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "quantity",
                          Number.parseFloat(e.target.value) || 0,
                        )
                      }
                      className={
                        errors[`item-${index}-quantity`] ? "border-red-500" : ""
                      }
                    />
                    {errors[`item-${index}-quantity`] && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors[`item-${index}-quantity`]}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "unitPrice",
                          Number.parseFloat(e.target.value) || 0,
                        )
                      }
                      className={
                        errors[`item-${index}-unitPrice`]
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {errors[`item-${index}-unitPrice`] && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors[`item-${index}-unitPrice`]}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2 text-right py-2 text-sm font-medium">
                    $
                    {calculateItemAmount(item.quantity, item.unitPrice).toFixed(
                      2,
                    )}
                  </div>
                  <div className="col-span-1">
                    {formData.items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sub-total</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (0%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              placeholder="Additional notes or payment instructions..."
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit}>
              Create Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
