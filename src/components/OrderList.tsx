import React, { useState, useEffect } from 'react';
import { ClipboardList, Edit, Trash } from 'lucide-react';
import type { Order, Product } from '../types';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import Modal from 'react-modal';
import { EditOrderForm } from './EditOrderForm';

interface OrderListProps {
  onNewOrder: () => void;
}

export function OrderList({ onNewOrder }: OrderListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(ordersQuery);
      const ordersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersList);
    };

    const fetchProducts = async () => {
      const productsQuery = query(collection(db, 'products'));
      const querySnapshot = await getDocs(productsQuery);
      const productsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsList);
    };

    fetchOrders();
    fetchProducts();
  }, []);

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
  };

  const handleCancelEdit = () => {
    setEditingOrder(null);
  };

  const handleSubmitEdit = (updatedOrder: Order) => {
    setOrders(orders.map(order => order.id === updatedOrder.id ? updatedOrder : order));
    setEditingOrder(null);
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <ClipboardList className="h-5 w-5 mr-2" />
          Orders
        </h3>
        <button
          onClick={onNewOrder}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          New Order
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <React.Fragment key={order.id}>
                <tr 
                  data-tooltip-id={`order-${order.id}`}
                  data-tooltip-html={`
                    <div class="p-2">
                      <div class="font-bold mb-2">Products:</div>
                      <ul class="list-disc pl-4 mb-2">
                        ${order.products.map(({ productId, quantity }) => `
                          <li>${getProductName(productId)} - ${quantity}</li>
                        `).join('')}
                      </ul>
                      ${order.notes ? `
                        <div>
                          <div class="font-bold">Notes:</div>
                          <div>${order.notes}</div>
                        </div>
                      ` : ''}
                    </div>
                  `}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.clientName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.projectName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleEditOrder(order)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                <Tooltip 
                  id={`order-${order.id}`}
                  style={{ backgroundColor: "white", color: "black" }}
                  className="max-w-md shadow-lg border border-gray-200 rounded-lg"
                  html={true}
                />
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Order Modal */}
      {editingOrder && (
        <Modal
          isOpen={!!editingOrder}
          onRequestClose={handleCancelEdit}
          contentLabel="Edit Order"
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[95vw] max-h-[90vh] overflow-y-auto"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        >
          <EditOrderForm 
            order={editingOrder} 
            onSubmit={handleSubmitEdit} 
            onCancel={handleCancelEdit} 
          />
        </Modal>
      )}
    </div>
  );
}