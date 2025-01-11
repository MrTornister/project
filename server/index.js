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

async function initDatabase() {
    if (!db) {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        
        // Add error logging
        db.on('error', (err) => {
            console.error('Database error:', err);
        });
    }
    return db;
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
        const orders = await db.all('SELECT * FROM orders');
        
        // Get products for each order
        const ordersWithProducts = await Promise.all(orders.map(async (order) => {
            const products = await db.all(`
                SELECT productId, quantity 
                FROM order_products 
                WHERE orderId = ?
            `, [order.id]);
            
            return {
                ...order,
                products,
                createdAt: new Date(order.createdAt),
                updatedAt: new Date(order.updatedAt)
            };
        }));
        
        res.json(ordersWithProducts);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Add POST endpoint for orders
app.post('/api/orders', async (req, res) => {
    try {
        const db = await initDatabase();
        const order = req.body;

        // Sprawdź czy zamówienie o takim numerze już istnieje
        const existingOrder = await db.get(
            'SELECT id FROM orders WHERE orderNumber = ?',
            [order.orderNumber]
        );

        if (existingOrder) {
            return res.status(400).json({
                error: 'Order number already exists'
            });
        }

        // Kontynuuj tworzenie zamówienia
        const id = `order_${Date.now()}`;
        
        // Insert the order
        await db.run(`
            INSERT INTO orders (
                id, orderNumber, clientName, projectName, 
                status, notes, userId, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime(?), datetime(?))
        `, [
            id,
            order.orderNumber,
            order.clientName,
            order.projectName,
            order.status,
            order.notes || null,
            order.userId || null,
            order.createdAt,
            order.updatedAt
        ]);

        // Insert order products
        for (const product of order.products) {
            await db.run(`
                INSERT INTO order_products (orderId, productId, quantity)
                VALUES (?, ?, ?)
            `, [id, product.productId, product.quantity]);
        }

        // Return the created order
        const createdOrder = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
        const products = await db.all('SELECT * FROM order_products WHERE orderId = ?', [id]);
        
        res.status(201).json({
            ...createdOrder,
            products,
            createdAt: new Date(createdOrder.createdAt),
            updatedAt: new Date(createdOrder.updatedAt)
        });
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

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Downloads directory: ${DOWNLOAD_DIR}`);
});