import { GripVertical, Eye } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import type { OrderStatus } from '../types';
import { databaseService } from '../services/databaseService';
import { useState } from 'react';
import Modal from 'react-modal';

interface Column {
  id: OrderStatus;
  title: string;
  color: string;
}

// Dodaj style dla modala
const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '600px',
    width: '90%',
    borderRadius: '8px',
    padding: '20px'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)'
  }
};

export function KanbanBoard() {
  const { orders, products, refreshOrders } = useData();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const orderToUpdate = orders.find(o => o.id === orderId);
      if (!orderToUpdate) return;

      await databaseService.updateOrder(orderId, {
        ...orderToUpdate,
        status: newStatus
      });
      await refreshOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const columns: Column[] = [
    { id: 'new', title: 'Nowe', color: 'bg-blue-100' },
    { id: 'shipped', title: 'Wysłane', color: 'bg-yellow-100' },
    { id: 'delivered', title: 'Dostarczone', color: 'bg-green-100' },
    { id: 'completed', title: 'Zakończone', color: 'bg-orange-100' }
  ];

  const getOrderDetails = (orderId: string) => {
    return orders.find(order => order.id === orderId);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <GripVertical className="h-5 w-5 mr-2" />
        Kanban Board
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map((column) => (
          <div 
            key={column.id} 
            className={`${column.color} rounded-lg p-4`}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={async (e) => {
              e.preventDefault();
              const orderId = e.dataTransfer.getData('orderId');
              await handleStatusChange(orderId, column.id);
            }}
          >
            <h4 className="font-medium text-gray-900 mb-4">
              {column.title} ({orders.filter(order => order.status === column.id).length})
            </h4>
            <div className="space-y-4">
              {orders
                .filter((order) => order.status === column.id)
                .map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-lg shadow p-4 cursor-move"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('orderId', order.id);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">{order.clientName}</div>
                        <div className="text-sm text-gray-500">{order.projectName}</div>
                      </div>
                      <div className="flex flex-col items-end">
                        <button 
                          onClick={() => setSelectedOrder(order.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <span className="text-xs text-gray-500 mt-1">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Order Details Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onRequestClose={() => setSelectedOrder(null)}
        style={modalStyles}
        contentLabel="Order Details"
      >
        <div className="modal-content">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Order Details</h2>
            <button
              onClick={() => setSelectedOrder(null)}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>
          {selectedOrder && getOrderDetails(selectedOrder) && (
            <div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium">Order Number</h3>
                    <p>{getOrderDetails(selectedOrder)?.orderNumber}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Client Name</h3>
                    <p>{getOrderDetails(selectedOrder)?.clientName}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Project Name</h3>
                    <p>{getOrderDetails(selectedOrder)?.projectName}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Created At</h3>
                    <p>{new Date(getOrderDetails(selectedOrder)?.createdAt ?? Date.now()).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Products</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {getOrderDetails(selectedOrder)?.products.map(({ productId, quantity }) => (
                      <div key={productId} className="flex justify-between py-1">
                        <span>{getProductName(productId)}</span>
                        <span>×{quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {getOrderDetails(selectedOrder)?.notes && (
                  <div>
                    <h3 className="font-medium mb-2">Notes</h3>
                    <p className="bg-gray-50 rounded-lg p-4">{getOrderDetails(selectedOrder)?.notes}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-medium mb-2">Documents</h3>
                  <div className="flex gap-2">
                    {getOrderDetails(selectedOrder)?.pzDocumentLink && (
                      <a 
                        href={getOrderDetails(selectedOrder)?.pzDocumentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        PZ Document
                      </a>
                    )}
                    {getOrderDetails(selectedOrder)?.invoiceLink && (
                      <a
                        href={getOrderDetails(selectedOrder)?.invoiceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                      >
                        Invoice
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}