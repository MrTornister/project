import React, { useState } from 'react';
import { Plus, X, Search } from 'lucide-react';
import type { Order, OrderStatus, Product } from '../types';
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
  const [formData, setFormData] = useState({
    clientName: '',
    projectName: '',
    notes: '',
    searchTerm: '',
    filteredProducts: [] as Product[],
    selectedProducts: [] as OrderProduct[],
    showProductSearch: false,
    isSubmitting: false,
    error: null as string | null,
    status: 'new' as OrderStatus,
    pzDocumentLink: '',
    invoiceLink: '',
  });

  // Filter products based on search term
  React.useEffect(() => {
    if (formData.searchTerm.length >= 2) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(formData.searchTerm.toLowerCase())
      );
      setFormData(prevState => ({ ...prevState, filteredProducts: filtered }));
    } else {
      setFormData(prevState => ({ ...prevState, filteredProducts: [] }));
    }
  }, [formData.searchTerm, products]);

  const handleProductSelect = (product: Product) => {
    if (!formData.selectedProducts.some(p => p.product.id === product.id)) {
      setFormData(prevState => ({
        ...prevState,
        selectedProducts: [...prevState.selectedProducts, { product, quantity: 1 }],
        searchTerm: '',
        showProductSearch: false,
      }));
    }
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setFormData(prevState => ({
      ...prevState,
      selectedProducts: prevState.selectedProducts.map(p =>
        p.product.id === productId ? { ...p, quantity } : p
      ),
    }));
  };

  const handleRemoveProduct = (productId: string) => {
    setFormData(prevState => ({
      ...prevState,
      selectedProducts: prevState.selectedProducts.filter(p => p.product.id !== productId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const orderNumber = await generateOrderNumber(1);
        const newOrder = {
            orderNumber,
            clientName: formData.clientName,
            projectName: formData.projectName,
            status: formData.status,
            notes: formData.notes,
            pzDocumentLink: formData.pzDocumentLink,
            invoiceLink: formData.invoiceLink,
            products: formData.selectedProducts.map(p => ({  // Changed from products to selectedProducts
                productId: p.product.id,
                quantity: p.quantity
            })),
            userId: '1'
        };
        
        console.log('Submitting order with products:', newOrder.products);
        await onSubmit(newOrder);
    } catch (error) {
        console.error('Error submitting form:', error);
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
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
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
              value={formData.projectName}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
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
                    value={formData.searchTerm}
                    onChange={(e) => {
                      setFormData({ ...formData, searchTerm: e.target.value, showProductSearch: true });
                    }}
                    onFocus={() => setFormData({ ...formData, showProductSearch: true })}
                    placeholder="Search products..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, showProductSearch: true })}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Product Search Results */}
              {formData.showProductSearch && formData.filteredProducts.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto">
                  {formData.filteredProducts.map((product) => (
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
              {formData.selectedProducts.map(({ product, quantity }) => (
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
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as OrderStatus })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            >
              <option value="new">Nowe</option>
              <option value="shipped">Wysłane</option>
              <option value="delivered">Dostarczone</option>
              <option value="completed">Zakończone</option>
            </select>
          </div>

          {/* Link do PZ */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Link do PZ
            </label>
            <input
              type="text"
              name="pzDocumentLink"
              value={formData.pzDocumentLink}
              onChange={(e) => setFormData({
                ...formData,
                pzDocumentLink: e.target.value
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Error Message */}
          {formData.error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {formData.error}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={formData.isSubmitting}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formData.isSubmitting}
              className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700"
            >
              {formData.isSubmitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}