import React from 'react';
import { Navigation } from './Navigation';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="py-10">
        {children}
      </main>
    </div>
  );
}