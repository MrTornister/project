import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ClipboardList, Edit, Trash } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { Dashboard } from './components/Dashboard';
import { Products } from './pages/Products';
import { Orders } from './pages/Orders';
import { Layout } from './components/Layout';
import type { Order } from './types';
import { DataProvider } from './contexts/DataContext';
import { Settings } from './pages/Settings';
import { ErrorBoundary } from './components/ErrorBoundary';
import { databaseService } from './services/databaseService';
import Modal from 'react-modal';
import { ArchivedOrders } from './components/ArchivedOrders';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Outlet } from 'react-router-dom';

// Ustaw element nadrzędny dla modali
Modal.setAppElement('#root');

interface OrderListProps {
  onNewOrder: () => void;
}

export function LocalOrderList({ onNewOrder }: OrderListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const ordersList = await databaseService.getOrders();
      setOrders(ordersList.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        clientName: order.clientName,
        projectName: order.projectName, 
        status: order.status,
        pzAddedAt: order.pzAddedAt ? new Date(order.pzAddedAt).toISOString() : undefined,
        invoiceAddedAt: order.invoiceAddedAt ? new Date(order.invoiceAddedAt).toISOString() : undefined,
        notes: order.notes || undefined, // Changed from null to undefined
        pzDocumentLink: order.pzDocumentLink || undefined, // Changed from null to undefined
        invoiceLink: order.invoiceLink || undefined, // Changed from null to undefined
        isArchived: Boolean(order.isArchived),
        archivedAt: order.archivedAt || undefined, // Changed from null to undefined 
        createdAt: order.createdAt || new Date().toISOString(),
        updatedAt: order.updatedAt || new Date().toISOString(),
        userId: order.userId,
        products: order.products
      })));
    };

    const fetchProducts = async () => {
      const productsList = await databaseService.getProducts();
      setProducts(productsList);
    };

    fetchOrders();
    fetchProducts();
  }, []);

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
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
                        'bg-gray-100 text-gray-800'}`}>
                      {order.status === 'new' ? 'Nowe' :
                       order.status === 'shipped' ? 'Wysłane' :
                       order.status === 'delivered' ? 'Dostarczone' :
                       order.status === 'completed' ? 'Zakończone' :
                       order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-4">
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
                  html={`
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
                />
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Outlet />
                    </Layout>
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="orders" element={<Orders />} />
                <Route path="archived-orders" element={<ArchivedOrders />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </Router>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;