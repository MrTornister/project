import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, X, Search } from 'lucide-react';
import type { Product, Order } from '../types';
import { productsDB } from '../db/database';

interface EditOrderFormProps {
  order: Order;
  onSubmit: (order: Order) => void;
  onCancel: () => void;
}

export function EditOrderForm({ order, onSubmit, onCancel }: EditOrderFormProps) {
  const [clientName, setClientName] = useState(order.clientName);
  const [projectName, setProjectName] = useState(order.projectName);
  const [status, setStatus] = useState(order.status);
  const [notes, setNotes] = useState(order.notes || '');
  const [confirmation, setConfirmation] = useState(order.confirmation || '');
  const [documentPZ, setDocumentPZ] = useState(order.documentPZ || '');
  const [invoice, setInvoice] = useState(order.invoice || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState(
    order.products.map(p => ({
      ...p,
      name: '' // Will be populated when products are loaded
    }))
  );
  const [isSearching, setIsSearching] = useState(false);

  // Load product names for selected products
  useEffect(() => {
    const loadProductNames = async () => {
      const products = await productsDB.getAll();
      setSelectedProducts(prevProducts => 
        prevProducts.map(p => ({
          ...p,
          name: products.find(prod => prod.id === p.productId)?.name || 'Unknown Product'
        }))
      );
    };
    loadProductNames();
  }, []);

  // Debounced search function
  const searchProducts = useCallback(async (term: string) => {
    if (term.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const allProducts = await productsDB.getAll();
      const filtered = allProducts
        .filter(product => 
          product.name.toLowerCase().includes(term.toLowerCase()) &&
          !selectedProducts.some(sp => sp.productId === product.id)
        )
        .slice(0, 10);
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setIsSearching(false);
    }
  }, [selectedProducts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, searchProducts]);

  const handleAddProduct = (product: Product) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.productId === product.id);
      if (existing) {
        return prev.map(p => 
          p.productId === product.id 
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      }
      return [...prev, { productId: product.id, quantity: 1, name: product.name }];
    });
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.productId !== productId));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedProducts(prev => 
      prev.map(p => p.productId === productId ? { ...p, quantity } : p)
    );
  };

  const handleSubmit = async () => {
    try {
      const updatedOrder: Order = {
        ...order,
        clientName,
        projectName,
        status,
        notes,
        confirmation,
        documentPZ,
        invoice,
        products: selectedProducts.map(({ productId, quantity }) => ({
          productId,
          quantity
        })),
        updatedAt: new Date()
      };
      await onSubmit(updatedOrder);
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Edit Order {order.orderNumber}
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Client Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Client Name</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Status</label>
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
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Confirmation</label>
            <input
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Document PZ</label>
            <input
              type="text"
              value={documentPZ}
              onChange={(e) => setDocumentPZ(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Invoice</label>
            <input
              type="text"
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Products Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Add Products</label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products (min. 3 characters)..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pl-10"
            />
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            
            {/* Search Results Dropdown */}
            {searchTerm.length >= 3 && (searchResults.length > 0 || isSearching) && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-gray-500">Searching...</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {searchResults.map(product => (
                      <li
                        key={product.id}
                        className="p-3 hover:bg-gray-50 flex justify-between items-center cursor-pointer"
                        onClick={() => handleAddProduct(product)}
                      >
                        <span className="text-sm text-gray-900">{product.name}</span>
                        <Plus className="h-4 w-4 text-indigo-600" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Selected Products */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">Selected Products</h4>
          </div>
          <ul className="divide-y divide-gray-200">
            {selectedProducts.map(({ productId, quantity, name }) => (
              <li key={productId} className="px-4 py-3 flex justify-between items-center">
                <span className="text-sm text-gray-900">{name}</span>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(productId, parseInt(e.target.value))}
                    className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    min="1"
                  />
                  <button
                    onClick={() => handleRemoveProduct(productId)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6 flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}