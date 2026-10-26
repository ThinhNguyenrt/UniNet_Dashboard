import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { X, LogOut, Shield, Megaphone } from 'lucide-react';
import logoImg from '../../assets/logo.jpg';
import { useAuth } from '../../context/AuthContext';
import { roleNavigationConfig } from '../../data/navigation';
import { SidebarItem } from './SidebarItem';
import { useNotifications } from '../../context/notifications-context';
import { useAdminManagement } from '../../context/admin-management-context';
import { GraduationCap, Building2, Users } from 'lucide-react';
import type { NavigationItem } from '../../types/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, collapsed = false }) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const { canManage } = useNotifications();
  const access = useAdminManagement();

  if (!currentUser) return null;

  const prefix = '/' + currentUser.role;
  // Keep Admin navigation discoverable while capabilities are unavailable;
  // page guards and backend permissions still control access to all data/actions.
  const canNavigate = (permission: string) => access.has(permission) || (currentUser.role === 'admin' && access.capabilities === null);
  const system: NavigationItem[] = (roleNavigationConfig[currentUser.role] || []).filter(item => item.id !== 'verificator-users-group' && (item.id !== 'admin-staff' || canNavigate('users.view'))).map(item => ({ ...item, section: 'Quản lý hệ thống' }));
  if (canNavigate('users.view')) system.splice(currentUser.role === 'admin' ? 1 : 0, 0, { id: 'managed-users', label: 'Người dùng', path: prefix + '/users', icon: Users, section: 'Quản lý hệ thống' });
  const reviews: NavigationItem[] = [
    ...(canNavigate('verification.student.review') ? [{ id: 'student-review', label: 'Xác minh sinh viên', path: prefix + '/student-verifications', icon: GraduationCap, section: 'Kiểm duyệt & xác minh' }] : []),
    ...(canNavigate('verification.partner.review') ? [{ id: 'partner-review', label: 'Xác minh đối tác', path: prefix + '/partner-verifications', icon: Building2, section: 'Kiểm duyệt & xác minh' }] : []),
  ];
  const navItems: NavigationItem[] = [...system, ...reviews, ...(canManage && currentUser.role === 'admin' ? [{ id: 'notification-broadcasts', label: 'Thông báo hệ thống', path: '/admin/notification-broadcasts', icon: Megaphone, section: 'Thông báo' }] : [])];

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
          {navItems.map((item, index) => (
            <React.Fragment key={item.id}>
            {(index === 0 || item.section !== navItems[index - 1].section) && <div className={'px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 ' + (collapsed ? 'lg:sr-only' : '')}>{item.section}</div>}
            <div className={collapsed ? 'lg:hidden' : ''}>
            <SidebarItem
              item={item}
              currentPath={location.pathname}
              onNavigate={onClose}
            />
            </div>
            {collapsed && <NavLink to={item.path || '#'} title={item.label} aria-label={item.label} className={({ isActive }) => 'relative hidden min-h-11 items-center justify-center rounded-xl lg:flex ' + (isActive ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-blue-50')}><item.icon size={19} />{item.badge && <span className="absolute -right-1 -top-1 rounded-full bg-blue-100 px-1 text-[10px] text-blue-800">{item.badge}</span>}</NavLink>}
            </React.Fragment>
          ))}
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
        {collapsed && <button type="button" onClick={logout} aria-label="Đăng xuất" title="Đăng xuất" className="mx-3 mb-4 hidden min-h-11 items-center justify-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 lg:flex"><LogOut size={19} /></button>}
      </aside>
    </>
  );
};
