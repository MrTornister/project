import React from 'react';
import { ProductList } from '../components/ProductList';
import { Layout } from '../components/Layout';

export function Products() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProductList />
        </div>
      </div>
    </Layout>
  );
}