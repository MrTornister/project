import { useState } from 'react';
import { OrderList } from '../components/OrderList';
import { Layout } from '../components/Layout';
import { OrderForm } from '../components/OrderForm';
import type { Order } from '../types';
import { ordersDB } from '../db/database';

export function Orders() {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Add this line

  const handleNewOrder = () => {
    setShowOrderForm(true);
  };

  const handleCancelOrder = () => {
    setShowOrderForm(false);
  };

  const handleSubmitOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newOrder = await ordersDB.add(orderData);
      console.log('New order created:', newOrder);
      setShowOrderForm(false);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Failed to save order. Please try again.');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {showOrderForm ? (
            <OrderForm onSubmit={handleSubmitOrder} onCancel={handleCancelOrder} />
          ) : (
            <OrderList key={refreshKey} onNewOrder={handleNewOrder} />
          )}
        </div>
      </div>
    </Layout>
  );
}