import { openDB } from 'idb';
import type { Product, EmailData, Order } from '../types';

const dbPromise = openDB('workflow-db', 2, { // Zwiększamy wersję bazy danych
  upgrade(db, oldVersion, newVersion) {
    // Products store
    if (!db.objectStoreNames.contains('products')) {
      db.createObjectStore('products', { keyPath: 'id' });
    }
    
    // Orders store - usuwamy autoIncrement i dodajemy generator ID
    if (!db.objectStoreNames.contains('orders')) {
      const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
      orderStore.createIndex('orderNumber', 'orderNumber', { unique: true });
      orderStore.createIndex('createdAt', 'createdAt');
    }

    // Settings store
    if (!db.objectStoreNames.contains('settings')) {
      db.createObjectStore('settings', { keyPath: 'key' });
    }
  },
});

// Generator ID dla zamówień
const generateOrderId = () => {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const productsDB = {
  async getAll(): Promise<Product[]> {
    const db = await dbPromise;
    return db.getAll('products');
  },
  
  async add(product: Omit<Product, 'id'>): Promise<Product> {
    const db = await dbPromise;
    const id = Date.now().toString();
    const newProduct = { id, ...product };
    await db.add('products', newProduct);
    return newProduct;
  },
  
  async update(product: Product): Promise<void> {
    const db = await dbPromise;
    await db.put('products', product);
  },
  
  async delete(id: string): Promise<void> {
    const db = await dbPromise;
    await db.delete('products', id);
  },

  async deleteAll(): Promise<void> {
    const db = await dbPromise;
    await db.clear('products');
  }
};

export const emailsDB = {
  async getAll(): Promise<EmailData[]> {
    const db = await dbPromise;
    return db.getAll('emails');
  },

  async add(email: EmailData): Promise<EmailData> {
    const db = await dbPromise;
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newEmail = { ...email, id };
    await db.add('emails', newEmail);
    return newEmail;
  },

  async deleteAll(): Promise<void> {
    const db = await dbPromise;
    await db.clear('emails');
  }
};

export const settingsDB = {
  async get(key: string): Promise<{ key: string, value: string } | undefined> {
    const db = await dbPromise;
    return db.get('settings', key);
  },

  async set(key: string, value: string): Promise<void> {
    const db = await dbPromise;
    await db.put('settings', { key, value });
  }
};

export const ordersDB = {
  async getAll(): Promise<Order[]> {
    const db = await dbPromise;
    const orders = await db.getAll('orders');
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  async add(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const db = await dbPromise;
    const tx = db.transaction('orders', 'readwrite');
    const store = tx.objectStore('orders');

    const timestamp = new Date();
    const newOrder: Order = {
      id: generateOrderId(),
      ...orderData,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await store.add(newOrder);
    await tx.done;

    return newOrder;
  },
  
  async update(order: Order): Promise<void> {
    const db = await dbPromise;
    const tx = db.transaction('orders', 'readwrite');
    const store = tx.objectStore('orders');

    const updatedOrder = {
      ...order,
      updatedAt: new Date()
    };

    await store.put(updatedOrder);
    await tx.done;
  },
  
  async delete(id: string): Promise<void> {
    const db = await dbPromise;
    const tx = db.transaction('orders', 'readwrite');
    const store = tx.objectStore('orders');
    
    await store.delete(id);
    await tx.done;
  },

  async getById(id: string): Promise<Order | undefined> {
    const db = await dbPromise;
    return db.get('orders', id);
  }
};