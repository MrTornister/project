import React, { createContext, useContext, useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import type { Order, Product, EmailData } from '../types';

interface DataContextType {
  orders: Order[];
  products: Product[];
  refreshOrders: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  emails?: EmailData[];
  refreshEmails?: () => Promise<void>;
}

export const DataContext = createContext<DataContextType>({
  orders: [],
  products: [],
  refreshOrders: async () => {},
  refreshProducts: async () => {}
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshOrders = async () => {
    try {
      const loadedOrders = await databaseService.getOrders();
      setOrders(loadedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Failed to load orders');
    }
  };

  const refreshProducts = async () => {
    try {
      const loadedProducts = await databaseService.getProducts();
      setProducts(loadedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Failed to load products');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([refreshOrders(), refreshProducts()]);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <DataContext.Provider value={{
      orders,
      products,
      refreshOrders,
      refreshProducts
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);