import type { Order, Product } from '../types';

// Remove unused imports and fix duplicate type imports

const STORAGE_KEYS = {
  ORDERS: 'workflow_orders',
  PRODUCTS: 'workflow_products',
};

// Helper do parsowania danych z localStorage
const getStorageData = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return [];
  }
};

// Helper do zapisywania danych w localStorage
const setStorageData = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
  }
};

export const databaseService = {
  // Orders
  async getOrders(): Promise<Order[]> {
    console.log('Fetching orders from storage...');
    return getStorageData<Order>(STORAGE_KEYS.ORDERS);
  },

  async addOrder(order: Omit<Order, 'id'>): Promise<Order> {
    const orders = await this.getOrders();
    const newOrder = {
      ...order,
      id: `order_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    orders.push(newOrder);
    setStorageData(STORAGE_KEYS.ORDERS, orders);
    return newOrder;
  },

  async deleteOrder(id: string): Promise<void> {
    const orders = await this.getOrders();
    const filteredOrders = orders.filter(order => order.id !== id);
    setStorageData(STORAGE_KEYS.ORDERS, filteredOrders);
  },

  async getOrder(id: string): Promise<Order | null> {
    const orders = await this.getOrders();
    return orders.find(order => order.id === id) || null;
  },

  async updateOrder(id: string, updatedOrder: Order): Promise<void> {
    const orders = await this.getOrders();
    const index = orders.findIndex(order => order.id === id);
    if (index !== -1) {
      orders[index] = {
        ...updatedOrder,
        updatedAt: new Date()
      };
      setStorageData(STORAGE_KEYS.ORDERS, orders);
    }
  },

  // Products
  async getProducts(): Promise<Product[]> {
    console.log('Fetching products from storage...');
    return getStorageData<Product>(STORAGE_KEYS.PRODUCTS);
  },

  async addProduct(product: Product): Promise<Product> {
    const products = await this.getProducts();
    
    // Check if product with this ID already exists
    if (products.some(p => p.id === product.id)) {
      throw new Error(`Product with ID ${product.id} already exists`);
    }
    
    products.push(product);
    setStorageData(STORAGE_KEYS.PRODUCTS, products);
    return product;
  },

  async deleteProduct(id: string): Promise<void> {
    const products = await this.getProducts();
    const filteredProducts = products.filter(product => product.id !== id);
    setStorageData(STORAGE_KEYS.PRODUCTS, filteredProducts);
  },

  async deleteAllProducts(): Promise<void> {
    setStorageData(STORAGE_KEYS.PRODUCTS, []);
  },

  // Inicjalizacja przykładowych danych
  async initializeDefaultData() {
    console.log('Initializing default data...');
    
    // Sprawdź czy dane już istnieją
    const existingOrders = await this.getOrders();
    const existingProducts = await this.getProducts();

    if (existingOrders.length === 0 && existingProducts.length === 0) {
      // Przykładowe produkty
      const defaultProducts = [
        { id: 'product_1', name: 'Product 1', description: 'Description 1' },
        { id: 'product_2', name: 'Product 2', description: 'Description 2' },
      ];

      // Przykładowe zamówienia
      const defaultOrders = [
        {
          id: 'order_1',
          clientName: 'Test Client',
          projectName: 'Test Project',
          status: 'pending',
          products: [{ productId: 'product_1', quantity: 1 }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      setStorageData(STORAGE_KEYS.PRODUCTS, defaultProducts);
      setStorageData(STORAGE_KEYS.ORDERS, defaultOrders);
      
      console.log('Default data initialized');
    }
  }
};

// Initialize data on first import
databaseService.initializeDefaultData().catch(console.error);
