import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Add these helper functions at the top of the file after imports
async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

function generateJWT(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    }, 
    JWT_SECRET, 
    { expiresIn: '24h' }
  );
}

// Add these constants at the top of the file
const JWT_SECRET = 'your-secret-key'; // In production, use environment

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '../workflow.db');

console.log('Server database path:', dbPath); // Add this for debugging

let db = null;

// Initialize the database with correct table schema
async function initDatabase() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  try {
    // Check if users table exists
    const usersTable = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    
    if (!usersTable) {
      // Create users table only if it doesn't exist
      await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create default admin account only if table was just created
      await db.run(`
        INSERT INTO users (username, email, password, role)
        VALUES ('admin', 'admin@example.com', ?, 'admin')
      `, [await hashPassword('admin123')]);

      console.log('Created users table with admin account');
    }

    // Create other necessary tables
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
        updatedAt TEXT,
        isArchived BOOLEAN DEFAULT 0,
        archivedAt TEXT
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

    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Update the addMissingColumns function
async function addMissingColumns() {
  const db = await initDatabase();
  
  try {
    // Check if users table exists with email column
    const usersTable = await db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
    
    if (!usersTable) {
      // Drop existing users table if it exists
      await db.exec('DROP TABLE IF EXISTS users');

      // Create new users table with all required columns
      await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create default admin account
      await db.run(`
        INSERT INTO users (username, email, password, role)
        VALUES ('admin', 'admin@example.com', ?, 'admin')
      `, [await hashPassword('admin123')]);

      console.log('Created users table with admin account');
    }

    // Check and add orders table columns
    const tableInfoOrders = await db.all(`PRAGMA table_info(orders)`);
    const existingColumnsOrders = tableInfoOrders.map(col => col.name);

    if (!existingColumnsOrders.includes('isArchived')) {
      await db.run(`ALTER TABLE orders ADD COLUMN isArchived BOOLEAN DEFAULT 0`);
      console.log('Added column isArchived to orders table');
    }

    if (!existingColumnsOrders.includes('archivedAt')) {
      await db.run(`ALTER TABLE orders ADD COLUMN archivedAt TEXT DEFAULT NULL`);
      console.log('Added column archivedAt to orders table');
    }

    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
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

// User registration
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    const db = await initDatabase();
    
    // Check if username or email already exists
    const existingUser = await db.get(
      'SELECT * FROM users WHERE username = ? OR email = ?', 
      [username, email]
    );
    
    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.username === username ? 
          'Username already exists' : 
          'Email already exists' 
      });
    }

    const hashedPassword = await hashPassword(password);
    
    await db.run(`
      INSERT INTO users (username, email, password, role)
      VALUES (?, ?, ?, 'user')
    `, [username, email, hashedPassword]);

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Failed to create user',
      details: error.message 
    });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const db = await initDatabase();
  
  const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
  if (!user || !await verifyPassword(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateJWT(user);
  res.json({ token, role: user.role });
});

// Add password change endpoint
app.post('/api/auth/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization token' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = await initDatabase();
    
    const user = await db.get('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (!user || !await verifyPassword(currentPassword, user.password)) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    const hashedNewPassword = await hashPassword(newPassword);
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, user.id]);
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Get all users (admin only)
app.get('/api/users', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization token' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = await initDatabase();
    
    const user = await db.get('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const users = await db.all('SELECT id, username, email, role FROM users');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role (admin only)
app.put('/api/users/:id/role', async (req, res) => {
  const { role } = req.body;
  const { id } = req.params;
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization token' });
  }

  if (!['admin', 'manager', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = await initDatabase();
    
    const admin = await db.get('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await db.run('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update role' });
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