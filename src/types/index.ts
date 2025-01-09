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
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  products: Array<{
    productId: string;
    quantity: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
  userId?: string; // Make userId optional since it might not be always required
  notes?: string;
}

// Add this to existing types
export interface EmailData {
  id: string;
  sender_name: string;
  sender_email: string;
  email_id: string;
  date: Date;
  subject: string;
  folder_id: string;
  file_id: string; // dodaj to pole
  web_link_view: string;
}