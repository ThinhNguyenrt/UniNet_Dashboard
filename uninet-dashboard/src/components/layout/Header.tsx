import React from 'react';
import { Menu, Bell, LogOut, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  if (!currentUser) return null;

  // Lấy đường dẫn phân cấp đơn giản cho Breadcrumb
  const pathParts = location.pathname.split('/').filter(Boolean);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Phía trái: Nút mở Menu Mobile + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl lg:hidden transition-colors"
          aria-label="Mở thanh điều hướng"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-500 font-medium">
          <span className="capitalize text-slate-400 font-semibold">{currentUser.role}</span>
          {pathParts.slice(1).map((part, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-300" />
              <span className="text-slate-700 font-semibold capitalize">
                {part.replace('-', ' ')}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Phía phải: Thông báo + Thông tin cá nhân & Đăng xuất */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Nút thông báo */}
        <button
          type="button"
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors relative"
          aria-label="Thông báo"
          title="Thông báo hệ thống"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
        </button>

        {/* Huy hiệu vai trò & Tài khoản */}
        <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-bold text-slate-800 leading-tight">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              {currentUser.roleName}
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>

          <button
            type="button"
            onClick={logout}
            title="Đăng xuất"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
