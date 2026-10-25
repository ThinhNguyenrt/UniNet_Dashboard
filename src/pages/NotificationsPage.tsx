import { useEffect, useState } from 'react';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { useNotifications } from '../context/notifications-context';
import { notificationsService } from '../services/notifications.service';
import { getApiErrorMessage } from '../services/api';
import type { NotificationPage } from '../types/notifications';
import { NotificationRow } from '../components/notifications/NotificationRow';
import { useOpenNotification } from '../hooks/useOpenNotification';

export function NotificationsPage() {
  const { revision, readAll, unreadCount } = useNotifications();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<NotificationPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const { open, opening, message, setMessage } = useOpenNotification();
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const result = await notificationsService.list({ page, pageSize: 20, unreadOnly, category: category || undefined }, controller.signal);
        if (!controller.signal.aborted) { setData(result); setError(''); }
      } catch (cause) { if (!controller.signal.aborted) setError(getApiErrorMessage(cause)); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load(); return () => controller.abort();
  }, [page, category, unreadOnly, revision, attempt]);
  const markAll = async () => {
    setBusy(true); setMessage('');
    try { await readAll(); } catch (cause) { setMessage(getApiErrorMessage(cause)); } finally { setBusy(false); }
  };
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-slate-900">Thông báo của bạn</h1><p className="mt-1 text-sm text-slate-500">Cập nhật xác minh, dự án và công việc dành cho tài khoản của bạn.</p></div><button type="button" disabled={busy || !unreadCount} onClick={() => void markAll()} className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-600 disabled:opacity-40"><CheckCheck size={17} />Đánh dấu tất cả đã đọc</button></div>
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2" role="group" aria-label="Lọc trạng thái thông báo">{[false, true].map(value => <button key={String(value)} type="button" aria-pressed={unreadOnly === value} onClick={() => { setUnreadOnly(value); setPage(1); }} className={`rounded-xl px-4 py-2 text-sm font-semibold ${unreadOnly === value ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{value ? 'Chưa đọc' : 'Tất cả'}</button>)}</div><label className="flex items-center gap-2 text-sm text-slate-600">Loại thông báo<select value={category} onChange={event => { setCategory(event.target.value); setPage(1); }} className="rounded-xl border border-slate-200 bg-white p-2"><option value="">Tất cả loại</option><option value="verification">Xác minh</option><option value="recruitment">Tuyển dụng</option><option value="project">Dự án</option><option value="system">Hệ thống</option><option value="community">Cộng đồng</option></select></label></div>
    {message && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{message}</p>}
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {error && <p role="alert" className="p-6 text-sm text-red-600">{error}<button type="button" onClick={() => setAttempt(value => value + 1)} className="ml-2 underline">Thử lại</button></p>}
      {loading ? <p role="status" className="flex items-center justify-center gap-2 p-10 text-slate-500"><RefreshCw size={18} className="animate-spin" />Đang tải thông báo…</p> : !error && <>{data?.items.map(item => <NotificationRow key={item.id} item={item} onOpen={item => void open(item)} disabled={opening} />)}{!data?.items.length && <div className="p-12 text-center text-slate-500"><Bell size={30} className="mx-auto mb-3 text-blue-300" /><p>Chưa có thông báo trong mục này.</p></div>}</>}
    </div>
    <div className="flex items-center justify-between text-sm text-slate-500"><p>{data?.total ?? 0} thông báo · Trang {page}</p><div className="flex gap-2"><button type="button" disabled={loading || page === 1} onClick={() => setPage(value => value - 1)} className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40">Trước</button><button type="button" disabled={loading || !data || page * data.pageSize >= data.total} onClick={() => setPage(value => value + 1)} className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40">Sau</button></div></div>
  </div>;
}
