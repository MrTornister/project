import React from 'react';
import { TrendingUp, Package, ClipboardList, Users } from 'lucide-react';

export function Dashboard() {
  const stats = [
    { name: 'Total Revenue', value: '$45,231', icon: TrendingUp, change: '+12.5%' },
    { name: 'Products', value: '156', icon: Package, change: '+3.2%' },
    { name: 'Active Orders', value: '23', icon: ClipboardList, change: '+2.3%' },
    { name: 'Active Users', value: '48', icon: Users, change: '+5.4%' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
          >
            <dt>
              <div className="absolute bg-indigo-500 rounded-md p-3">
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                {stat.change}
              </p>
            </dd>
          </div>
        ))}
      </div>
    </div>
  );
}