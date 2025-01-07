export async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  
  // Replace this with your own logic to get orders from the current month
  
  // Find highest number for current month
  let maxNumber = 0;
  
  // Generate next number
  const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
  
  return `ZAM/${year}/${month}/${nextNumber}`;
}
