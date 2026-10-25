import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Megaphone, RefreshCw, Send, X } from 'lucide-react';
import { useNotifications } from '../../context/notifications-context';
import { notificationsService } from '../../services/notifications.service';
import { getApiErrorMessage } from '../../services/api';
import type { BroadcastInput, NotificationBroadcast } from '../../types/notifications';
import { notificationDate } from '../../utils/notification-targets';

const labels: Record<NotificationBroadcast['status'], string> = { Draft: 'Bản nháp', Queued: 'Đang chờ gửi', Processing: 'Đang xử lý', Completed: 'Hoàn tất', Cancelled: 'Đã hủy', Failed: 'Gửi thất bại' };
const roles = [{ value: 'Student', label: 'Sinh viên' }, { value: 'Partner', label: 'Đối tác' }, { value: 'Admin', label: 'Quản trị viên' }, { value: 'Moderator', label: 'Kiểm duyệt viên' }, { value: 'Verificator', label: 'Xác minh viên' }] as const;
const inputClass = 'min-w-0 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-blue-500';

export function NotificationBroadcastsPage() {
  const { canManage } = useNotifications();
  const [history, setHistory] = useState<NotificationBroadcast[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<BroadcastInput['audience']>('All');
  const [role, setRole] = useState<NonNullable<BroadcastInput['role']>>('Student');
  const [selected, setSelected] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [preview, setPreview] = useState<{ draft: NotificationBroadcast; recipientCount: number } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => { if (preview) previewRef.current?.focus(); }, [preview]);

  useEffect(() => {
    if (!canManage) return;
    const controller = new AbortController();
    const load = async () => {
      try { const rows = await notificationsService.broadcasts(controller.signal); if (!controller.signal.aborted) { setHistory(rows); setError(''); } }
      catch (cause) { if (!controller.signal.aborted) setError(getApiErrorMessage(cause)); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load(); const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 10000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [canManage, attempt]);

  const createPreview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setNotice(''); setPreview(null);
    const recipientAccountIds = [...new Set(selected.split(/[\s,;]+/).filter(Boolean))];
    if (audience === 'Selected' && (!recipientAccountIds.length || recipientAccountIds.some(id => !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id)))) { setError('Nhập ID tài khoản hợp lệ, cách nhau bằng dấu phẩy hoặc xuống dòng.'); return; }
    if (targetUrl && (!targetUrl.startsWith('/') || targetUrl.startsWith('//') || targetUrl.includes('\\') || [...targetUrl].some(char => char.charCodeAt(0) < 32))) { setError('Đường dẫn phải là đường dẫn nội bộ bắt đầu bằng một dấu /.'); return; }
    if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) { setError('Thời gian hết hạn phải ở tương lai.'); return; }
    setBusy(true);
    try {
      const input: BroadcastInput = { title: title.trim(), message: message.trim(), audience, ...(audience === 'Role' ? { role } : {}), ...(audience === 'Selected' ? { recipientAccountIds } : {}), ...(targetUrl ? { targetUrl: targetUrl.trim() } : {}), ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}) };
      const draft = await notificationsService.create(input);
      const count = await notificationsService.preview(draft.id);
      setPreview({ draft, recipientCount: count.recipientCount }); setAttempt(value => value + 1);
    } catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); }
  };
  const publish = async () => {
    if (!preview || busy) return;
    setBusy(true); setError('');
    try { await notificationsService.publish(preview.draft.id); setPreview(null); setNotice('Đã đưa đợt thông báo vào hàng đợi. Theo dõi tiến độ bên dưới.'); setAttempt(value => value + 1); }
    catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); }
  };
  const reopenPreview = async (draft: NotificationBroadcast) => {
    if (busy) return;
    setBusy(true); setError(''); setNotice(''); setPreview(null);
    try {
      const count = await notificationsService.preview(draft.id);
      setPreview({ draft, recipientCount: count.recipientCount });
    } catch (cause) { setError(getApiErrorMessage(cause)); }
    finally { setBusy(false); }
  };
  const cancel = async (id: string) => {
    setBusy(true); setError('');
    try { await notificationsService.cancel(id); if (preview?.draft.id === id) setPreview(null); setNotice('Đã hủy phần chưa gửi của đợt thông báo. Các thông báo đã gửi vẫn được giữ lại.'); setAttempt(value => value + 1); }
    catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); }
  };
  if (!canManage) return <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Bạn chưa được cấp quyền quản lý thông báo hoặc quyền đang được kiểm tra.</p>;
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-slate-900">Thông báo hệ thống</h1><p className="mt-1 text-sm text-slate-500">Soạn nội dung, kiểm tra người nhận và phát hành thông báo hàng loạt.</p></div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button type="button" onClick={() => setAttempt(value => value + 1)} className="ml-2 underline">Tải lại</button></div>}
    {notice && <p role="status" className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">{notice}</p>}
    <form onSubmit={event => void createPreview(event)} onChange={() => setPreview(null)} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><Megaphone size={20} className="text-blue-600" />Tạo thông báo mới</h2>
      <label className="block space-y-2 text-sm font-medium text-slate-700"><span>Tiêu đề</span><input required maxLength={200} value={title} onChange={event => setTitle(event.target.value)} className={inputClass} /></label>
      <label className="block space-y-2 text-sm font-medium text-slate-700"><span>Nội dung</span><textarea required maxLength={2000} rows={4} value={message} onChange={event => setMessage(event.target.value)} className={inputClass} /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-2 text-sm font-medium text-slate-700"><span>Đối tượng nhận</span><select value={audience} onChange={event => setAudience(event.target.value as BroadcastInput['audience'])} className={inputClass}><option value="All">Tất cả tài khoản</option><option value="Role">Theo vai trò</option><option value="Selected">Tài khoản được chọn</option></select></label>
      {audience === 'Role' && <label className="block space-y-2 text-sm font-medium text-slate-700"><span>Vai trò</span><select value={role} onChange={event => setRole(event.target.value as NonNullable<BroadcastInput['role']>)} className={inputClass}>{roles.map(item => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>}</div>
      {audience === 'Selected' && <label className="block space-y-2 text-sm font-medium text-slate-700"><span>ID tài khoản nhận</span><textarea value={selected} onChange={event => setSelected(event.target.value)} required rows={3} placeholder="Mỗi dòng một ID tài khoản" className={inputClass} /><span className="block text-xs font-normal text-slate-500">Dùng ID tài khoản, không dùng ID hồ sơ. Các ID trùng chỉ được nhận một lần.</span></label>}
      <div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-2 text-sm font-medium text-slate-700"><span>Đường dẫn nội bộ (tùy chọn)</span><input value={targetUrl} onChange={event => setTargetUrl(event.target.value)} maxLength={500} placeholder="/notifications" className={inputClass} /></label><label className="block space-y-2 text-sm font-medium text-slate-700"><span>Hết hạn (tùy chọn)</span><input type="datetime-local" value={expiresAt} onChange={event => setExpiresAt(event.target.value)} className={inputClass} /></label></div>
      <button type="submit" disabled={busy || !title.trim() || !message.trim()} className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 disabled:opacity-40">{busy ? 'Đang xử lý…' : 'Lưu bản nháp và xem trước'}</button>
      {preview && <div ref={previewRef} tabIndex={-1} role="region" aria-label="Xem trước thông báo" className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4"><p className="text-sm font-semibold text-blue-800">Dự kiến gửi đến {preview.recipientCount} tài khoản</p><p className="font-semibold text-slate-900">{preview.draft.title}</p><p className="whitespace-pre-wrap break-words text-sm text-slate-600">{preview.draft.message}</p>{preview.draft.processedCount > 0 && <p className="text-sm text-blue-800">Đã gửi {preview.draft.processedCount} tài khoản; lần thử lại chỉ tiếp tục phần chưa nhận.</p>}<button type="button" disabled={busy || !preview.recipientCount} onClick={() => void publish()} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"><Send size={16} />Xác nhận phát hành</button></div>}
    </form>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 p-5"><h2 className="font-bold text-slate-900">Lịch sử phát hành</h2><button type="button" aria-label="Làm mới lịch sử" onClick={() => setAttempt(value => value + 1)} className="p-2 text-blue-600"><RefreshCw size={17} /></button></div>
      {loading && <p role="status" className="p-6 text-sm text-slate-500">Đang tải lịch sử…</p>}
      {!loading && !history.length && !error && <p className="p-8 text-center text-sm text-slate-500">Chưa có đợt thông báo nào.</p>}
      {history.map(item => <article key={item.id} className="space-y-2 border-b border-slate-100 p-5 last:border-0"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-slate-900">{item.title}</h3><span className={`rounded-full px-3 py-1 text-xs font-medium ${item.status === 'Failed' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>{labels[item.status] ?? item.status}</span></div><p className="whitespace-pre-wrap break-words text-sm text-slate-600">{item.message}</p><p className="text-xs text-slate-500">{notificationDate(item.createdAt)} · {item.audience === 'All' ? 'Tất cả tài khoản' : item.audience === 'Role' ? roles.find(role => role.value === item.role)?.label : 'Tài khoản được chọn'} · Đã gửi {item.processedCount}/{item.recipientCount}</p>{item.lastError && <p className="text-sm text-red-600">{item.lastError}</p>}<div className="flex flex-wrap gap-2">{['Draft', 'Failed'].includes(item.status) && <button type="button" disabled={busy} onClick={() => void reopenPreview(item)} className="flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 disabled:opacity-40"><Send size={14} />{item.status === 'Failed' ? 'Xem trước và thử gửi lại' : 'Xem trước bản nháp'}</button>}{['Draft', 'Queued', 'Processing'].includes(item.status) && <button type="button" disabled={busy} onClick={() => void cancel(item.id)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40"><X size={14} />Hủy phần chưa gửi</button>}</div></article>)}
    </section>
  </div>;
}
