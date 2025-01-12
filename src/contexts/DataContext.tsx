import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Order, Product } from '../types';
import { databaseService } from '../services/databaseService';

interface DataContextType {
  orders: Order[];
  products: Product[];
  refreshOrders: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedOrders = await databaseService.getOrders();
      console.log('Fetched orders:', fetchedOrders);
      setOrders(fetchedOrders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedProducts = await databaseService.getProducts();
      setProducts(fetchedProducts || []); // Zabezpieczenie przed undefined
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]); // Ustaw pustą tablicę w przypadku błędu
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([refreshOrders(), refreshProducts()]).then(() => {
      setIsLoading(false);
    });
  }, [refreshOrders, refreshProducts]);

  return (
    <DataContext.Provider value={{ orders, products, refreshOrders, refreshProducts, isLoading }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}