import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { OrderForm } from '../components/OrderForm';
import type { Order } from '../types';
import { databaseService, type LocalOrder } from '../services/databaseService';
import { useData } from '../contexts/DataContext';
import { Edit, Trash, Search, ArrowUpDown, Eye } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { EditOrderForm } from '../components/EditOrderForm';

type SortField = 'orderNumber' | 'clientName' | 'projectName' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';
type OrderStatus = 'new' | 'shipped' | 'delivered' | 'completed';

interface OrderListProps {
  onNewOrder: () => void;
  onEdit: (order: Order) => void;
}

export function Orders() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const { refreshOrders } = useData();

  const handleSubmit = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Orders component received order data:', orderData);
      console.log('PZ Document Link in Orders:', orderData.pzDocumentLink);
      
      // Convert to LocalOrder type for database
      const localOrder = {
        ...orderData,
        userId: '1',
        isArchived: false,
        pzAddedAt: orderData.pzAddedAt ? new Date(orderData.pzAddedAt) : undefined,
        invoiceAddedAt: orderData.invoiceAddedAt ? new Date(orderData.invoiceAddedAt) : undefined,
        invoiceLink: orderData.invoiceLink || undefined,
        archivedAt: orderData.archivedAt || null
      };

      await databaseService.createOrder(localOrder);
      await refreshOrders();
      setIsCreating(false);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      throw error;
    }
  };

  const handleEdit = (order: Order) => {
    // Ensure isArchived is always a boolean
    setEditingOrder({
      ...order,
      userId: order.userId || '1', // Add required userId
      isArchived: order.isArchived ?? false, 
      invoiceLink: order.invoiceLink || undefined
    });
  };

  const handleUpdateOrder = async (orderId: string, updatedOrder: Order) => {
    try {
      console.log('Updating order in Orders component:', { 
        orderId, 
        updatedOrder,
        pzDocumentLink: updatedOrder.pzDocumentLink 
      });

      // Convert the Order type to LocalOrder type
      const localOrder: LocalOrder = {
        ...updatedOrder,
        userId: updatedOrder.userId || '1', // Ensure userId is present
        isArchived: Boolean(updatedOrder.isArchived),
        pzAddedAt: updatedOrder.pzAddedAt ? new Date(updatedOrder.pzAddedAt) : undefined,
        invoiceAddedAt: updatedOrder.invoiceAddedAt ? new Date(updatedOrder.invoiceAddedAt) : undefined,
        invoiceLink: updatedOrder.invoiceLink || undefined,
        notes: updatedOrder.notes || undefined,
        pzDocumentLink: updatedOrder.pzDocumentLink || undefined,
        archivedAt: updatedOrder.archivedAt || null // Change undefined to null
      };

      const result = await databaseService.updateOrder(orderId, localOrder);
      console.log('Update result:', result);

      if (!result) {
        throw new Error('Failed to update order - no response from server');
      }

      await refreshOrders();
      setEditingOrder(null);
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order. Please check console for details.');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto p-4">
          {/* Buttons Container - Added before conditional rendering */}
          <div className="mb-4 flex justify-end gap-2">
            <button
              onClick={() => {
                console.log('Delete All clicked');
                // handleDeleteAllOrders();
              }}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Delete All Orders
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              New Order
            </button>
          </div>

          {isCreating ? (
            <OrderForm
              onSubmit={handleSubmit}
              onCancel={() => setIsCreating(false)}
            />
          ) : editingOrder ? (
            <EditOrderForm
              order={{
                ...editingOrder,
                isArchived: editingOrder.isArchived ?? false,
                invoiceLink: editingOrder.invoiceLink || undefined
                // Remove userId from here since it's not needed in EditOrderFormProps
              }}
              onSave={async (updatedOrder) => {
                try {
                  await handleUpdateOrder(editingOrder.id, {
                    ...updatedOrder,
                    userId: editingOrder.userId, // Add userId when sending to handleUpdateOrder
                    invoiceLink: updatedOrder.invoiceLink || undefined
                  });
                } catch (error) {
                  console.error('Error in onSave callback:', error);
                  throw error;
                }
              }}
              onCancel={() => setEditingOrder(null)}
            />
          ) : (
            <div className="bg-white shadow rounded-lg">
              <OrderList 
                onNewOrder={() => setIsCreating(true)}
                onEdit={handleEdit}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export function OrderList({ onEdit }: OrderListProps) {
  const { orders = [], products = [], refreshOrders, isLoading } = useData(); // Ensure orders and products are initialized as empty arrays
  const [sortField, setSortField] = useState<SortField>('orderNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | ''>('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const getProductName = useCallback((productId: string): string => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  }, [products]);

  // Filter out archived orders
  const activeOrders = orders.filter(order => !order.isArchived);

  const filteredAndSortedOrders = useMemo(() => {
    return activeOrders
      .filter(order => {
        if (clientFilter && !order.clientName.toLowerCase().includes(clientFilter.toLowerCase())) {
          return false;
        }
        if (projectFilter && !order.projectName.toLowerCase().includes(projectFilter.toLowerCase())) {
          return false;
        }
        if (statusFilter && order.status !== statusFilter) {
          return false;
        }
        if (searchTerm) {
          return order.products.some(p => {
            const productNameValue = getProductName(p.productId);
            return productNameValue.toLowerCase().includes(searchTerm.toLowerCase());
          });
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortField) {
          case 'orderNumber':
            return sortDirection === 'asc' 
              ? a.orderNumber.localeCompare(b.orderNumber)
              : b.orderNumber.localeCompare(a.orderNumber);
          case 'clientName':
            return sortDirection === 'asc'
              ? a.clientName.localeCompare(b.clientName)
              : b.clientName.localeCompare(a.clientName);
          case 'projectName':
            return sortDirection === 'asc'
              ? a.projectName.localeCompare(b.projectName)
              : b.projectName.localeCompare(a.projectName);
          case 'status':
            return sortDirection === 'asc'
              ? a.status.localeCompare(b.status)
              : b.status.localeCompare(a.status);
          case 'createdAt':
            return sortDirection === 'asc'
              ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          default:
            return 0;
        }
      });
  }, [activeOrders, products, sortField, sortDirection, searchTerm, clientFilter, projectFilter, statusFilter, getProductName]);

  // Calculate pagination values
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = useMemo(() => {
    return filteredAndSortedOrders.slice(startIndex, endIndex);
  }, [filteredAndSortedOrders, startIndex, endIndex]);

  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);

  useEffect(() => {
    if (!orders.length || !products.length) {
      return;
    }
  }, [orders, products]);

  const handleEditOrder = (order: Order) => {
    onEdit(order);
  };

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      setIsDeleting(id);
      await databaseService.deleteOrder(id);
      await refreshOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-500">Loading orders...</div>
      </div>
    );
  }

  if (!orders.length || !products.length) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-red-500">Error loading data</div>
      </div>
    );
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-30" />;
    return <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />;
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Client</label>
            <input
              type="text"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              placeholder="Filter by client..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Project</label>
            <input
              type="text"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              placeholder="Filter by project..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Statuses</option>
              <option value="new">Nowe</option>
              <option value="shipped">Wysłane</option>
              <option value="delivered">Dostarczone</option>
              <option value="completed">Zakończone</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Search Products</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by product..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pr-10"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('orderNumber')}
              >
                <div className="flex items-center gap-2">
                  Order Number
                  {renderSortIcon('orderNumber')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('clientName')}
              >
                <div className="flex items-center gap-2">
                  Client
                  {renderSortIcon('clientName')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('projectName')}
              >
                <div className="flex items-center gap-2">
                  Project
                  {renderSortIcon('projectName')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-2">
                  Status
                  {renderSortIcon('status')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-2">
                  Created At
                  {renderSortIcon('createdAt')}
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedOrders.map((order) => (
              <React.Fragment key={order.id}>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.projectName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'completed' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'}`}
                    >
                      {order.status === 'new' ? 'Nowe' :
                       order.status === 'shipped' ? 'Wysłane' :
                       order.status === 'delivered' ? 'Dostarczone' :
                       order.status === 'completed' ? 'Zakończone' :
                       order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      data-tooltip-id={`order-${order.id}`}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditOrder(order)}
                      className="text-indigo-600 hover:text-indigo-900"
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
                  place="left"
                  html={`
                    <div class="p-2">
                        <div class="font-bold mb-2">Products:</div>
                         <ul class="list-disc pl-4 mb-2">
                          ${(order.products ?? []).map(({ productId, quantity }) => `
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
                />
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm text-gray-700 mr-4">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to first page when changing items per page
              }}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-700 ml-4">entries</span>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(endIndex, filteredAndSortedOrders.length)}
                </span>{' '}
                of <span className="font-medium">{filteredAndSortedOrders.length}</span> orders
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                {/* First Page */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">First</span>
                  «
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  ‹
                </button>

                {/* Page Numbers */}
                {[...Array(totalPages)].map((_, i) => {
                  const pageNumber = i + 1;
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                          ${currentPage === pageNumber
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  }
                  if (
                    pageNumber === currentPage - 3 ||
                    pageNumber === currentPage + 2
                  ) {
                    return (
                      <span
                        key={pageNumber}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                {/* Next Page */}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  ›
                </button>

                {/* Last Page */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Last</span>
                  »
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ensure the databaseService.getOrder method is properly implemented

