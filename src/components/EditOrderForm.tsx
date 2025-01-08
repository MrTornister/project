import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Search, Plus } from 'lucide-react';
import type { Product, Order } from '../types';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useData } from '../contexts/DataContext';

interface EditOrderFormProps {
  order: Order;
  onSubmit: (order: Order) => void;
  onCancel: () => void;
}

interface OrderProduct {
  product: Product;
  quantity: number;
}

export function EditOrderForm({ order, onSubmit, onCancel }: EditOrderFormProps) {
  const { products, refreshOrders } = useData();
  const [clientName, setClientName] = useState(order.clientName);
  const [projectName, setProjectName] = useState(order.projectName);
  const [status, setStatus] = useState(order.status);
  const [confirmation, setConfirmation] = useState(order.confirmation || '');
  const [documentPZ, setDocumentPZ] = useState(order.documentPZ || '');
  const [invoice, setInvoice] = useState(order.invoice || '');
  const [notes, setNotes] = useState(order.notes || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<OrderProduct[]>(order.products.map(p => ({
    product: { id: p.productId, name: '' },
    quantity: p.quantity
  })));

  useEffect(() => {
    setSelectedProducts(selectedProducts.map(p => ({
      ...p,
      product: products.find(product => product.id === p.product.id) || p.product
    })));
  }, [products]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [searchTerm, products]);

  const handleProductSelect = (product: Product) => {
    if (!selectedProducts.some(p => p.product.id === product.id)) {
      setSelectedProducts([...selectedProducts, { product, quantity: 1 }]);
    }
    setSearchTerm('');
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setSelectedProducts(
      selectedProducts.map(p =>
        p.product.id === productId ? { ...p, quantity } : p
      )
    );
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.product.id !== productId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedOrder: Order = {
      ...order,
      clientName,
      projectName,
      status,
      confirmation,
      documentPZ,
      invoice,
      products: selectedProducts.map(({ product, quantity }) => ({
        productId: product.id,
        quantity
      })),
      notes,
      updatedAt: new Date()
    };

    const orderRef = doc(db, 'orders', order.id);
    await updateDoc(orderRef, updatedOrder);
    await handleSubmitEdit(updatedOrder);

    onSubmit(updatedOrder);
  };

  const handleSubmitEdit = async (updatedOrder: Order) => {
    await refreshOrders(); // Niepotrzebne przy real-time listeners
    setEditingOrder(null);
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6 w-full max-w-[1000px] max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-xl font-semibold text-gray-900">Edit Order</h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">Order Details</h3>
              
              {/* Client Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Client Name
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Order['status'])}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Documents Section */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">Documents</h3>
              
              {/* Confirmation */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Potwierdzenie zamówienia
                </label>
                <input
                  type="text"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              {/* Document PZ */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Dokument PZ
                </label>
                <input
                  type="text"
                  value={documentPZ}
                  onChange={(e) => setDocumentPZ(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              {/* Invoice */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Faktura
                </label>
                <input
                  type="text"
                  value={invoice}
                  onChange={(e) => setInvoice(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Products Section */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">Products</h3>
              
              <div className="relative mb-4">
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search products..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Product Search Results */}
                {filteredProducts.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleProductSelect(product)}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        {product.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {selectedProducts.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 bg-white p-3 rounded-md shadow-sm"
                  >
                    <span className="flex-1 font-medium">{product.name}</span>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-500">Quantity:</label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) =>
                          handleQuantityChange(product.id, parseInt(e.target.value))
                        }
                        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(product.id)}
                      className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {selectedProducts.length === 0 && (
                  <div className="flex items-center justify-center p-4 text-gray-500 bg-white rounded-md">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    No products added
                  </div>
                )}
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">Notes</h3>
              
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add any additional notes here..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Form Actions - Fixed at bottom */}
        <div className="mt-8 border-t pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}