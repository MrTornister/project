export type Role = 'admin' | 'manager' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Product {
  id: string;
  name: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  projectName: string;
  status: OrderStatus;
  products: Array<{ 
    productId: string; 
    quantity: number 
  }>;
  notes: string | null;
  pzDocumentLink: string | null;
  invoiceLink: string | null;
  pzAddedAt: string | null;
  invoiceAddedAt: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  archivedAt: string | null;
}

export type OrderStatus = 'new' | 'shipped' | 'delivered' | 'completed' | 'archived';

export interface EmailData {
  subject: string;
  content: string;
}