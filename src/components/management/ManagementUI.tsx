import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useAdminManagement } from '../../context/admin-management-context';
import { verificationStatusLabels } from '../../types/admin-management';
import { managementButton, safeManagementImage } from '../../utils/management';

export function ManagementSkeleton() { return <div role="status" aria-label="Đang tải dữ liệu" className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">{[0, 1, 2, 3].map(row => <div key={row} className="h-14 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none" />)}</div>; }
export function ManagementError({ message, retry }: { message: string; retry?: () => void }) { return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message}{retry && <button onClick={retry} className="ml-3 underline">Thử lại</button>}</div>; }
export function ManagementConnectionNotice() {
  const access = useAdminManagement();
  if (!access.error) return null;
  return <div role="alert" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
    <p className="font-semibold">Chưa tải được quyền quản lý tài khoản và xác minh</p>
    <p className="mt-1">{access.error}</p>
    <p className="mt-1">Dữ liệu và thao tác quản lý chỉ khả dụng sau khi tải quyền thành công.</p>
    <button type="button" onClick={access.refresh} className="mt-3 min-h-11 rounded-lg border border-amber-300 bg-white px-3 font-medium hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">Thử tải lại quyền</button>
  </div>;
}
export function ManagementAccess({ permission, children }: { permission: string; children: ReactNode }) {
  const access = useAdminManagement();
  if (access.loading) return <ManagementSkeleton />;
  if (access.error) return <ManagementError message={access.error} retry={access.refresh} />;
  if (!access.has(permission)) return <p role="alert" className="rounded-xl border bg-white p-6 text-sm text-slate-600">Bạn không có quyền truy cập chức năng này.</p>;
  return <>{children}</>;
}
export function ManagementPagination({ page, pageSize, total, disabled, onPage }: { page: number; pageSize: number; total: number; disabled: boolean; onPage: (page: number) => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500"><span>{total} kết quả · Trang {page}/{Math.max(1, Math.ceil(total / pageSize))}</span><div className="flex gap-2"><button className={managementButton} disabled={disabled || page <= 1} onClick={() => onPage(page - 1)}>Trước</button><button className={managementButton} disabled={disabled || page * pageSize >= total} onClick={() => onPage(page + 1)}>Sau</button></div></div>;
}
export function ManagementDialog({ title, children, onClose, size = 'default' }: { title: string; children: ReactNode; onClose: () => void; size?: 'default' | 'fullscreen' }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  return <dialog ref={dialog} aria-label={title} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }} className={'m-auto overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-800 shadow-xl backdrop:bg-slate-900/30 ' + (size === 'fullscreen' ? 'max-h-[96dvh] w-[96vw] max-w-none' : 'max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl')}><div className="flex items-center justify-between border-b p-5"><h2 className="text-lg font-bold">{title}</h2><button aria-label="Đóng" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X size={20} /></button></div><div className={size === 'fullscreen' ? 'p-2 sm:p-4' : 'p-5'}>{children}</div></dialog>;
}
export function ManagementStats({ items }: { items: { label: string; value: number | undefined }[] }) { return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{items.map(item => <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{item.label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{item.value ?? '—'}</p></div>)}</div>; }
export function AccountAvatar({ name, url }: { name: string; url: string | null }) { const source = safeManagementImage(url); return <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-sm font-bold text-blue-700">{name.slice(0, 1).toUpperCase()}{source && <img src={source} alt="" onError={event => { event.currentTarget.hidden = true; }} className="absolute inset-0 size-full object-cover" />}</span>; }
export function VerificationBadge({ status, verified }: { status: number | null; verified?: boolean }) {
  const value = verified === undefined ? status : verified ? 1 : status === 1 ? null : status;
  const style = value === 1 ? 'bg-emerald-50 text-emerald-700' : value === 0 ? 'bg-amber-50 text-amber-700' : value === 2 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600';
  return <span className={'inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ' + style}>{value == null ? 'Chưa xác minh' : verificationStatusLabels[value] ?? 'Không xác định'}</span>;
}
export function ManagementToast({ message, onClose }: { message: string; onClose: () => void }) { return <div role="status" className="fixed bottom-5 right-4 z-50 flex max-w-[calc(100%-2rem)] items-center gap-4 rounded-xl border border-blue-200 bg-white p-4 text-sm text-blue-800 shadow-lg"><span>{message}</span><button aria-label="Đóng thông báo kết quả" onClick={onClose}><X size={17} /></button></div>; }
