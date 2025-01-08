import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import type { Product } from '../types';
import { productsDB } from '../db/database';
import Papa from 'papaparse';

interface ProductImportProps {
  onImport: (products: Product[]) => void;
}

export function ProductImport({ onImport }: ProductImportProps) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          console.log('Parsed Results:', results.data);
          const productsData = results.data as Partial<Product>[];
          
          // Validate required fields
          const invalidProducts = productsData.filter(product => 
            !product.name
          );

          if (invalidProducts.length > 0) {
            throw new Error('Some products have missing required fields (name)');
          }

          // Process products
          const importedProducts: Product[] = [];
          for (const product of productsData) {
            if (product.name) {
              const newProduct = await productsDB.add({ name: product.name });
              importedProducts.push(newProduct);
            }
          }

          onImport(importedProducts);
          setStatus('success');
          setMessage(`${importedProducts.length} products imported successfully`);
        } catch (error) {
          console.error('Import Error:', error);
          setStatus('error');
          setMessage(error instanceof Error ? error.message : 'Import failed');
        }
      },
      error: (error) => {
        console.error('Parsing Error:', error);
        setStatus('error');
        setMessage(error.message);
      }
    });
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer">
          <Upload className="h-4 w-4" />
          Import Products CSV
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            {message}
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            {message}
          </div>
        )}
      </div>
      <div className="mt-2 text-sm text-gray-500">
        CSV file should contain: name (required)
      </div>
    </div>
  );
}