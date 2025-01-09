import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';

let db: Database | null = null;

export async function initDatabase() {
    if (!db) {
        try {
            db = await open({
                filename: './workflow.db',
                driver: sqlite3.Database
            });
            console.log('Database connected successfully');
            await createTables();
            return db;
        } catch (error) {
            console.error('Database connection error:', error);
            throw error;
        }
    }
    return db;
}

async function createTables() {
    const db = await initDatabase();
    
    // Products table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL
        )
    `);

    // Orders table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            orderNumber TEXT NOT NULL,
            clientName TEXT NOT NULL,
            projectName TEXT NOT NULL,
            status TEXT NOT NULL,
            notes TEXT,
            userId TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Order products junction table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS order_products (
            orderId TEXT,
            productId TEXT,
            quantity INTEGER NOT NULL,
            FOREIGN KEY (orderId) REFERENCES orders(id),
            FOREIGN KEY (productId) REFERENCES products(id),
            PRIMARY KEY (orderId, productId)
        )
    `);
}

export async function getDatabase() {
    return await initDatabase();
}
