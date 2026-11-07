import { useEffect, useState } from 'react';
import { Bell, CircleCheck, RefreshCw } from 'lucide-react';
import { useNotifications } from '../context/notifications-context';
import { notificationsService } from '../services/notifications.service';
import { getApiErrorMessage } from '../services/api';
import type { NotificationPage } from '../types/notifications';
import { NotificationRow } from '../components/notifications/NotificationRow';
import { useOpenNotification } from '../hooks/useOpenNotification';
import { groupNotifications } from '../utils/notification-targets';

const tabs = [{ value: 'all', label: 'Tất cả' }, { value: 'unread', label: 'Chưa đọc' }, { value: 'read', label: 'Đã đọc' }] as const;

export function NotificationsPage() {
  const { revision, readAll, unreadCount, readStates } = useNotifications();
  const [status, setStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<NotificationPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const { open, opening, message, setMessage } = useOpenNotification();
  const items = (data?.items ?? []).map(item => item.id in readStates ? { ...item, readAt: readStates[item.id] } : item).filter(item => status === 'all' || (status === 'unread' ? !item.readAt : !!item.readAt));
  const groups = groupNotifications(items);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const result = await notificationsService.list({ page, pageSize: 20, unreadOnly: status === 'unread', readOnly: status === 'read' }, controller.signal);
        if (!controller.signal.aborted) { setData(result); setError(''); }
      } catch (cause) { if (!controller.signal.aborted) setError(getApiErrorMessage(cause)); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load(); return () => controller.abort();
  }, [page, status, revision, attempt]);
  const markAll = async () => {
    setBusy(true); setMessage('');
    try { await readAll(); } catch (cause) { setMessage(getApiErrorMessage(cause)); } finally { setBusy(false); }
  };
  return <section data-testid="notifications-page" aria-label="Thông báo" className="mx-auto max-w-[1080px] overflow-hidden rounded-[20px] border border-blue-100 bg-[#FAFCFF] px-2.5 pb-4 sm:px-5">
    <h1 className="sr-only">Thông báo của bạn</h1>
    <div className="flex min-h-[58px] items-center justify-between gap-1 border-b border-blue-100/70 sm:gap-3">
      <div role="tablist" aria-label="Trạng thái thông báo" className="flex min-w-0 items-stretch">
        {tabs.map(tab => {
          return <button key={tab.value} type="button" role="tab" aria-label={tab.label} aria-selected={status === tab.value} onClick={() => { setStatus(tab.value); setPage(1); }} className={`flex min-h-[58px] items-center gap-1 border-b-2 px-2 text-xs font-bold transition-colors hover:bg-blue-50 focus-visible:outline-blue-600 sm:gap-2 sm:px-5 sm:text-sm ${status === tab.value ? 'border-blue-500 text-blue-600' : 'border-transparent text-[#10284B]'}`}>
            {tab.label}
          </button>;
        })}
      </div>
      <button type="button" aria-label="Đánh dấu tất cả đã đọc" disabled={busy || !unreadCount} onClick={() => void markAll()} className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline-blue-600 disabled:opacity-40"><CircleCheck size={18} /><span className="hidden sm:inline">Đánh dấu tất cả đã đọc</span></button>
    </div>
    {message && <p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{message}</p>}
    {error && <p role="alert" className="p-6 text-sm text-red-600">{error}<button type="button" onClick={() => setAttempt(value => value + 1)} className="ml-2 underline">Thử lại</button></p>}
    {loading ? <p role="status" className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><RefreshCw size={18} className="animate-spin" />Đang tải thông báo…</p> : !error && <>
      {groups.map(group => <div key={group.label}><h2 className="pb-2 pt-4 text-sm font-bold text-[#10284B]">{group.label}</h2>{group.items.map(item => <NotificationRow key={item.id} item={item} onOpen={item => void open(item)} disabled={opening} />)}</div>)}
      {!items.length && <div className="flex min-h-60 flex-col items-center justify-center gap-3 p-8 text-center text-slate-500"><span className="rounded-2xl bg-blue-50 p-4"><Bell size={28} className="text-blue-500" /></span><p className="text-sm font-semibold">{status === 'unread' ? 'Bạn đã đọc hết thông báo' : status === 'read' ? 'Chưa có thông báo đã đọc' : 'Chưa có thông báo trong mục này.'}</p></div>}
    </>}
    {!!data && (page > 1 || data.total > data.pageSize) && <div className="mt-4 flex items-center justify-between gap-2 text-xs text-slate-500"><p>{data.total} thông báo · Trang {page}</p><div className="flex gap-2"><button type="button" disabled={loading || page === 1} onClick={() => setPage(value => value - 1)} className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40">Trước</button><button type="button" disabled={loading || page * data.pageSize >= data.total} onClick={() => setPage(value => value + 1)} className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40">Sau</button></div></div>}
  </section>;
}
