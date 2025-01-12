import { databaseService } from '../services/databaseService';

export async function generateOrderNumber(_p0: number): Promise<string> {
  const orders = await databaseService.getOrders();
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  
  // Filtruj zamówienia z tego miesiąca
  const currentMonthOrders = orders.filter(order => {
    return order.orderNumber.startsWith(`ZAM/${year}/${month}`);
  });

  // Znajdź najwyższy numer
  let maxNumber = 0;
  currentMonthOrders.forEach(order => {
    const orderNum = parseInt(order.orderNumber.split('/').pop() || '0');
    maxNumber = Math.max(maxNumber, orderNum);
  });

  // Nowy numer zamówienia
  const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
  const orderNumber = `ZAM/${year}/${month}/${nextNumber}`;

  console.log('Generated order number:', orderNumber); // Debug log
  return orderNumber;
}
