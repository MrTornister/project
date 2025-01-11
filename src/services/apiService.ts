import type { Order, Product } from '../types/index.js';

const API_URL = 'http://localhost:3001/api';

export const apiService = {
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

  async getProducts(): Promise<Product[]> {
    const response = await fetch(`${API_URL}/products`);
    return await response.json() as Product[];
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
    await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE'
    });
  },

  async deleteAllProducts(): Promise<void> {
    await fetch(`${API_URL}/products`, {
      method: 'DELETE'
    });
  }
};