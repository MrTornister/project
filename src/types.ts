// import { OrderStatus } from "./types";

import { OrderStatus } from "./types";

export interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  projectName: string;
  products: Array<{
    productId: string;
    quantity: number;
  }>;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  pzDocumentLink?: string; // Change from string | null to string | undefined
  pzAddedAt?: Date | null;
  invoiceLink?: string | null;
  invoiceAddedAt?: Date | null;
  userId: string;
}
export { OrderStatus };

