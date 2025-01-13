import type { Order, Product } from '../types'; // Import from types.ts instead of server/index.js

export interface LocalOrder extends Omit<Order, 'notes' | 'pzDocumentLink' | 'invoiceLink' | 'pzAddedAt' | 'invoiceAddedAt'> {
  notes?: string;
  pzDocumentLink?: string;
  invoiceLink?: string;
  pzAddedAt?: Date;
  invoiceAddedAt?: Date;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;  // Add required archive flag
  archivedAt: string | undefined;  // Add optional archive timestamp
  products: Array<{
    productId: string;
    quantity: number;
  }>;
}

const API_URL = 'http://localhost:3001/api';

export const databaseService = {
  async getOrders(): Promise<LocalOrder[]> {
    const response = await fetch(`${API_URL}/orders`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  },

  async addOrder(order: Omit<LocalOrder, 'id'>): Promise<LocalOrder> {
    console.log('Sending order with products:', order.products); // Debug log
    
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error:', errorText);
      throw new Error('Failed to create order');
    }

    return await response.json();
  },

  async deleteOrder(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/orders/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to delete order');
    }
  },

  async deleteAllOrders(): Promise<void> {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to delete all orders');
    }
  },

  async getOrder(id: string): Promise<LocalOrder> {
    const response = await fetch(`${API_URL}/orders/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch order');
    return response.json();
  },

  async updateOrder(id: string, order: Partial<LocalOrder>): Promise<LocalOrder> {
    const response = await fetch(`${API_URL}/orders/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(order)
    });
    if (!response.ok) throw new Error('Failed to update order');
    return response.json();
  },

  async getProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`${API_URL}/products`);
      if (!response.ok) {
        console.error('Failed to fetch products:', await response.text());
        return [];
      }
      return await response.json() as Product[];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  async addProduct(product: Product): Promise<Product> {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return await response.json() as Product;
  },

  async deleteProduct(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to delete product');
    }
  },

  async deleteAllProducts(): Promise<void> {
    const response = await fetch(`${API_URL}/products`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to delete all products');
    }
  },

  async createOrder(orderData: Omit<LocalOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<LocalOrder> {
    const orderToCreate = {
      ...orderData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pzDocumentLink: orderData.pzDocumentLink || null,
      invoiceLink: orderData.invoiceLink || null,
      pzAddedAt: orderData.pzAddedAt ? new Date(orderData.pzAddedAt).toISOString() : null,
      invoiceAddedAt: orderData.invoiceAddedAt ? new Date(orderData.invoiceAddedAt).toISOString() : null,
      notes: orderData.notes || null
    };

    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderToCreate)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Server error:', error);
      throw new Error('Failed to create order');
    }

    const createdOrder = await response.json();
    return {
      ...createdOrder,
      pzAddedAt: createdOrder.pzAddedAt ? new Date(createdOrder.pzAddedAt) : undefined,
      invoiceAddedAt: createdOrder.invoiceAddedAt ? new Date(createdOrder.invoiceAddedAt) : undefined
    };
  },

  async archiveOrder(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/orders/${id}/archive`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to archive order');
  },

  async unarchiveOrder(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/orders/${id}/unarchive`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to unarchive order');
  }
};

export async function getOrder(id: string): Promise<LocalOrder | null> {
  const response = await fetch(`${API_URL}/orders/${id}`);
  if (!response.ok) {
    console.error('Failed to load order:', response.status, await response.text());
    return null;
  }
  const order = await response.json();
  console.log('Loaded order:', order); // Add debugging
  return order;
}

export async function resetDatabase() {
  try {
    const response = await fetch(`${API_URL}/reset-database`, {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error('Failed to reset database');
    }
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}
