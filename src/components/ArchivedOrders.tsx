import { useState } from 'react';
import { Layout } from '../components/Layout';
import { useData } from '../contexts/DataContext';
import { ArrowUpDown, Eye } from 'lucide-react'; // Add Eye import
import type { Order } from '../types';
import Modal from 'react-modal';

// Add modal styles
const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '800px', // increased from 600px
    width: '90%',
    borderRadius: '8px',
    padding: '20px'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)'
  }
};

Modal.setAppElement('#root');

type SortField = 'orderNumber' | 'clientName' | 'projectName' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export function ArchivedOrders() {
  const { orders = [], products = [], isLoading } = useData();
  const [sortField, setSortField] = useState<SortField>('orderNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  // Add new state for modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filter only archived orders
  const archivedOrders = orders.filter((order: Order) => order.isArchived);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-30" />;
    return <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />;
  };

  // Filter orders
  const filteredOrders = archivedOrders.filter(order => {
    const matchesClient = !clientFilter || order.clientName.toLowerCase().includes(clientFilter.toLowerCase());
    const matchesProject = !projectFilter || order.projectName.toLowerCase().includes(projectFilter.toLowerCase());
    const matchesSearch = !searchTerm || 
      order.products.some(p => p.productId.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesClient && matchesProject && matchesSearch;
  });

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortField === 'createdAt') {
      return sortDirection === 'asc' 
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return sortDirection === 'asc'
      ? a[sortField].localeCompare(b[sortField])
      : b[sortField].localeCompare(a[sortField]);
  });

  // Pagination
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = sortedOrders.slice(startIndex, startIndex + itemsPerPage);

  // Add function to get product name
  const getProductName = (productId: string): string => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center p-8">
          <div className="text-gray-500">Loading archived orders...</div>
        </div>
      </Layout>
    );
  }

  if (archivedOrders.length === 0) {
    return (
      <Layout>
        <div className="flex justify-center items-center p-8">
          <div className="text-gray-500">No archived orders found</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Archived Orders</h1>
          
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Client</label>
              <input
                type="text"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Filter by client..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Project</label>
              <input
                type="text"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Filter by project..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Search products..."
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
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
                      Client
                      {renderSortIcon('clientName')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('projectName')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      Project
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
                  <th 
                    onClick={() => handleSort('createdAt')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      Created At
                      {renderSortIcon('createdAt')}
                    </div>
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
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(startIndex + itemsPerPage, sortedOrders.length)}
                  </span>{' '}
                  of <span className="font-medium">{sortedOrders.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onRequestClose={() => setSelectedOrder(null)}
        style={modalStyles}
        contentLabel="Order Details"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold">Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium">Order Number</h3>
                    <p>{selectedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Status</h3>
                    <p>{selectedOrder.status}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Client</h3>
                    <p>{selectedOrder.clientName}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Project</h3>
                    <p>{selectedOrder.projectName}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Products</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedOrder.products.map(({ productId, quantity }) => (
                      <div key={productId} className="flex justify-between py-1">
                        <span>{getProductName(productId)}</span>
                        <span>×{quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Documents</h3>
                  <div className="flex gap-2">
                    {selectedOrder.pzDocumentLink && (
                      <a 
                        href={selectedOrder.pzDocumentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        PZ Document
                      </a>
                    )}
                    {selectedOrder.invoiceLink && (
                      <a
                        href={selectedOrder.invoiceLink}
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

              {/* Right Column - Timeline and Notes */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Event Timeline</h3>
                  <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs overflow-y-auto max-h-[calc(50vh-200px)]">
                    {[
                      { date: selectedOrder.createdAt, event: 'Created' },
                      { date: selectedOrder.archivedAt, event: 'Archived' },
                      { date: selectedOrder.pzAddedAt, event: 'PZ Document Added' },
                      { date: selectedOrder.invoiceAddedAt, event: 'Invoice Added' }
                    ]
                      .filter(({date}) => date !== undefined && date !== null)
                      .sort((a, b) => {
                        const dateA = new Date(a.date as string).getTime();
                        const dateB = new Date(b.date as string).getTime();
                        return dateB - dateA;
                      })
                      .map(({date, event}, index) => (
                        <div 
                          key={index} 
                          className="text-gray-900 mb-1 last:mb-0"
                        >
                          <span className="text-gray-600">
                            {new Date(date as string).toLocaleString('pl-PL', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                          <span className="text-gray-500 mx-2">-</span>
                          <span className="text-gray-900 font-medium">{event}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
                    {selectedOrder.notes ? (
                      <p className="text-gray-900">{selectedOrder.notes}</p>
                    ) : (
                      <p className="text-gray-500 italic">No notes added</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}