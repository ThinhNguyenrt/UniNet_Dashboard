import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { X, LogOut, Shield } from 'lucide-react';
import logoImg from '../../assets/logo.jpg';
import { useAuth } from '../../context/AuthContext';
import { roleNavigationConfig } from '../../data/navigation';
import { SidebarItem } from './SidebarItem';
import { useAdminManagement } from '../../context/admin-management-context';
import { useNotifications } from '../../context/notifications-context';
import type { NavigationItem } from '../../types/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, collapsed = false }) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const access = useAdminManagement();
  const { unreadCount } = useNotifications();

  if (!currentUser) return null;

  // Quyền truy cập: nếu backend capabilities null (chưa tải xong hoặc offline), mặc định hiển thị để phát hiện menu
  const canNavigate = (permission: string) =>
    access.has(permission) || (currentUser.role === 'admin' && access.capabilities === null);

  const scopes: Record<string, string> = {
    'admin-revenue': 'finance.view',
    'admin-statistics': 'finance.view',
    'admin-withdrawals': 'finance.view',
    'admin-users': 'users.view',
    'admin-staff': 'staff.manage',
    'admin-student-verifications': 'verification.student.review',
    'admin-partner-verifications': 'verification.partner.review',
    'admin-project-moderation': 'project.review',
    'admin-job-postings': 'recruitment.review',
    'admin-community-posts': 'community.review',
    'admin-projects': 'verification.evidence.review',
    'accountant-statistics': 'finance.view',
    'accountant-withdrawals': 'finance.view',
  };

  const rawItems = roleNavigationConfig[currentUser.role] || [];

  // Lọc theo quyền và gắn huy hiệu (badge) thời gian thực
  const navItems: NavigationItem[] = rawItems
    .filter(item => {
      const scope = scopes[item.id];
      if (scope) {
        return canNavigate(scope);
      }
      return true;
    })
    .map(item => {
      // Gắn badge động cho hồ sơ chờ xác minh
      if (
        (item.id === 'verifier-student-verifications' || item.id === 'admin-student-verifications') &&
        (access.capabilities?.pendingStudents ?? 0) > 0
      ) {
        return { ...item, badge: String(access.capabilities!.pendingStudents) };
      }
      if (
        (item.id === 'verifier-partner-verifications' || item.id === 'admin-partner-verifications') &&
        (access.capabilities?.pendingPartners ?? 0) > 0
      ) {
        return { ...item, badge: String(access.capabilities!.pendingPartners) };
      }
      if (item.path?.includes('/notifications') && unreadCount > 0) {
        return { ...item, badge: String(unreadCount) };
      }
      return item;
    });

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
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out motion-reduce:transition-none lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'
        } ${collapsed ? 'lg:w-20' : ''}`}
      >
        {/* Brand Header */}
        <div className={'p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between ' + (collapsed ? 'lg:p-3' : '')}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 p-1 bg-white rounded-xl border border-slate-200 shadow-sm flex-shrink-0 flex items-center justify-center">
              <img
                src={logoImg}
                alt="UniNet Logo"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div className={'min-w-0 ' + (collapsed ? 'lg:hidden' : '')}>
              <h2 className="font-extrabold text-slate-900 text-sm tracking-tight truncate">
                UniNet Dashboard
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    currentUser.role === 'admin'
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : currentUser.role === 'verifier'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : currentUser.role === 'accountant'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
          {navItems.map((item, index) => {
            const isFirstOfSection = index === 0 || item.section !== navItems[index - 1].section;
            const SectionIcon = item.sectionIcon;
            return (
              <React.Fragment key={item.id}>
                {isFirstOfSection && item.section && (
                  <div className={'px-3 pt-3 pb-2 ' + (collapsed ? 'lg:sr-only' : '')}>
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {SectionIcon && <SectionIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
                      <span className="truncate">{item.section}</span>
                    </div>
                  </div>
                )}
                <div className={collapsed ? 'lg:hidden' : ''}>
                  <SidebarItem
                    item={item}
                    currentPath={location.pathname}
                    onNavigate={onClose}
                  />
                </div>
                {collapsed && (
                  <NavLink
                    to={item.path || '#'}
                    title={item.label}
                    aria-label={item.label}
                    aria-current={location.pathname === item.path ? 'page' : undefined}
                    className={({ isActive }) =>
                      'relative hidden min-h-11 items-center justify-center rounded-xl lg:flex transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ' +
                      (isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                    }
                  >
                    <item.icon size={19} />
                    {item.badge && (
                      <span className="absolute -right-1 -top-1 rounded-full bg-blue-100 px-1 text-[10px] text-blue-800">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Thông tin tài khoản người dùng & Đăng xuất ở chân Sidebar */}
        <div className={'p-3.5 border-t border-slate-100 bg-slate-50/60 ' + (collapsed ? 'lg:hidden' : '')}>
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
        {collapsed && (
          <button
            type="button"
            onClick={logout}
            aria-label="Đăng xuất"
            title="Đăng xuất"
            className="mx-3 mb-4 hidden min-h-11 items-center justify-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 lg:flex"
          >
            <LogOut size={19} />
          </button>
        )}
      </aside>
    </>
  );
};
