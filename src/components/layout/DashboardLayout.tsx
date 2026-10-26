import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NotificationsProvider } from '../../context/NotificationsProvider';
import { useAuth } from '../../context/AuthContext';
import { AdminManagementProvider } from '../../context/AdminManagementProvider';
import { ManagementConnectionNotice } from '../management/ManagementUI';

export const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser } = useAuth();

  return (
    <NotificationsProvider key={`${currentUser?.id}:${currentUser?.role}`}>
    <AdminManagementProvider>
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      {/* Sidebar điều hướng */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        collapsed={collapsed}
      />

      {/* Vùng nội dung chính */}
      <div className={'flex-1 flex flex-col min-w-0 transition-all duration-200 motion-reduce:transition-none ' + (collapsed ? 'lg:pl-20' : 'lg:pl-64')}>
        {/* Top Header */}
        <Header onToggleSidebar={() => { if (window.matchMedia('(min-width: 1024px)').matches) setCollapsed(value => !value); else setIsSidebarOpen(value => !value); }} />

        {/* Nội dung trang được chọn */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <ManagementConnectionNotice />
          <Outlet />
        </main>
      </div>
    </div>
    </AdminManagementProvider>
    </NotificationsProvider>
  );
};

export default DashboardLayout;
