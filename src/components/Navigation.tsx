import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Package, ClipboardList, LayoutDashboard, Settings as SettingsIcon } from 'lucide-react';

export function Navigation() {
  const location = useLocation();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <Activity className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">WorkFlow</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NavLink to="/" icon={<LayoutDashboard className="h-5 w-5" />} text="Dashboard" />
              <NavLink to="/products" icon={<Package className="h-5 w-5" />} text="Products" />
              <NavLink to="/orders" icon={<ClipboardList className="h-5 w-5" />} text="Orders" />
              <NavLink to="/settings" icon={<SettingsIcon className="h-5 w-5" />} text="Settings" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, icon, text }: { to: string; icon: React.ReactNode; text: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
        isActive 
          ? 'text-indigo-600 border-b-2 border-indigo-600' 
          : 'text-gray-900 hover:text-indigo-600'
      }`}
    >
      {icon}
      <span className="ml-2">{text}</span>
    </Link>
  );
}