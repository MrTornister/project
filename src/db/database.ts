import { openDB } from 'idb';
import type { Product, EmailData } from '../types';

const dbPromise = openDB('workflow-db', 2, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      db.createObjectStore('products', { keyPath: 'id' });
    }
    if (oldVersion < 2) {
      db.createObjectStore('emails', { keyPath: 'id' });
    }
  },
});

export const productsDB = {
  async getAll(): Promise<Product[]> {
    const db = await dbPromise;
    return db.getAll('products');
  },
  
  async add(product: Omit<Product, 'id'>): Promise<Product> {
    const db = await dbPromise;
    const id = Date.now().toString();
    const newProduct = { id, ...product };
    try {
      await db.add('products', newProduct);
    } catch (error) {
      // If add fails due to duplicate ID, try with a new ID
      newProduct.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await db.add('products', newProduct);
    }
    return newProduct;
  },
  
  async update(product: Product): Promise<void> {
    const db = await dbPromise;
    try {
      await db.put('products', product);
    } catch (error) {
      // If update fails, throw error to handle it in the import function
      throw new Error(`Failed to update product ${product.id}`);
    }
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