import React, { useState, useEffect } from 'react';
import { Plus, X, Search } from 'lucide-react';
import { databaseService } from '../services/databaseService';
import type { Order, Product } from '../types';
import { useData } from '../contexts/DataContext';

interface EditOrderFormProps {
  orderId: string;
  onSave: () => void;
  onCancel: () => void;
}

export function EditOrderForm({ orderId, onSave, onCancel }: EditOrderFormProps) {
  const { products } = useData();
  const [order, setOrder] = useState<Order | null>(null);
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [status, setStatus] = useState<Order['status']>('pending');
  const [notes, setNotes] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add new state for product search
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const orderData = await databaseService.getOrder(orderId);
        if (orderData) {
          setOrder(orderData);
          setClientName(orderData.clientName);
          setProjectName(orderData.projectName);
          setStatus(orderData.status);
          setNotes(orderData.notes || '');
          setSelectedProducts(orderData.products);
        }
      } catch (error) {
        setError('Failed to load order');
        console.error('Error loading order:', error);
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [orderId]);

  // Add product search effect
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedProducts.some(sp => sp.productId === product.id)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [searchTerm, products, selectedProducts]);

  const handleProductSelect = (product: Product) => {
    if (!selectedProducts.some(p => p.productId === product.id)) {
      setSelectedProducts([...selectedProducts, { productId: product.id, quantity: 1 }]);
    }
    setSearchTerm('');
    setShowProductSearch(false);
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setSelectedProducts(
      selectedProducts.map(p =>
        p.productId === productId ? { ...p, quantity } : p
      )
    );
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    try {
      const updatedOrder: Order = {
        ...order,
        clientName,
        projectName,
        status,
        notes,
        products: selectedProducts,
        updatedAt: new Date()
      };

      await databaseService.updateOrder(order.id, updatedOrder);
      onSave();
    } catch (error) {
      setError('Failed to update order');
      console.error('Error updating order:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-2xl mx-auto">
      <h2 className="text-lg font-medium mb-6">Edit Order</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Client Name</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Project Name</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Order['status'])}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Products Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Products
          </label>
          <div className="relative">
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowProductSearch(true);
                  }}
                  onFocus={() => setShowProductSearch(true)}
                  placeholder="Search products..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <button
                type="button"
                onClick={() => setShowProductSearch(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Product Search Results */}
            {showProductSearch && filteredProducts.length > 0 && (
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

          {/* Selected Products */}
          <div className="mt-4 space-y-2">
            {selectedProducts.map(({ productId, quantity }) => {
              const product = products.find(p => p.id === productId);
              return (
                <div
                  key={productId}
                  className="flex items-center gap-4 bg-gray-50 p-3 rounded-md"
                >
                  <span className="flex-1">{product?.name || 'Unknown Product'}</span>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) =>
                      handleQuantityChange(productId, parseInt(e.target.value))
                    }
                    className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(productId)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}