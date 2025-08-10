"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSettings } from "@/contexts/SettingsContext";
import type { Settings as SettingsType } from "@/types/settings";
import { BackupService } from "@/utils/backup";
import { PAYMENT_TERMS_OPTIONS } from "@/utils/paymentTerms";
import { Building2, CreditCard, Database, Download, FileText, RotateCcw, Save, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function Settings() {
  const { settings, updateSettings, resetSettings, isLoading } = useSettings();
  const [formData, setFormData] = useState<SettingsType>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  useEffect(() => {
    setHasChanges(JSON.stringify(formData) !== JSON.stringify(settings));
  }, [formData, settings]);

  const handleSave = () => {
    updateSettings(formData);
    setHasChanges(false);
    toast.success("Settings saved successfully");
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all settings to default values?")) {
      resetSettings();
      setFormData(settings);
      setHasChanges(false);
      toast.info("Settings reset to defaults");
    }
  };

  const handleCompanyChange = (field: keyof typeof formData.company, value: string) => {
    setFormData(prev => ({
      ...prev,
      company: {
        ...prev.company,
        [field]: value
      }
    }));
  };

  const handleBankTransferChange = (field: keyof typeof formData.payment.bankTransfer, value: string) => {
    setFormData(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        bankTransfer: {
          ...prev.payment.bankTransfer,
          [field]: value
        }
      }
    }));
  };

  const handleCheckChange = (field: keyof typeof formData.payment.check, value: string) => {
    setFormData(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        check: {
          ...prev.payment.check,
          [field]: value
        }
      }
    }));
  };

  const handleInvoiceDefaultsChange = (field: keyof typeof formData.invoiceDefaults, value: any) => {
    setFormData(prev => ({
      ...prev,
      invoiceDefaults: {
        ...prev.invoiceDefaults,
        [field]: value
      }
    }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch data from API
      const response = await fetch("/api/backup/export");
      if (!response.ok) throw new Error("Failed to export data");
      
      const data = await response.json();
      
      // Include settings from localStorage
      const backupJson = await BackupService.exportData(
        settings,
        data.clients,
        data.invoices
      );
      
      // Download as file
      const timestamp = new Date().toISOString().split("T")[0];
      BackupService.downloadAsFile(backupJson, `invoice-backup-${timestamp}.json`);
      
      toast.success("Data exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      // Read and parse file
      const fileContent = await BackupService.readFile(file);
      const data = JSON.parse(fileContent);
      
      // Validate backup data
      const validatedData = await BackupService.validateBackup(data);
      
      // Import settings to localStorage
      if (validatedData.settings) {
        updateSettings(validatedData.settings as SettingsType);
      }
      
      // Import clients and invoices to database
      const response = await fetch("/api/backup/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to import data");
      }
      
      const result = await response.json();
      toast.success(
        `Import successful: ${result.stats.clients} clients, ${result.stats.invoices} invoices`
      );
      
      // Reload the page to refresh all data
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error("Import error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to import data");
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Configure your company details, payment information, and invoice defaults
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        <Tabs defaultValue="company" className="space-y-4">
          <TabsList>
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="h-4 w-4" />
              Company Details
            </TabsTrigger>
            <TabsTrigger value="payment" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Settings
            </TabsTrigger>
            <TabsTrigger value="invoice" className="gap-2">
              <FileText className="h-4 w-4" />
              Invoice Defaults
            </TabsTrigger>
            <TabsTrigger value="backup" className="gap-2">
              <Database className="h-4 w-4" />
              Backup & Restore
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  This information will appear on all invoices and documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                      id="company-name"
                      value={formData.company.name}
                      onChange={(e) => handleCompanyChange("name", e.target.value)}
                      placeholder="Your Company Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax-id">Tax ID (Optional)</Label>
                    <Input
                      id="tax-id"
                      value={formData.company.taxId || ""}
                      onChange={(e) => handleCompanyChange("taxId", e.target.value)}
                      placeholder="EIN or Tax Number"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium">Contact Information</h3>
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={formData.company.address}
                      onChange={(e) => handleCompanyChange("address", e.target.value)}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.company.city}
                        onChange={(e) => handleCompanyChange("city", e.target.value)}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.company.state}
                        onChange={(e) => handleCompanyChange("state", e.target.value)}
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={formData.company.zipCode}
                        onChange={(e) => handleCompanyChange("zipCode", e.target.value)}
                        placeholder="12345"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.company.email}
                        onChange={(e) => handleCompanyChange("email", e.target.value)}
                        placeholder="company@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.company.phone}
                        onChange={(e) => handleCompanyChange("phone", e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input
                      id="website"
                      value={formData.company.website || ""}
                      onChange={(e) => handleCompanyChange("website", e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>
                  Configure how clients can pay your invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Bank Transfer Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bank-name">Bank Name</Label>
                      <Input
                        id="bank-name"
                        value={formData.payment.bankTransfer.bankName}
                        onChange={(e) => handleBankTransferChange("bankName", e.target.value)}
                        placeholder="First National Bank"
                      />
                    </div>
                    <div>
                      <Label htmlFor="account-name">Account Name</Label>
                      <Input
                        id="account-name"
                        value={formData.payment.bankTransfer.accountName}
                        onChange={(e) => handleBankTransferChange("accountName", e.target.value)}
                        placeholder="Your Company LLC"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="account-number">Account Number</Label>
                      <Input
                        id="account-number"
                        value={formData.payment.bankTransfer.accountNumber}
                        onChange={(e) => handleBankTransferChange("accountNumber", e.target.value)}
                        placeholder="1234567890"
                      />
                    </div>
                    <div>
                      <Label htmlFor="routing-number">Routing Number (Optional)</Label>
                      <Input
                        id="routing-number"
                        value={formData.payment.bankTransfer.routingNumber || ""}
                        onChange={(e) => handleBankTransferChange("routingNumber", e.target.value)}
                        placeholder="123456789"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="iban">IBAN (Optional)</Label>
                      <Input
                        id="iban"
                        value={formData.payment.bankTransfer.iban || ""}
                        onChange={(e) => handleBankTransferChange("iban", e.target.value)}
                        placeholder="US33XXXX1234567890"
                      />
                    </div>
                    <div>
                      <Label htmlFor="swift">SWIFT/BIC Code (Optional)</Label>
                      <Input
                        id="swift"
                        value={formData.payment.bankTransfer.swiftBic || ""}
                        onChange={(e) => handleBankTransferChange("swiftBic", e.target.value)}
                        placeholder="XXXXUS33"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.payment.bankTransfer.currency}
                      onValueChange={(value) => handleBankTransferChange("currency", value)}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium">Check Payment Details</h3>
                  <div>
                    <Label htmlFor="payee-name">Payee Name</Label>
                    <Input
                      id="payee-name"
                      value={formData.payment.check.payeeName}
                      onChange={(e) => handleCheckChange("payeeName", e.target.value)}
                      placeholder="Your Name or Company"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mailing-address">Mailing Address</Label>
                    <Textarea
                      id="mailing-address"
                      value={formData.payment.check.mailingAddress}
                      onChange={(e) => handleCheckChange("mailingAddress", e.target.value)}
                      placeholder="123 Main Street, City, State ZIP"
                      rows={3}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="payment-instructions">Additional Payment Instructions (Optional)</Label>
                  <Textarea
                    id="payment-instructions"
                    value={formData.payment.paymentInstructions || ""}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      payment: {
                        ...prev.payment,
                        paymentInstructions: e.target.value
                      }
                    }))}
                    placeholder="Any additional payment instructions or notes"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoice">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Defaults</CardTitle>
                <CardDescription>
                  Set default values for new invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment-terms">Default Payment Terms</Label>
                    <Select
                      value={`${formData.invoiceDefaults.paymentTerms.days}`}
                      onValueChange={(value) => {
                        const term = PAYMENT_TERMS_OPTIONS.find(t => t.days === parseInt(value));
                        if (term) {
                          handleInvoiceDefaultsChange("paymentTerms", term);
                        }
                      }}
                    >
                      <SelectTrigger id="payment-terms">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_TERMS_OPTIONS.map((term) => (
                          <SelectItem key={term.days} value={`${term.days}`}>
                            {term.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="default-status">Default Invoice Status</Label>
                    <Select
                      value={formData.invoiceDefaults.defaultStatus}
                      onValueChange={(value) => handleInvoiceDefaultsChange("defaultStatus", value)}
                    >
                      <SelectTrigger id="default-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
                    <Input
                      id="tax-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.invoiceDefaults.taxRate}
                      onChange={(e) => handleInvoiceDefaultsChange("taxRate", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoice-currency">Invoice Currency</Label>
                    <Select
                      value={formData.invoiceDefaults.currency}
                      onValueChange={(value) => handleInvoiceDefaultsChange("currency", value)}
                    >
                      <SelectTrigger id="invoice-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="invoice-notes">Default Invoice Notes (Optional)</Label>
                  <Textarea
                    id="invoice-notes"
                    value={formData.invoiceDefaults.invoiceNotes || ""}
                    onChange={(e) => handleInvoiceDefaultsChange("invoiceNotes", e.target.value)}
                    placeholder="Thank you for your business!"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="invoice-footer">Invoice Footer Text (Optional)</Label>
                  <Textarea
                    id="invoice-footer"
                    value={formData.invoiceDefaults.invoiceFooter || ""}
                    onChange={(e) => handleInvoiceDefaultsChange("invoiceFooter", e.target.value)}
                    placeholder="Terms and conditions, legal text, etc."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup">
            <Card>
              <CardHeader>
                <CardTitle>Backup & Restore</CardTitle>
                <CardDescription>
                  Export your data for backup or import from a previous backup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Export Data</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Download all your settings, clients, and invoices as a JSON file.
                      This backup can be used to restore your data or migrate to another system.
                    </p>
                    <Button
                      onClick={handleExport}
                      disabled={isExporting}
                      className="gap-2"
                    >
                      {isExporting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Export All Data
                        </>
                      )}
                    </Button>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-2">Import Data</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Restore from a backup file. This will replace all existing data
                      including settings, clients, and invoices.
                    </p>
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg mb-4">
                      <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                        ⚠️ Warning: Import will replace all existing data
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        Make sure to export your current data first if you want to keep it.
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                      disabled={isImporting}
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting}
                      variant="outline"
                      className="gap-2"
                    >
                      {isImporting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Import from File
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Backup Contents</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• All company settings and preferences</li>
                    <li>• Client information and contact details</li>
                    <li>• Invoices with all line items</li>
                    <li>• Payment information and invoice statuses</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {hasChanges && (
          <div className="fixed bottom-6 right-6 bg-background border rounded-lg shadow-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">You have unsaved changes</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData(settings);
                  setHasChanges(false);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}