import React, { useState, useEffect } from 'react';
import { Plus, X, Search } from 'lucide-react';
import { Order, Product, OrderStatus } from '../types';
import { useData } from '../contexts/DataContext';

interface EditOrderFormProps {
  order: Order;
  onSave: (updatedOrder: Order) => Promise<void>;
  onCancel: () => void;
}

interface OrderProduct {
  product: Product;
  quantity: number;
}

export function EditOrderForm({ order, onSave, onCancel }: EditOrderFormProps) {
  const { products } = useData();
  const [formData, setFormData] = useState({
    clientName: order.clientName,
    projectName: order.projectName,
    status: order.status,
    notes: order.notes || '',
    pzDocumentLink: order.pzDocumentLink || '',
    invoiceLink: order.invoiceLink || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Remove the problematic useEffect

  const handleLinkChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    field: 'pzDocumentLink' | 'invoiceLink'
  ) => {
    e.preventDefault();
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Set the appropriate date only when saving the form
    if (field === 'pzDocumentLink' && value && !order.pzDocumentLink) {
      order.pzAddedAt = new Date();
    }
    if (field === 'invoiceLink' && value && !order.invoiceLink) {
      order.invoiceAddedAt = new Date();
    }
  };

  const [selectedProducts, setSelectedProducts] = useState<OrderProduct[]>(
    (order.products ?? []).map(p => ({
      product: products.find(prod => prod.id === p.productId)!,
      quantity: p.quantity
    }))
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [] = useState<string | null>(null);

  // Filter products based on search term
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
    setIsSubmitting(true);
    try {
      console.log('Form data before update:', formData);
      console.log('Form data before update:', formData);

      const updatedOrder: Order = {
        ...order,
        clientName: formData.clientName,
        projectName: formData.projectName,
        status: formData.status,
        notes: formData.notes,
        pzDocumentLink: formData.pzDocumentLink || undefined, // Change null to undefined
        products: selectedProducts.map(({ product, quantity }) => ({
          productId: product.id,
          quantity,
        })),
        userId: order.userId, // Ensure userId is included
      };
      
      console.log('Sending updated order with link:', updatedOrder.pzDocumentLink);
      await onSave(updatedOrder);
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Two-column layout */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left column - Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
                Client Name
              </label>
              <input
                type="text"
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
                Project Name
              </label>
              <input
                type="text"
                id="projectName"
                value={formData.projectName}
                onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as OrderStatus }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="new">Nowe</option>
                <option value="shipped">Wysłane</option>
                <option value="delivered">Dostarczone</option>
                <option value="completed">Zakończone</option>
              </select>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Right column - Documents and Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Documents and Dates</h3>

            <div>
              <label htmlFor="pzDocumentLink" className="block text-sm font-medium text-gray-700">
                PZ Document Link
              </label>
              <input
                type="url"
                id="pzDocumentLink"
                value={formData.pzDocumentLink}
                onChange={(e) => handleLinkChange(e, 'pzDocumentLink')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="invoiceLink" className="block text-sm font-medium text-gray-700">
                Invoice Link
              </label>
              <input
                type="url"
                id="invoiceLink"
                value={formData.invoiceLink}
                onChange={(e) => handleLinkChange(e, 'invoiceLink')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Read-only date fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Created At</label>
                <input
                  type="text"
                  value={new Date(order.createdAt).toLocaleDateString()}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">PZ Added At</label>
                <input
                  type="text"
                  value={order.pzAddedAt ? new Date(order.pzAddedAt).toLocaleDateString() : 'Not added yet'}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Invoice Added At</label>
                <input
                  type="text"
                  value={order.invoiceAddedAt ? new Date(order.invoiceAddedAt).toLocaleDateString() : 'Not added yet'}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Products section - full width */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Products</h3>
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

        {/* Action buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}