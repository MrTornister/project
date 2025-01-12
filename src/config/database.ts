import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import { join } from 'path';
import type { Order } from '../types/index.js';


// Always use the database in the project root
const dbPath = join(process.cwd(), 'workflow.db');

console.log('Database path:', dbPath); // Add this for debugging

let db: Database | null = null;

export async function initDatabase() {
    if (!db) {
        console.log('Initializing database at:', dbPath);
        
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        
        await db.exec(`
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                orderNumber TEXT UNIQUE,
                clientName TEXT,
                projectName TEXT,
                status TEXT,
                notes TEXT,
                pzDocumentLink TEXT,
                invoiceLink TEXT,
                pzAddedAt TEXT,
                invoiceAddedAt TEXT,
                userId TEXT,
                createdAt TEXT,
                updatedAt TEXT
            );

            CREATE TABLE IF NOT EXISTS order_products (
                orderId TEXT,
                productId TEXT,
                quantity INTEGER,
                FOREIGN KEY (orderId) REFERENCES orders(id),
                FOREIGN KEY (productId) REFERENCES products(id),
                PRIMARY KEY (orderId, productId)
            );
        `);
        
        console.log('Database initialized successfully');
    }
    return db;
}

export async function getDatabase() {
    if (!db) {
        await initDatabase();
    }
    return db!;
}

// Self-executing initialization when run directly
if (import.meta.url.endsWith(process.argv[1])) {
    initDatabase()
        .then(() => {
            console.log('Database initialization complete');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Database initialization failed:', error);
            process.exit(1);
        });
}

export const databaseService = {
  async getOrders(): Promise<Order[]> {
    try {
      const db = await getDatabase();
      const orders = await db.all(`
        SELECT * FROM orders
      `);
      
      // Get products for each order
      const ordersWithProducts = await Promise.all(orders.map(async (order) => {
        const products = await db.all(`
          SELECT * FROM order_products 
          WHERE orderId = ?
        `, [order.id]);
        
        return {
          ...order,
          products,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt)
        };
      }));

      return ordersWithProducts;
    } catch (error) {
      console.error('Database error, no fallback. Returning empty array');
return [];
    }
  },

  async addOrder(order: Omit<Order, 'id'>): Promise<Order> {
    const db = await getDatabase();
    const id = `order_${Date.now()}`;
    
    await db.run(`
      INSERT INTO orders (
        id, orderNumber, clientName, projectName, 
        status, notes, userId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [id, order.orderNumber, order.clientName, order.projectName, 
        order.status, order.notes, order.userId]);

    // Add order products
    for (const product of order.products) {
      await db.run(`
        INSERT INTO order_products (orderId, productId, quantity)
        VALUES (?, ?, ?)
      `, [id, product.productId, product.quantity]);
    }

    return { ...order, id };
  },

  // Similar updates for other methods...
};
