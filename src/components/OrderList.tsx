import { useState } from 'react';
import { ClipboardList, Edit, Trash, AlertTriangle, ArrowUpDown } from 'lucide-react'; // Add ArrowUpDown import here
import { useData } from '../contexts/DataContext';
import type { Order } from '../types'; // Add OrderStatus import here
import 'react-tooltip/dist/react-tooltip.css';
import Modal from 'react-modal';
import { databaseService } from '../services/databaseService';
import { useAuth } from '../contexts/AuthContext';

Modal.setAppElement('#root');

interface OrderListProps {
  onNewOrder: () => void;
}

type SortField = 'orderNumber' | 'clientName' | 'projectName' | 'status' | 'createdAt';

export function OrderList({ onNewOrder }: OrderListProps) {
  const { orders } = useData();
  const { userRole } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          {/* Remove role check - allow all users to create orders */}
          <button
            onClick={onNewOrder}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Order
          </button>
        </div>
        {/* Rest of the component */}
      </div>
    </div>
  );
}