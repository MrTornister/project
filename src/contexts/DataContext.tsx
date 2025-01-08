// src/contexts/DataContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
import type { Order, Product } from '../types';
import { db } from '../firebaseConfig';

interface DataContextType {
  orders: Order[];
  products: Product[];
  refreshOrders: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  loading: boolean;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data and set up real-time listeners
  useEffect(() => {
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const productsQuery = query(collection(db, 'products'));

    // Set up real-time listener for orders
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Order[];
      setOrders(ordersList);
      setLoading(false);
    });

    // Set up real-time listener for products
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsList);
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
    };
  }, []);

  // Manual refresh functions if needed
  const refreshOrders = async () => {
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(ordersQuery);
    const ordersList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Order[];
    setOrders(ordersList);
  };

  const refreshProducts = async () => {
    const productsQuery = query(collection(db, 'products'));
    const snapshot = await getDocs(productsQuery);
    const productsList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
    setProducts(productsList);
  };

  return (
    <DataContext.Provider 
      value={{ 
        orders, 
        products, 
        refreshOrders,
        refreshProducts,
        loading
      }}
    >
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