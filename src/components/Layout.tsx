import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, ClipboardList, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      {/* Header with navigation */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-900">WorkFlow App</span>
            </div>
            <nav className="flex space-x-8">
              <Link 
                to="/" 
                className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                  location.pathname === '/' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Home className="h-5 w-5 mr-1" />
                Dashboard
              </Link>
              <Link 
                to="/products" 
                className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                  location.pathname === '/products' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Package className="h-5 w-5 mr-1" />
                Products
              </Link>
              <Link 
                to="/orders" 
                className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                  location.pathname === '/orders' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ClipboardList className="h-5 w-5 mr-1" />
                Orders
              </Link>
              <Link 
                to="/settings" 
                className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                  location.pathname === '/settings' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Settings className="h-5 w-5 mr-1" />
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}