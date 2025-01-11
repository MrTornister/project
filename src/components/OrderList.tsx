import React, { useState } from 'react';
import { ClipboardList, Edit, Trash, AlertTriangle } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import type { Order } from '../types';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import Modal from 'react-modal';
import { EditOrderForm } from './EditOrderForm';
import { databaseService } from '../services/databaseService';

Modal.setAppElement('#root');

interface OrderListProps {
  onNewOrder: () => void;
}

export function OrderList({ onNewOrder }: OrderListProps) {
  const { orders, products, refreshOrders } = useData();
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [currentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

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

  const handleSubmitEdit = async () => {
    try {
      await refreshOrders(); // Refresh orders after update
      setEditingOrder(null); // Close the modal
    } catch (error) {
      console.error('Error after updating order:', error);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    console.log(`Attempting to delete order with id: ${id}`);
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      setIsDeleting(id);
      await databaseService.deleteOrder(id);
      console.log(`Order with id: ${id} deleted successfully`);
      await refreshOrders(); // Refresh orders after deletion
    } catch (error) {
      console.error('Error deleting order:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteAllOrders = async () => {
    if (!window.confirm('Are you sure you want to delete ALL orders? This cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeletingAll(true);
      await databaseService.deleteAllOrders();
      await refreshOrders(); // Refresh orders after deletion
    } catch (error) {
      console.error('Error deleting all orders:', error);
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Calculate pagination
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedOrders = orders.slice(startIndex, endIndex);

  console.log('OrderList rendering'); // Dodaj log do debugowania

  return (
    <div className="space-y-4 relative"> {/* Dodano relative */}
      {/* Controls section - zawsze na górze */}
      <div className="bg-white p-4 rounded-lg shadow-sm z-20 relative"> {/* Dodano z-index */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <ClipboardList className="h-5 w-5 mr-2" />
            Orders
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleDeleteAllOrders}
              disabled={isDeletingAll || orders.length === 0}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-red-300"
            >
              <AlertTriangle className="inline-block h-4 w-4 mr-1" />
              {isDeletingAll ? 'Deleting...' : 'Delete All'}
            </button>
            <button
              onClick={onNewOrder}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              New Order
            </button>
          </div>
        </div>
      </div>

      {/* Table section */}
      <div className="bg-white rounded-lg shadow relative z-10"> {/* Zmniejszony z-index */}
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedOrders.map((order) => (
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
                        <button 
                          onClick={() => handleDeleteOrder(order.id)}
                          disabled={isDeleting === order.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                    <Tooltip 
                      id={`order-${order.id}`}
                      style={{ backgroundColor: "white", color: "black" }}
                      className="max-w-md shadow-lg border border-gray-200 rounded-lg"
                    />
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ...existing modal code... */}
    </div>
  );
}