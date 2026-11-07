import { Bell, BriefcaseBusiness, CheckCheck, CreditCard, Gift, Heart, Megaphone, MessageCircle, ShieldCheck, Users } from 'lucide-react';
import type { NotificationItem } from '../../types/notifications';
import { notificationRelativeTime } from '../../utils/notification-targets';

function visual(item: NotificationItem) {
  const type = item.type.toLowerCase(), category = item.category.toLowerCase();
  if (type.includes('liked')) return { Icon: Heart, color: 'text-rose-600 bg-rose-50' };
  if (type.includes('comment') || type.includes('replied')) return { Icon: MessageCircle, color: 'text-slate-600 bg-slate-100' };
  if (type.includes('promotion') || type.includes('offer')) return { Icon: Gift, color: 'text-violet-600 bg-violet-100' };
  if (type.includes('payment')) return { Icon: CreditCard, color: 'text-blue-600 bg-blue-100/70' };
  if (category === 'verification') return { Icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-100/70' };
  if (category === 'project' || category === 'recruitment') return { Icon: BriefcaseBusiness, color: 'text-blue-600 bg-blue-100/70' };
  if (category === 'system') return { Icon: Megaphone, color: 'text-orange-600 bg-orange-100/70' };
  if (category === 'community') return { Icon: Users, color: 'text-violet-600 bg-violet-100/70' };
  return { Icon: Bell, color: 'text-slate-600 bg-slate-100' };
}

export function NotificationRow({ item, onOpen, disabled = false }: { item: NotificationItem; onOpen: (item: NotificationItem) => void; disabled?: boolean }) {
  const { Icon, color } = visual(item), unread = !item.readAt;
  return <button type="button" data-testid={`notification-${item.id}`} aria-label={`${unread ? 'Chưa đọc' : 'Đã đọc'}: ${item.title}. ${item.message}`} disabled={disabled} onClick={() => onOpen(item)} className={`mb-1.5 flex min-h-[68px] w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors hover:bg-blue-100/70 focus-visible:outline-blue-600 disabled:opacity-50 sm:gap-4 ${unread ? 'border-transparent bg-[#EAF3FF]' : 'border-slate-100 bg-white/80'}`}>
    <span aria-hidden="true" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}><Icon size={24} strokeWidth={1.8} /></span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-bold leading-[18px] text-[#10284B]">{item.title}</span>
      <span className="block whitespace-pre-wrap break-words text-[13px] leading-[18px] text-[#10284B]">{item.message}</span>
      <time dateTime={item.createdAt} className="block text-xs leading-4 text-slate-500">{notificationRelativeTime(item.createdAt)}</time>
    </span>
    <span className="flex w-5 shrink-0 justify-center sm:mr-2">{unread ? <span data-testid={`notification-unread-${item.id}`} className="h-2.5 w-2.5 rounded-full bg-blue-600" aria-label="Chưa đọc" /> : <CheckCheck aria-hidden="true" size={19} className="text-slate-500" />}</span>
  </button>;
}
