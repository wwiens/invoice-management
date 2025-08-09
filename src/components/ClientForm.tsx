"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  type Client,
  type CreateClientData,
  UpdateClientData,
} from "@/types/client";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthHeaders } from "@/lib/auth-utils";
import { useState, useEffect } from "react";

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onClientSaved: (client: Client) => void;
  title?: string;
}

export function ClientForm({
  open,
  onOpenChange,
  client,
  onClientSaved,
  title,
}: ClientFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateClientData>(() => ({
    name: client?.name || "",
    email: client?.email || "",
    phone: client?.phone || "",
    address: client?.address || "",
    city: client?.city || "",
    state: client?.state || "",
    zipCode: client?.zipCode || "",
    taxId: client?.taxId || "",
    defaultUnitPrice: client?.defaultUnitPrice || undefined,
    requiresCourseInfo: client?.requiresCourseInfo || false,
    billingAddress: client?.billingAddress
      ? {
          address: client.billingAddress.address,
          city: client.billingAddress.city,
          state: client.billingAddress.state,
          zipCode: client.billingAddress.zipCode,
        }
      : undefined,
  }));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useSeparateBilling, setUseSeparateBilling] = useState(
    !!client?.billingAddress,
  );

  // Update form data when client prop changes
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        city: client.city || "",
        state: client.state || "",
        zipCode: client.zipCode || "",
        taxId: client.taxId || "",
        defaultUnitPrice: client.defaultUnitPrice || undefined,
        requiresCourseInfo: client.requiresCourseInfo || false,
        billingAddress: client.billingAddress
          ? {
              address: client.billingAddress.address,
              city: client.billingAddress.city,
              state: client.billingAddress.state,
              zipCode: client.billingAddress.zipCode,
            }
          : undefined,
      });
      setUseSeparateBilling(!!client.billingAddress);
    } else {
      // Reset form for new client
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        taxId: "",
        defaultUnitPrice: undefined,
        requiresCourseInfo: false,
        billingAddress: undefined,
      });
      setUseSeparateBilling(false);
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError("Authentication required");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const requestData = {
        ...formData,
        billingAddress: useSeparateBilling
          ? formData.billingAddress
          : undefined,
      };

      const url = client ? `/api/clients/${client.id}` : "/api/clients";
      const method = client ? "PUT" : "POST";

      const authHeaders = await getAuthHeaders(user);
      const response = await fetch(url, {
        method,
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save client");
      }

      const savedClient = await response.json();
      onClientSaved(savedClient);
      onOpenChange(false);

      // Reset form
      if (!client) {
        setFormData({
          name: "",
          email: "",
          phone: "",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          taxId: "",
          defaultUnitPrice: undefined,
        });
        setUseSeparateBilling(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save client");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateClientData, value: string | number | boolean | undefined) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBillingAddressChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      billingAddress: {
        ...prev.billingAddress,
        [field]: value,
      } as any,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {title || (client ? "Edit Client" : "Add New Client")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => handleInputChange("taxId", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultUnitPrice">Default Unit Price ($/hour)</Label>
              <Input
                id="defaultUnitPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g., 150.00"
                value={formData.defaultUnitPrice || ""}
                onChange={(e) => 
                  handleInputChange(
                    "defaultUnitPrice" as keyof CreateClientData, 
                    e.target.value ? parseFloat(e.target.value) as any : undefined
                  )
                }
              />
              <p className="text-sm text-gray-500">
                This will be used as the default unit price when creating invoices for this client
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresCourseInfo"
                checked={formData.requiresCourseInfo}
                onCheckedChange={(checked) => 
                  handleInputChange("requiresCourseInfo" as keyof CreateClientData, checked as boolean)
                }
              />
              <Label 
                htmlFor="requiresCourseInfo" 
                className="text-sm font-normal cursor-pointer"
              >
                Require course information for invoices
              </Label>
            </div>
            <p className="text-sm text-gray-500 ml-6">
              When enabled, invoices for this client will include course details (course name, ID, cohort, training dates)
            </p>
          </div>

          <Separator />

          {/* Main Address */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Main Address</h3>

            <div className="space-y-2">
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange("zipCode", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="separateBilling"
                checked={useSeparateBilling}
                onChange={(e) => setUseSeparateBilling(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="separateBilling">
                Use different billing address
              </Label>
            </div>

            {useSeparateBilling && (
              <div className="space-y-4 pl-6 border-l-2 border-gray-100">
                <h3 className="font-medium text-gray-900">Billing Address</h3>

                <div className="space-y-2">
                  <Label htmlFor="billingAddress">Street Address</Label>
                  <Input
                    id="billingAddress"
                    value={formData.billingAddress?.address || ""}
                    onChange={(e) =>
                      handleBillingAddressChange("address", e.target.value)
                    }
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingCity">City</Label>
                    <Input
                      id="billingCity"
                      value={formData.billingAddress?.city || ""}
                      onChange={(e) =>
                        handleBillingAddressChange("city", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingState">State</Label>
                    <Input
                      id="billingState"
                      value={formData.billingAddress?.state || ""}
                      onChange={(e) =>
                        handleBillingAddressChange("state", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingZipCode">ZIP Code</Label>
                    <Input
                      id="billingZipCode"
                      value={formData.billingAddress?.zipCode || ""}
                      onChange={(e) =>
                        handleBillingAddressChange("zipCode", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : client
                  ? "Update Client"
                  : "Create Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
