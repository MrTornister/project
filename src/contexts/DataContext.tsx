// src/contexts/DataContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import type { Order, Product } from '../types';
import { db } from '../firebaseConfig';

interface DataContextType {
  orders: Order[];
  products: Product[];
  loading: boolean;
  refreshOrders: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(() => {
    const cached = localStorage.getItem('orders');
    return cached ? JSON.parse(cached) : [];
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading] = useState(true);

  const refreshOrders = async () => {
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const querySnapshot = await getDocs(ordersQuery);
    const ordersList = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    }) as Order[];
    setOrders(ordersList);
    localStorage.setItem('orders', JSON.stringify(ordersList));
  };

  useEffect(() => {
    refreshOrders();

    const productsQuery = query(collection(db, 'products'));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsList);
    });

    return () => {
      unsubscribeProducts();
    };
  }, []);

  return (
    <DataContext.Provider value={{ orders, products, loading, refreshOrders }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};