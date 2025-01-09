import { databaseService } from '../services/databaseService';

export async function generateOrderNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  // Get orders from local database
  const orders = await databaseService.getOrders();
  const todaysOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate.getFullYear() === date.getFullYear() &&
           orderDate.getMonth() === date.getMonth();
  });
  
  const sequential = (todaysOrders.length + 1).toString().padStart(3, '0');
  return `${year}${month}-${sequential}`;
}
