import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Package, ClipboardList, Settings, Archive } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {

  return (
    <div className="min-h-screen">
      {/* Header with navigation */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-900">WorkFlow App</span>
            </div>
            {/* Change nav class to make links horizontal */}
            <nav className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              >
                <Home className="text-gray-400 group-hover:text-gray-500 mr-3 h-6 w-6" />
                Dashboard
              </Link>
              
              <Link
                to="/orders"
                className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              >
                <ClipboardList className="text-gray-400 group-hover:text-gray-500 mr-3 h-6 w-6" />
                Orders
              </Link>
          
              {/* Add Archived Orders Link */}
              <Link
                to="/archived"
                className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              >
                <Archive className="text-gray-400 group-hover:text-gray-500 mr-3 h-6 w-6" />
                Archived Orders
              </Link>
          
              <Link
                to="/products"
                className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              >
                <Package className="text-gray-400 group-hover:text-gray-500 mr-3 h-6 w-6" />
                Products
              </Link>
          
              <Link
                to="/settings"
                className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              >
                <Settings className="text-gray-400 group-hover:text-gray-500 mr-3 h-6 w-6" />
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