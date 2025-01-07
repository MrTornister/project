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
  clientName: string;
  projectName: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  products: Array<{
    productId: string;
    quantity: number;
  }>;
  userId: string;
  notes?: string;
  confirmation?: string;
  documentPZ?: string;
  invoice?: string;
  createdAt: Date;
  updatedAt: Date;
}