import React, { useState } from 'react';
import { Plus, X, Search } from 'lucide-react';
import type { Product, Order } from '../types';
import { useData } from '../contexts/DataContext';
import { generateOrderNumber } from '../utils/orderNumber';

interface OrderFormProps {
  onSubmit: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount'>) => void;
  onCancel: () => void;
}

interface OrderProduct {
  product: Product;
  quantity: number;
}

export function OrderForm({ onSubmit, onCancel }: OrderFormProps) {
  const { products } = useData();
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<OrderProduct[]>([]);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter products based on search term
  React.useEffect(() => {
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
    setShowProductSearch(false);
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
    console.log('Form submission started'); // Debug log

    if (selectedProducts.length === 0) {
      setError('Please add at least one product');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const orderNumber = await generateOrderNumber();
      console.log('Generated order number:', orderNumber); // Debug log
      
      const newOrder = {
        orderNumber,
        clientName,
        projectName,
        status: 'pending' as const,
        products: selectedProducts.map(({ product, quantity }) => ({
          productId: product.id,
          quantity
        })),
        notes,
        userId: '1', // Możesz dostosować to pole według potrzeb
      };

      console.log('Submitting order:', newOrder); // Debug log
      await onSubmit(newOrder);
      console.log('Order submitted successfully'); // Debug log
    } catch (error) {
      console.error('Error creating order:', error);
      setError('Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">New Order</h2>
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
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

          {/* Products */}
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
              {selectedProducts.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 bg-gray-50 p-3 rounded-md"
                >
                  <span className="flex-1">{product.name}</span>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) =>
                      handleQuantityChange(product.id, parseInt(e.target.value))
                    }
                    className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(product.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700"
            >
              {isSubmitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}