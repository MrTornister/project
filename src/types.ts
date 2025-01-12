export type OrderStatus = 
  | 'new'
  | 'shipped' 
  | 'delivered'
  | 'completed'
  | 'archived';


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

