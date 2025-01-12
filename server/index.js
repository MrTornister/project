import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '../workflow.db');

console.log('Server database path:', dbPath); // Add this for debugging

let db = null;

// Initialize the database with correct table schema
async function initDatabase() {
    if (!db) {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        await db.exec(`
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                orderNumber TEXT UNIQUE,
                clientName TEXT,
                projectName TEXT,
                status TEXT,
                notes TEXT DEFAULT NULL,
                pzDocumentLink TEXT DEFAULT NULL,
                invoiceLink TEXT DEFAULT NULL,
                pzAddedAt TEXT DEFAULT NULL,
                invoiceAddedAt TEXT DEFAULT NULL,
                userId TEXT,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL
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
    }
    return db;
}

// Add this after initializing the database connection
async function addMissingColumns() {
    const db = await initDatabase();
    const columns = [
        { name: 'pzDocumentLink', type: 'TEXT' },
        { name: 'invoiceLink', type: 'TEXT' },
        { name: 'pzAddedAt', type: 'TEXT' },
        { name: 'invoiceAddedAt', type: 'TEXT' },
        { name: 'notes', type: 'TEXT' }
    ];

    try {
        // Get all columns info
        const tableInfo = await db.all(`PRAGMA table_info(orders)`);
        const existingColumns = tableInfo.map(col => col.name);

        for (const column of columns) {
            try {
                if (!existingColumns.includes(column.name)) {
                    await db.run(`ALTER TABLE orders ADD COLUMN ${column.name} ${column.type}`);
                    console.log(`Added column ${column.name}`);
                }
            } catch (error) {
                console.error(`Error adding column ${column.name}:`, error);
            }
        }
    } catch (error) {
        console.error('Error getting table info:', error);
    }
}

const app = express();
app.use(cors());
app.use(express.json());

// Ścieżka do katalogu z pobranymi plikami
const DOWNLOAD_DIR = join(__dirname, 'downloads');

// Upewnij się, że katalog downloads istnieje
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

app.get('/api/email/:fileId', async (req, res) => {
  const { fileId } = req.params;
  const filePath = join(DOWNLOAD_DIR, `${fileId}.html`);

  try {
    // Sprawdź czy plik już istnieje lokalnie
    if (fs.existsSync(filePath)) {
      console.log('Serving cached file:', filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      return res.send(content);
    }

    // Jeśli plik nie istnieje, pobierz go z Google Drive
    console.log('File not found locally, fetching from Google Drive:', fileId);
    const response = await fetch(`https://drive.google.com/uc?id=${fileId}&export=download`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch file from Google Drive');
    }

    const content = await response.text();
    
    // Zapisz plik lokalnie
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('File saved:', filePath);

    res.send(content);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error fetching email content');
  }
});

