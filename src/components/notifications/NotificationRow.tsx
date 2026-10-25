import { Bell, BriefcaseBusiness, FolderKanban, ShieldCheck } from 'lucide-react';
import type { NotificationItem } from '../../types/notifications';
import { notificationDate } from '../../utils/notification-targets';

export function NotificationRow({ item, onOpen, disabled = false }: { item: NotificationItem; onOpen: (item: NotificationItem) => void; disabled?: boolean }) {
  const category = item.category.toLowerCase();
  const Icon = category === 'verification' ? ShieldCheck : category === 'recruitment' ? BriefcaseBusiness : category === 'project' ? FolderKanban : Bell;
  return <button type="button" disabled={disabled} onClick={() => onOpen(item)} className={`flex w-full gap-3 p-4 text-left border-b border-slate-100 last:border-b-0 transition hover:bg-blue-50 focus-visible:outline-blue-600 disabled:opacity-50 ${!item.readAt ? 'bg-blue-50/60' : 'bg-white'}`}>
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><Icon size={18} /></span>
    <span className="min-w-0 flex-1">
      <span className="flex items-start justify-between gap-2"><span className="text-sm font-semibold text-slate-900">{item.title}</span>{!item.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" aria-label="Chưa đọc" />}</span>
      <span className="mt-1 block text-sm text-slate-600 whitespace-pre-wrap break-words">{item.message}</span>
      <time dateTime={item.createdAt} className="mt-2 block text-xs text-slate-400">{notificationDate(item.createdAt)}</time>
    </span>
  </button>;
}
