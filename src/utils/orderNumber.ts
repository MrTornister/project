import { ordersDB } from '../db/database';

export async function generateOrderNumber(): Promise<string> {
  try {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    // Get all orders
    const orders = await ordersDB.getAll();
    
    // Filter orders from current month and year
    const currentMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return (
        orderDate.getFullYear().toString().slice(-2) === year &&
        (orderDate.getMonth() + 1).toString().padStart(2, '0') === month
      );
    });
    
    // Find highest number for current month
    let maxNumber = 0;
    currentMonthOrders.forEach(order => {
      const match = order.orderNumber.match(/ZAM\/\d{2}\/\d{2}\/(\d{3})/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNumber) maxNumber = num;
      }
    });
    
    // Generate next number
    const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
    
    return `ZAM/${year}/${month}/${nextNumber}`;
  } catch (error) {
    console.error('Error generating order number:', error);
    throw new Error('Failed to generate order number');
  }
}
