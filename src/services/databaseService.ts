import type { Order, Product } from '../types/index.js';

const API_URL = 'http://localhost:3001/api';

export const databaseService = {
  async getOrders(): Promise<Order[]> {
    const response = await fetch(`${API_URL}/orders`);
    const data = await response.json() as Order[];
    return data.map((order) => ({
      ...order,
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt)
    }));
  },

  async addOrder(order: Omit<Order, 'id'>): Promise<Order> {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    return await response.json() as Order;
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

  async getOrder(id: string): Promise<Order | null> {
    const response = await fetch(`/api/orders/${id}`);
    if (!response.ok) return null;
    const order = await response.json() as Order;
    return order;
  },

  async updateOrder(id: string, order: Order): Promise<Order> {
    console.log('DatabaseService.updateOrder called with:', {
        id,
        orderDetails: {
            clientName: order.clientName,
            projectName: order.projectName,
            status: order.status,
            productsCount: order.products?.length
        }
    });
    
    try {
        const response = await fetch(`${API_URL}/orders/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(order)
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Server error:', errorData);
            throw new Error(`Failed to update order: ${errorData}`);
        }

        const updatedOrder = await response.json();
        console.log('Updated order received:', updatedOrder);
        return updatedOrder;
        
    } catch (error) {
        console.error('Error in updateOrder:', error);
        throw error;
    }
  },

  async getProducts(): Promise<Product[]> {
    const response = await fetch(`${API_URL}/products`);
    const products = await response.json() as Product[];
    return products;
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

  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    console.log('Creating order:', orderData); // Debug log
    
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...orderData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Server error:', error);
      throw new Error('Failed to create order');
    }

    return response.json();
  }
};

export async function getOrder(id: string) {
  const response = await fetch(`${API_URL}/orders/${id}`);
  if (!response.ok) {
    console.error('Failed to load order:', response.status, await response.text());
    return null;
  }
  const order = await response.json();
  console.log('Loaded order:', order); // Add debugging
  return order;
}
