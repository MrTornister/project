import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  
  // Get all orders from current month
  const ordersRef = collection(db, 'orders');
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const q = query(
    ordersRef,
    where('createdAt', '>=', startOfMonth),
    where('createdAt', '<=', endOfMonth)
  );

  const querySnapshot = await getDocs(q);
  const currentMonthOrders = querySnapshot.docs;
  
  // Find highest number for current month
  let maxNumber = 0;
  currentMonthOrders.forEach(doc => {
    const orderNumber = doc.data().orderNumber;
    if (orderNumber) {
      const number = parseInt(orderNumber.split('/')[3]);
      maxNumber = Math.max(maxNumber, number);
    }
  });

  // Generate next number
  const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
  
  return `ZAM/${year}/${month}/${nextNumber}`;
}