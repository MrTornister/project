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
      console.log('Refreshing orders...');
      const loadedOrders = await databaseService.getOrders();
      console.log('Loaded orders:', loadedOrders);
      setOrders(loadedOrders || []); // Dodaj fallback do pustej tablicy
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Failed to load orders');
      setOrders([]); // W przypadku błędu ustaw pustą tablicę
    }
  };

  const refreshProducts = async () => {
    try {
      console.log('Refreshing products...');
      const loadedProducts = await databaseService.getProducts();
      console.log('Loaded products:', loadedProducts);
      setProducts(loadedProducts || []); // Dodaj fallback do pustej tablicy
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Failed to load products');
      setProducts([]); // W przypadku błędu ustaw pustą tablicę
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null); // Reset error state
      try {
        await Promise.all([refreshOrders(), refreshProducts()]);
      } catch (error) {
        console.error('Error in initial data load:', error);
        setError('Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Dodaj komunikat debugowania
  useEffect(() => {
    console.log('Current context state:', { orders, products, loading, error });
  }, [orders, products, loading, error]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
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