import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function initDatabase() {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            orderNumber TEXT NOT NULL,
            clientName TEXT NOT NULL,
            projectName TEXT NOT NULL,
            status TEXT CHECK(status IN ('new', 'shipped', 'delivered', 'completed', 'archived')) NOT NULL,
            notes TEXT,
            pzDocumentLink TEXT,
            invoiceLink TEXT,
            pzAddedAt TEXT,
            invoiceAddedAt TEXT,
            userId TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            isArchived INTEGER DEFAULT 0,
            archivedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS order_products (
            orderId TEXT,
            productId TEXT,
            quantity INTEGER NOT NULL,
            FOREIGN KEY (orderId) REFERENCES orders(id),
            FOREIGN KEY (productId) REFERENCES products(id),
            PRIMARY KEY (orderId, productId)
        );
    `);

    await db.close();
    
    console.log('Database initialized successfully');
}
