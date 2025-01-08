import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, X, Search } from 'lucide-react';
import { generateOrderNumber } from '../utils/orderNumber';
import type { Product, Order } from '../types';
import { productsDB } from '../db/database';

interface OrderFormProps {
  onSubmit: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function OrderForm({ onSubmit, onCancel }: OrderFormProps) {
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{ productId: string; quantity: number; name: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
          product.name.toLowerCase().includes(term.toLowerCase())
        )
        .slice(0, 10); // Limit to 10 results
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search input
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
    setSelectedProducts(prev => 
      prev.map(p => p.productId === productId ? { ...p, quantity } : p)
    );
  };

  const handleSubmit = async () => {
    if (!clientName || !projectName || selectedProducts.length === 0) {
      alert('Please fill in all required fields and add at least one product');
      return;
    }

    try {
      const orderNumber = await generateOrderNumber();
      const orderData = {
        clientName,
        projectName,
        status: 'pending' as const,
        products: selectedProducts.map(({ productId, quantity }) => ({
          productId,
          quantity
        })),
        notes,
        orderNumber,
      };

      await onSubmit(orderData);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Create New Order
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Client Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Client Name</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Product Search */}
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

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
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
          Create Order
        </button>
      </div>
    </div>
  );
}