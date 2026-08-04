import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 w-full flex flex-col overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}