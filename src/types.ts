export type OrderStatus = 
  | 'new'
  | 'shipped' 
  | 'delivered'
  | 'completed'
  | 'archived';

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
  notes?: string;
  pzDocumentLink?: string;
  invoiceLink?: string;
  pzAddedAt?: string;
  invoiceAddedAt?: string;
  isArchived: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  products: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface EmailData {
  id: string;
  sender_name: string;
  sender_email: string;
  email_id: string;
  date: Date;
  subject: string;
  folder_id: string;
  file_id: string;
  web_link_view: string;
}

