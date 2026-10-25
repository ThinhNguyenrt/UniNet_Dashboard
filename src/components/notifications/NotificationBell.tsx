import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/notifications-context';

export function NotificationBell() {
  const { currentUser } = useAuth();
  const { unreadCount } = useNotifications();
  if (!currentUser) return null;
  return <Link to={`/${currentUser.role}/notifications`} aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`} className="relative rounded-xl p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-blue-600">
    <Bell size={20} />
    {unreadCount > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 flex min-w-4 h-4 px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
  </Link>;
}
