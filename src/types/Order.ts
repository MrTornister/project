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
    userId: string;
    notes?: string;
  }