import { initDatabase } from '../config/database.js';
import { databaseService } from '../services/databaseService.js';
import { generateOrderNumber } from '../utils/orderNumber.js';
import type { Order as OrderType } from '../types/index.js';

export interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  projectName: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  products: Array<{
    productId: string;
    quantity: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  notes?: string;
}

const clientNames = ['Jacek', 'Paweł', 'Bartek', 'Rafał'];
const projectNames = ['P.80', 'P.81', 'P.82', 'P.83', 'P.84', 'P.85', 'P.86', 'P.87', 'P.88', 'P.89', 'P.90'];
const statuses: OrderType['status'][] = ['new', 'shipped', 'delivered', 'completed'];
const notes = 'This is a sample note for the order.';

async function generateOrders() {
  try {
    // Initialize database first
    await initDatabase();
    
    const products = await databaseService.getProducts();
    console.log(`Found ${products.length} products in database`);

    if (products.length < 4) {
      console.error('Not enough products in the database to generate orders.');
      process.exit(1);
    }

    for (let i = 1; i <= 30; i++) {
      const clientName = clientNames[Math.floor(Math.random() * clientNames.length)];
      const projectName = projectNames[Math.floor(Math.random() * projectNames.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const selectedProducts = [];
      const productIndices = new Set<number>();
      while (productIndices.size < 4) {
        productIndices.add(Math.floor(Math.random() * products.length));
      }
      
      for (const index of productIndices) {
        selectedProducts.push({
          productId: products[index].id,
          quantity: Math.floor(Math.random() * 10) + 1
        });
      }

      const orderNumber = await generateOrderNumber(i);
      const now = new Date(); // Use Date object directly

      const order: Omit<OrderType, 'id'> = {
        orderNumber,
        clientName,
        projectName,
        status,
        products: selectedProducts,
        userId: '1',
        notes,
        createdAt: now.toISOString(),  // Convert Date to ISO string
        updatedAt: now.toISOString()   // Convert Date to ISO string
      };

      await databaseService.addOrder(order);
      console.log(`Order ${i} created with order number: ${orderNumber}`);
    }

    console.log('All orders created successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error generating orders:', error);
    process.exit(1);
  }
}

generateOrders();