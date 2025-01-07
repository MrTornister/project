import React, { useState, useEffect } from 'react';
import { GripVertical } from 'lucide-react';
import type { Order, Product } from '../types';

export function KanbanBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch orders
      const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersList = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Order[];
      setOrders(ordersList);

      // Fetch products for reference
      const productsQuery = query(collection(db, 'products'));
      const productsSnapshot = await getDocs(productsQuery);
      const productsList = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsList);
    };

    fetchData();
  }, []);

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  const columns = [
    { id: 'pending', title: 'Pending', color: 'bg-yellow-100' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100' },
    { id: 'completed', title: 'Completed', color: 'bg-green-100' },
    { id: 'cancelled', title: 'Cancelled', color: 'bg-red-100' }
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <GripVertical className="h-5 w-5 mr-2" />
        Kanban Board
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map((column) => (
          <div key={column.id} className={`${column.color} rounded-lg p-4`}>
            <h4 className="font-medium text-gray-900 mb-4">
              {column.title} ({orders.filter(order => order.status === column.id).length})
            </h4>
            <div className="space-y-4">
              {orders
                .filter((order) => order.status === column.id)
                .map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-lg shadow p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-medium text-gray-900">{order.clientName}</h5>
                        <span className="text-xs text-gray-500">{order.orderNumber}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {order.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{order.projectName}</p>
                    
                    {/* Products list */}
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-gray-700">Products:</p>
                      {order.products.map(({ productId, quantity }) => (
                        <div key={productId} className="text-xs text-gray-600 flex justify-between">
                          <span>{getProductName(productId)}</span>
                          <span className="font-medium">×{quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Documents status */}
                    <div className="mt-3 flex gap-2">
                      {order.confirmation && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Confirmed
                        </span>
                      )}
                      {order.documentPZ && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          PZ
                        </span>
                      )}
                      {order.invoice && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Invoice
                        </span>
                      )}
                    </div>

                    {/* Notes preview */}
                    {order.notes && (
                      <div className="mt-2 text-xs text-gray-500">
                        <p className="truncate">{order.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}