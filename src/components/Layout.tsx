import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Package, ClipboardList, Settings, Archive, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { username, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-900">WorkFlow App</span>
            </div>
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

            <div className="flex items-center">
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none"
                >
                  <User className="h-5 w-5" />
                  <span>{username}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5">
                    <div className="px-4 py-2 text-xs text-gray-500">
                      Role: {userRole}
                    </div>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate('/settings');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <div className="flex items-center space-x-2">
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}