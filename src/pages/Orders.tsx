import { useState } from 'react';
import { OrderList } from '../components/OrderList';
import { Layout } from '../components/Layout';
import { OrderForm } from '../components/OrderForm';
import type { Order } from '../types';
// Remove the following lines
// import { db } from '../firebaseConfig';
// import { collection, addDoc } from 'firebase/firestore';

export function Orders() {
  const [showOrderForm, setShowOrderForm] = useState(false);

  const handleNewOrder = () => {
    setShowOrderForm(true);
  };

  const handleCancelOrder = () => {
    setShowOrderForm(false);
  };

  const handleSubmitOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newOrder = {
      ...order,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    // Replace this with your own logic to save the order
    // await addDoc(collection(db, 'orders'), newOrder);
    setShowOrderForm(false);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {showOrderForm ? (
            <OrderForm onSubmit={handleSubmitOrder} onCancel={handleCancelOrder} />
          ) : (
            <OrderList onNewOrder={handleNewOrder} />
          )}
        </div>
      </div>
    </Layout>
  );
}