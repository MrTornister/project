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
  products: Array<{ productId: string; quantity: number }>;
  notes?: string;
  pzDocumentLink?: string;
  invoiceLink?: string;
  pzAddedAt?: Date;
  invoiceAddedAt?: Date;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'new' | 'shipped' | 'delivered' | 'completed';

export interface EmailData {
  subject: string;
  content: string;
}