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
                updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
                isArchived BOOLEAN DEFAULT 0,
                archivedAt TEXT DEFAULT NULL
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
  
  try {
    const tableInfo = await db.all(`PRAGMA table_info(orders)`);
    const existingColumns = tableInfo.map(col => col.name);

    // Only try to add columns that don't exist
    if (!existingColumns.includes('isArchived')) {
      await db.run(`ALTER TABLE orders ADD COLUMN isArchived BOOLEAN DEFAULT 0`);
      console.log('Added column isArchived');
    }

    if (!existingColumns.includes('archivedAt')) {
      await db.run(`ALTER TABLE orders ADD COLUMN archivedAt TEXT DEFAULT NULL`);
      console.log('Added column archivedAt');
    }
  } catch (error) {
    console.error('Error adding columns:', error);
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
                o.isArchived,
                o.archivedAt,
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

// Update orders endpoint
app.put('/api/orders/:id', async (req, res) => {
  const db = await initDatabase();
  
  try {
    const { id } = req.params;
    const order = req.body;

    // Begin transaction
    await db.run('BEGIN TRANSACTION');

    await db.run(`
      UPDATE orders 
      SET 
        clientName = ?,
        projectName = ?,
        status = ?,
        notes = ?,
        pzDocumentLink = ?,
        pzAddedAt = CASE 
          WHEN ? IS NOT NULL AND (pzDocumentLink IS NULL OR pzDocumentLink != ?) THEN datetime('now')
          ELSE pzAddedAt 
        END,
        invoiceLink = ?,
        invoiceAddedAt = CASE 
          WHEN ? IS NOT NULL AND (invoiceLink IS NULL OR invoiceLink != ?) THEN datetime('now')
          ELSE invoiceAddedAt 
        END,
        updatedAt = datetime('now'),
        isArchived = ?,
        archivedAt = ?
      WHERE id = ?
    `, [
      order.clientName,
      order.projectName,
      order.status,
      order.notes,
      order.pzDocumentLink,
      order.pzDocumentLink,
      order.pzDocumentLink,
      order.invoiceLink,
      order.invoiceLink,
      order.invoiceLink,
      order.isArchived ? 1 : 0,
      order.isArchived ? new Date().toISOString() : null,
      id
    ]);

    // Update products if they changed
    if (order.products && order.products.length > 0) {
      // First delete existing products
      await db.run('DELETE FROM order_products WHERE orderId = ?', [id]);
      
      // Then insert new products
      for (const product of order.products) {
        await db.run(`
          INSERT INTO order_products (orderId, productId, quantity)
          VALUES (?, ?, ?)
        `, [id, product.productId, product.quantity]);
      }
    }

    // Commit transaction
    await db.run('COMMIT');

    // Get updated order with products
    const updatedOrder = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    const products = await db.all('SELECT * FROM order_products WHERE orderId = ?', [id]);

    res.json({
      ...updatedOrder,
      products,
      isArchived: Boolean(updatedOrder.isArchived)
    });

  } catch (error) {
    // Rollback transaction on error
    await db.run('ROLLBACK');
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Archive order
app.put('/api/orders/:id/archive', async (req, res) => {
  try {
    const db = await initDatabase();
    const { id } = req.params;
    await db.run(`
      UPDATE orders 
      SET status = 'archived', 
          archivedAt = datetime('now'),
          isArchived = 1
      WHERE id = ?
    `, [id]);
    res.status(200).send();
  } catch (error) {
    console.error('Error archiving order:', error);
    res.status(500).json({ error: 'Failed to archive order' });
  }
});

// Unarchive order
app.put('/api/orders/:id/unarchive', async (req, res) => {
  try {
    const db = await initDatabase();
    const { id } = req.params;
    await db.run(`
      UPDATE orders 
      SET status = 'completed', 
          archivedAt = NULL,
          isArchived = 0
      WHERE id = ?
    `, [id]);
    res.status(200).send();
  } catch (error) {
    console.error('Error unarchiving order:', error);
    res.status(500).json({ error: 'Failed to unarchive order' });
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