export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  taxId?: string;
  defaultUnitPrice?: number;
  billingAddress?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  taxId?: string;
  defaultUnitPrice?: number;
  billingAddress?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export interface UpdateClientData extends Partial<CreateClientData> {
  id: string;
}