// Orders endpoints
app.get('/api/orders', async (req, res) => {
    try {
        const db = await initDatabase();
        const orders = await db.all(`
            SELECT 
                o.id, 
                o.orderNumber, 
                o.clientName, 
                o.projectName, 
                o.status,
                o.notes,
                o.pzDocumentLink,
                o.invoiceLink, 
                o.pzAddedAt,
                o.invoiceAddedAt,
                datetime(o.createdAt) as createdAt,
                datetime(o.updatedAt) as updatedAt,
                o.userId
            FROM orders o
            ORDER BY o.createdAt DESC
        `);

        // Get products for each order
        const ordersWithProducts = await Promise.all(orders.map(async (order) => {
            const products = await db.all(`
                SELECT productId, quantity 
                FROM order_products 
                WHERE orderId = ?
            `, [order.id]);
            
            return {
                ...order,
                products: products || []
            };
        }));

        console.log('Orders with products:', ordersWithProducts);
        res.json(ordersWithProducts);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Fix the order creation endpoint
app.post('/api/orders', async (req, res) => {
    try {
        const db = await initDatabase();
        const order = req.body;
        const id = `order_${Date.now()}`;
        
        console.log('Creating order with products:', order.products); // Debug log
        
        await db.run('BEGIN TRANSACTION');
        
        try {
            // Insert main order record
            await db.run(`
                INSERT INTO orders (
                    id, orderNumber, clientName, projectName, 
                    status, notes, pzDocumentLink, invoiceLink,
                    userId, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            `, [
                id,
                order.orderNumber,
                order.clientName,
                order.projectName,
                order.status,
                order.notes,
                order.pzDocumentLink,
                order.invoiceLink,
                order.userId
            ]);

            // Insert order products
            if (order.products && order.products.length > 0) {
                for (const product of order.products) {
                    console.log('Inserting product:', product); // Debug log
                    await db.run(`
                        INSERT INTO order_products (orderId, productId, quantity)
                        VALUES (?, ?, ?)
                    `, [id, product.productId, product.quantity]);
                }
            }

            await db.run('COMMIT');

            // Fetch the complete order with products
            const createdOrder = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
            const products = await db.all(`
                SELECT op.productId, op.quantity 
                FROM order_products op 
                WHERE op.orderId = ?
            `, [id]);
            
            console.log('Created order:', { ...createdOrder, products }); // Debug log
            
            res.status(201).json({ ...createdOrder, products });
        } catch (error) {
            await db.run('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Add this endpoint to server/index.js
app.get('/api/orders/:id', async (req, res) => {
    try {
        const db = await initDatabase();
        const { id } = req.params;
        
        console.log('Fetching order:', id); // Add debugging
        
        // Get the order
        const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
        
        if (!order) {
            console.log('Order not found:', id); // Add debugging
            return res.status(404).json({ error: 'Order not found' });
        }
        
        // Get the products for this order
        const products = await db.all('SELECT * FROM order_products WHERE orderId = ?', [id]);
        
        console.log('Found order:', order); // Add debugging
        console.log('Found products:', products); // Add debugging
        
        res.json({
            ...order,
            products,
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt)
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// Add PUT endpoint for updating orders
app.put('/api/orders/:id', async (req, res) => {
    try {
        const db = await initDatabase();
        const { id } = req.params;
        const order = req.body;

        await db.run('BEGIN TRANSACTION');
        
        try {
            // Update the main order fields
            await db.run(`
                UPDATE orders 
                SET clientName = ?,
                    projectName = ?,
                    status = ?,
                    notes = ?,
                    pzDocumentLink = ?,
                    invoiceLink = ?,
                    updatedAt = datetime('now')
                WHERE id = ?
            `, [
                order.clientName,
                order.projectName,
                order.status,
                order.notes,
                order.pzDocumentLink,
                order.invoiceLink,
                id
            ]);

            // Update pzAddedAt if pzDocumentLink is not null
            if (order.pzDocumentLink) {
                await db.run(`
                    UPDATE orders 
                    SET pzAddedAt = datetime('now')
                    WHERE id = ?
                `, [id]);
            }

            // Update invoiceAddedAt if invoiceLink is not null
            if (order.invoiceLink) {
                await db.run(`
                    UPDATE orders 
                    SET invoiceAddedAt = datetime('now')
                    WHERE id = ?
                `, [id]);
            }

            // Update order products
            await db.run('DELETE FROM order_products WHERE orderId = ?', [id]);
            for (const product of order.products) {
                await db.run(`
                    INSERT INTO order_products (orderId, productId, quantity)
                    VALUES (?, ?, ?)
                `, [id, product.productId, product.quantity]);
            }

            await db.run('COMMIT');

            const updatedOrder = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
            const products = await db.all('SELECT * FROM order_products WHERE orderId = ?', [id]);

            res.json({
                ...updatedOrder,
                products,
                createdAt: updatedOrder.createdAt,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            await db.run('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Failed to update order' });
    }
});

// Delete single order
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const db = await initDatabase();
        const { id } = req.params;
        console.log(`Deleting order with id: ${id}`);
        await db.run('DELETE FROM order_products WHERE orderId = ?', [id]);
        await db.run('DELETE FROM orders WHERE id = ?', [id]);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
});

// Delete all orders
app.delete('/api/orders', async (req, res) => {
    try {
        const db = await initDatabase();
        await db.run('DELETE FROM order_products');
        await db.run('DELETE FROM orders');
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting all orders:', error);
        res.status(500).json({ error: 'Failed to delete all orders' });
    }
});

// Products endpoints
app.get('/api/products', async (req, res) => {
    try {
        const db = await initDatabase();
        const products = await db.all('SELECT * FROM products');
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const db = await initDatabase();
        const { id, name } = req.body;
        await db.run('INSERT OR REPLACE INTO products (id, name) VALUES (?, ?)', [id, name]);
        res.json({ id, name });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Failed to add product' });
    }
});

// Delete single product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const db = await initDatabase();
        await db.run('DELETE FROM order_products WHERE productId = ?', [req.params.id]);
        await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Delete all products
app.delete('/api/products', async (req, res) => {
    try {
        const db = await initDatabase();
        await db.run('DELETE FROM order_products');
        await db.run('DELETE FROM products');
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting all products:', error);
        res.status(500).json({ error: 'Failed to delete all products' });
    }
});

// Add this after database initialization
app.get('/api/debug/schema', async (req, res) => {
  try {
    const db = await initDatabase();
    const schema = await db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='orders'");
    console.log('Database schema:', schema);
    res.json(schema);
  } catch (error) {
    console.error('Error getting schema:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders/:id/products', async (req, res) => {
  try {
    const db = await initDatabase();
    const { id } = req.params;
    const products = await db.all(`
      SELECT productId, quantity 
      FROM order_products 
      WHERE orderId = ?
    `, [id]);
    res.json(products);
  } catch (error) {
    console.error('Error fetching order products:', error);
    res.status(500).json({ error: 'Failed to fetch order products' });
  }
});

// Call this function before starting the server
app.listen(3001, async () => {
    try {
        await addMissingColumns();
        console.log('Database schema updated');
        console.log('Server running on port 3001');
    } catch (error) {
        console.error('Error updating database schema:', error);
    }
});