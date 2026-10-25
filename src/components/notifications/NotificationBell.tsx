import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, RefreshCw, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/notifications-context';
import { useOpenNotification } from '../../hooks/useOpenNotification';
import { getApiErrorMessage } from '../../services/api';
import { NotificationRow } from './NotificationRow';

export function NotificationBell() {
  const { currentUser } = useAuth();
  const { items, unreadCount, loading, error, refresh, readAll } = useNotifications();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const { open, opening, message, setMessage } = useOpenNotification(() => setExpanded(false));
  useEffect(() => {
    if (!expanded) return;
    const outside = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setExpanded(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setExpanded(false); trigger.current?.focus(); } };
    document.addEventListener('mousedown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape); };
  }, [expanded]);
  const markAll = async () => {
    setBusy(true); setMessage('');
    try { await readAll(); } catch (cause) { setMessage(getApiErrorMessage(cause)); } finally { setBusy(false); }
  };
  return <div ref={root} className="relative">
    <button ref={trigger} type="button" aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`} aria-haspopup="dialog" aria-expanded={expanded} aria-controls="notification-popup" onClick={() => { setExpanded(value => !value); if (!expanded) void refresh(); }} className="relative rounded-xl p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-blue-600">
      <Bell size={20} />
      {unreadCount > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 flex min-w-4 h-4 px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </button>
    {expanded && <section id="notification-popup" role="dialog" aria-label="Thông báo gần đây" className="fixed inset-x-3 top-16 z-50 max-h-[calc(100dvh-5rem)] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:w-96">
      <div className="flex items-center justify-between border-b border-slate-100 p-4"><h2 className="font-bold text-slate-900">Thông báo</h2><button type="button" onClick={() => { setExpanded(false); trigger.current?.focus(); }} aria-label="Đóng thông báo" className="p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button></div>
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 text-xs"><span className="text-slate-500" aria-live="polite">{unreadCount} chưa đọc</span><button type="button" disabled={busy || !unreadCount} onClick={() => void markAll()} className="flex items-center gap-1 text-blue-600 disabled:text-slate-400"><CheckCheck size={15} />Đọc tất cả</button></div>
      {(message || error) && <div role="alert" className="p-4 text-sm text-red-600">{message || error}<button type="button" onClick={() => void refresh()} className="ml-2 underline">Thử lại</button></div>}
      {loading && <p role="status" className="flex justify-center gap-2 p-6 text-sm text-slate-500"><RefreshCw className="animate-spin" size={16} />Đang tải thông báo…</p>}
      {!loading && !error && items.length === 0 && <p className="p-8 text-center text-sm text-slate-500">Chưa có thông báo mới.</p>}
      {items.map(item => <NotificationRow key={item.id} item={item} onOpen={item => void open(item)} disabled={opening} />)}
      <Link to={`/${currentUser?.role}/notifications`} onClick={() => setExpanded(false)} className="block border-t border-slate-100 p-3 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50">Xem tất cả thông báo</Link>
    </section>}
  </div>;
}
