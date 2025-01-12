import { useState } from 'react';
import { ClipboardList, Edit, Trash, AlertTriangle, ArrowUpDown } from 'lucide-react'; // Add ArrowUpDown import here
import { useData } from '../contexts/DataContext';
import type { Order } from '../types'; // Add OrderStatus import here
import 'react-tooltip/dist/react-tooltip.css';
import Modal from 'react-modal';
import { databaseService } from '../services/databaseService';

Modal.setAppElement('#root');

interface OrderListProps {
  onNewOrder: () => void;
}

type SortField = 'orderNumber' | 'clientName' | 'projectName' | 'status' | 'createdAt';

export function OrderList({ onNewOrder }: OrderListProps) {
  const { orders, refreshOrders } = useData();
  console.log("Orders from database:", orders);
  const [, setEditingOrder] = useState<Order | null>(null);
  const [currentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');


  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
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

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-30" />;
    return <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter orders by date
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    const matchesStartDate = !startDate || orderDate >= new Date(startDate);
    const matchesEndDate = !endDate || orderDate <= new Date(endDate);
    return matchesStartDate && matchesEndDate;
  });

  // Sort filtered orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let compareValue = 0;
    
    switch (sortField) {
      case 'createdAt':
        compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'orderNumber':
        compareValue = a.orderNumber.localeCompare(b.orderNumber);
        break;
      case 'clientName':
        compareValue = a.clientName.localeCompare(b.clientName);
        break;
      case 'projectName':
        compareValue = a.projectName.localeCompare(b.projectName);
        break;
      case 'status':
        compareValue = a.status.localeCompare(b.status);
        break;
    }

    return sortDirection === 'asc' ? compareValue : -compareValue;
  });

  // Calculate pagination
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedOrders = sortedOrders.slice(startIndex, endIndex);

  console.log('OrderList rendering'); // Dodaj log do debugowania

  return (
    <div className="space-y-4 relative">
      <div className="bg-white p-4 rounded-lg shadow-sm z-20 relative">
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
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  onClick={() => handleSort('orderNumber')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    Order Number
                    {renderSortIcon('orderNumber')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('clientName')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    Client Name
                    {renderSortIcon('clientName')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('projectName')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    Project Name
                    {renderSortIcon('projectName')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    Status
                    {renderSortIcon('status')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('createdAt')} 
                    className="flex items-center gap-2"
                  >
                    Data utworzenia
                    {sortField === 'createdAt' && <ArrowUpDown className="h-4 w-4" />}
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                    {order.createdAt ? new Date(order.createdAt).toLocaleString('pl-PL', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '—'}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}