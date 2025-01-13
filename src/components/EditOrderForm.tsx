import React, { useState, useEffect } from 'react';
import { Plus, X, Search } from 'lucide-react';
import { OrderStatus } from '../types';
import { useData } from '../contexts/DataContext';

interface EditOrderFormProps {
  order: Omit<Order, 'userId'>; // Remove userId from required props
  onSave: (order: Order) => Promise<void>;
  onCancel: () => void;
}

interface OrderProduct {
  product: Product;
  quantity: number;
}

export function EditOrderForm({ order, onSave, onCancel }: EditOrderFormProps) {
  const { products } = useData();
  const [formData, setFormData] = useState({
    ...order,
    isArchived: order.isArchived || false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLinkChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    field: 'pzDocumentLink' | 'invoiceLink'
  ) => {
    e.preventDefault();
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Set the appropriate date only when saving the form
    if (field === 'pzDocumentLink' && value && !order.pzDocumentLink) {
      order.pzAddedAt = new Date().toISOString();
    }
    if (field === 'invoiceLink' && value && !order.invoiceLink) {
      order.invoiceAddedAt = new Date().toISOString();
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

  const handleArchiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      isArchived: e.target.checked,
      archivedAt: e.target.checked ? new Date().toISOString() : undefined
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updatedOrder: Order = {
        ...order, // Start with all existing order fields
        clientName: formData.clientName,
        projectName: formData.projectName,
        status: formData.status,
        notes: formData.notes,
        pzDocumentLink: formData.pzDocumentLink || undefined,
        invoiceLink: formData.invoiceLink || undefined,
        isArchived: formData.isArchived,
        archivedAt: formData.archivedAt,
        products: selectedProducts.map(({ product, quantity }) => ({
          productId: product.id,
          quantity,
        })),
        updatedAt: new Date().toISOString()
      };
      
      console.log('Sending updated order:', updatedOrder);
      await onSave(updatedOrder);
      onCancel();
    } catch (error) {
      console.error('Error saving order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Basic Info and Products */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
                    Client Name
                  </label>
                  <input
                    type="text"
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as OrderStatus }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50"
                >
                  <option value="new">Nowe</option>
                  <option value="shipped">Wysłane</option>
                  <option value="delivered">Dostarczone</option>
                  <option value="completed">Zakończone</option>
                </select>
              </div>

              {formData.status === 'completed' && (
                <div className="mt-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isArchived}
                      onChange={handleArchiveChange}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Archive this order
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Products Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Products</h3>
              <div className="relative">
                <div className="flex gap-2">
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
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50"
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
              <div className="space-y-2">
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
                      className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50"
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
          </div>

          {/* Right Column - Timeline and Notes */}
          <div className="space-y-6">
            {/* Documents Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Documents</h3>
              <div>
                <label htmlFor="pzDocumentLink" className="block text-sm font-medium text-gray-700">
                  PZ Document Link
                </label>
                <input
                  type="url"
                  id="pzDocumentLink"
                  value={formData.pzDocumentLink}
                  onChange={(e) => handleLinkChange(e, 'pzDocumentLink')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50"
                />
              </div>
              <div>
                <label htmlFor="invoiceLink" className="block text-sm font-medium text-gray-700">
                  Invoice Link
                </label>
                <input
                  type="url"
                  id="invoiceLink"
                  value={formData.invoiceLink || ''}
                  onChange={(e) => handleLinkChange(e, 'invoiceLink')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50"
                />
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">Event Timeline</h3>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs overflow-y-auto mt-2">
                {[
                  { date: order.createdAt, event: 'Created' },
                  { date: order.archivedAt, event: 'Archived' },
                  { date: order.pzAddedAt, event: 'PZ Document Added' },
                  { date: order.invoiceAddedAt, event: 'Invoice Added' }
                ]
                  .filter(({date}) => date !== undefined && date !== null)
                  .sort((a, b) => {
                    const dateA = new Date(a.date as string).getTime();
                    const dateB = new Date(b.date as string).getTime();
                    return dateB - dateA;
                  })
                  .map(({date, event}, index) => (
                    <div key={index} className="text-gray-900 mb-1 last:mb-0">
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

            {/* Notes */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">Notes</h3>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50"
                placeholder="Add notes here..."
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export interface Product {
  id: string;
  name: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  projectName: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  pzDocumentLink?: string;
  pzAddedAt?: string;
  invoiceAddedAt?: string;
  invoiceLink?: string | null;
  notes?: string;
  isArchived: boolean;
  products: Array<{ 
    productId: string; 
    quantity: number 
  }>;
  archivedAt?: string;
}

// Removed local declaration of OrderStatus to resolve conflict with import

