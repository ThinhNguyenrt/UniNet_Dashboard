import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import type { NavigationItem } from '../../types/navigation';

interface SidebarItemProps {
  item: NavigationItem;
  currentPath: string;
  onNavigate?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  currentPath,
  onNavigate,
}) => {
  const hasChildren = item.children && item.children.length > 0;

  // Kiểm tra xem có route con nào đang active không
  const isAnyChildActive = hasChildren
    ? item.children!.some(
        (child) => currentPath === child.path || currentPath.startsWith(child.path + '/')
      )
    : false;

  // Tự động mở rộng nhóm cha khi một route con đang active
  const [isOpen, setIsOpen] = useState(isAnyChildActive);

  useEffect(() => {
    if (isAnyChildActive) {
      setIsOpen(true);
    }
  }, [isAnyChildActive]);

  // Trường hợp 1: Nhóm có danh mục con lồng nhau
  if (hasChildren) {
    const Icon = item.icon;
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            isAnyChildActive
              ? 'text-blue-700 bg-blue-50/80 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Icon
              className={`w-4 h-4 flex-shrink-0 transition-colors ${
                isAnyChildActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
              }`}
            />
            <span className="truncate">{item.label}</span>
          </div>

          <ChevronDown
            className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
            }`}
          />
        </button>

        {/* Danh sách route con khi mở rộng */}
        {isOpen && (
          <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-200/80 ml-5">
            {item.children!.map((child) => {
              const ChildIcon = child.icon;
              return (
                <NavLink
                  key={child.id}
                  to={child.path}
                  onClick={onNavigate}
                  aria-current={currentPath === child.path ? 'page' : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90'
                    }`
                  }
                >
                  {ChildIcon && (
                    <ChildIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  )}
                  <span className="truncate">{child.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Trường hợp 2: Mục điều hướng đơn
  const Icon = item.icon;
  const isSelected = item.path ? (currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path + '/'))) : false;

  return (
    <NavLink
      to={item.path || '#'}
      onClick={onNavigate}
      aria-current={isSelected ? 'page' : undefined}
      className={({ isActive }) =>
        `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          isActive
            ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/25'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
        }`
      }
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
        <span className="truncate">{item.label}</span>
      </div>

      {item.badge && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-600'}`}>
          {item.badge}
        </span>
      )}
    </NavLink>
  );
};
