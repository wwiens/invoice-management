"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Client } from "@/types/client";
import {
  AlertTriangle,
  Building2,
  Edit,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ClientForm } from "./ClientForm";

interface ClientWithInvoiceCount extends Client {
  invoiceCount?: number;
}

export function ClientManagement() {
  const [clients, setClients] = useState<ClientWithInvoiceCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showClientForm, setShowClientForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const fetchClients = async (search?: string) => {
    try {
      const params = new URLSearchParams();
      if (search) {
        params.append("search", search);
      } else {
        params.append("withCounts", "true");
      }

      const response = await fetch(`/api/clients?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }
      const data = await response.json();
      setClients(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      fetchClients(searchTerm);
    } else {
      fetchClients();
    }
  };

  const handleClientSaved = (client: Client) => {
    fetchClients();
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowClientForm(true);
  };

  const handleDeleteClient = async (client: Client) => {
    if (!confirm(`Are you sure you want to delete ${client.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete client");
      }

      fetchClients();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete client";
      alert(`Error: ${message}`);
    }
  };

  const handleNewClient = () => {
    setSelectedClient(null);
    setShowClientForm(true);
  };

  const handleFormClose = () => {
    setShowClientForm(false);
    setSelectedClient(null);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading clients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={() => fetchClients()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">Clients</h1>
          <Button onClick={handleNewClient}>
            <Plus className="mr-2 h-4 w-4" />
            New Client
          </Button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search clients..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
          {searchTerm && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                fetchClients();
              }}
            >
              Clear
            </Button>
          )}
        </form>
      </div>

      {/* Client Grid */}
      <div className="flex-1 p-6">
        {clients.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No clients found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? "No clients match your search criteria."
                : "Get started by adding your first client."}
            </p>
            <Button onClick={handleNewClient}>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <Card
                key={client.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditClient(client)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteClient(client)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {typeof client.invoiceCount !== "undefined" && (
                    <Badge
                      variant={
                        client.invoiceCount > 0 ? "default" : "secondary"
                      }
                    >
                      {client.invoiceCount} invoice
                      {client.invoiceCount !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{client.email}</span>
                  </div>

                  {client.phone && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{client.phone}</span>
                    </div>
                  )}

                  <div className="flex items-start space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <div>
                      <div>{client.address}</div>
                      <div>
                        {client.city}, {client.state} {client.zipCode}
                      </div>
                    </div>
                  </div>

                  {client.taxId && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Tax ID:</span>{" "}
                      {client.taxId}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Client Form Modal */}
      <ClientForm
        open={showClientForm}
        onOpenChange={handleFormClose}
        client={selectedClient}
        onClientSaved={handleClientSaved}
      />
    </div>
  );
}
