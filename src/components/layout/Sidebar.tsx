import React from 'react';
import { useLocation } from 'react-router-dom';
import { X, LogOut, Shield, Bell, Megaphone } from 'lucide-react';
import logoImg from '../../assets/logo.jpg';
import { useAuth } from '../../context/AuthContext';
import { roleNavigationConfig } from '../../data/navigation';
import { SidebarItem } from './SidebarItem';
import { useNotifications } from '../../context/notifications-context';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const { canManage } = useNotifications();

  if (!currentUser) return null;

  const navItems = [...(roleNavigationConfig[currentUser.role] || []), { id: 'notifications', label: 'Thông báo của tôi', path: `/${currentUser.role}/notifications`, icon: Bell }, ...(canManage && currentUser.role === 'admin' ? [{ id: 'notification-broadcasts', label: 'Thông báo hệ thống', path: '/admin/notification-broadcasts', icon: Megaphone }] : [])];

  return (
    <>
      {/* Backdrop trên màn hình điện thoại / máy tính bảng */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Khung Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 p-1 bg-white rounded-xl border border-slate-200 shadow-sm flex-shrink-0 flex items-center justify-center">
              <img
                src={logoImg}
                alt="UniNet Logo"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-slate-900 text-sm tracking-tight truncate">
                UniNet Dashboard
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    currentUser.role === 'admin'
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : currentUser.role === 'verificator'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  <Shield className="w-2.5 h-2.5 mr-1 inline" />
                  {currentUser.role}
                </span>
              </div>
            </div>
          </div>

          {/* Nút đóng sidebar trên mobile */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Đóng thanh điều hướng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Danh sách mục điều hướng theo vai trò */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Menu Quản trị
          </div>

          {navItems.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              currentPath={location.pathname}
              onNavigate={onClose}
            />
          ))}
        </div>

        {/* Thông tin tài khoản người dùng & Đăng xuất ở chân Sidebar */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate font-mono">
                  {currentUser.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Đăng xuất khỏi hệ thống"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
