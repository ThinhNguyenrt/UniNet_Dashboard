import { useState, type FormEvent } from 'react';
import { adminManagementService } from '../../services/admin-management.service';
import { getApiErrorMessage } from '../../services/api';
import type { AdminUser } from '../../types/admin-management';
import { managementButton, managementInput } from '../../utils/management';
import { ManagementDialog, ManagementError } from './ManagementUI';

export function AccountStatusDialog({ user, onClose, onDone }: { user: AdminUser; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const locked = user.status === 1;
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (busy || !reason.trim()) return;
    setBusy(true); setError('');
    try { await adminManagementService.changeStatus(user.id, locked, reason.trim()); onDone(); }
    catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); }
  };
  return <ManagementDialog title={locked ? 'Khóa tài khoản' : 'Mở khóa tài khoản'} onClose={() => { if (!busy) onClose(); }}><form onSubmit={event => void submit(event)} className="space-y-4"><p className="break-words text-sm text-slate-600">Xác nhận {locked ? 'khóa' : 'mở khóa'} tài khoản <strong>{user.email}</strong>. {locked && 'Các phiên đăng nhập hiện tại sẽ bị vô hiệu hóa.'}</p>{error && <ManagementError message={error} />}<label className="block space-y-2 text-sm"><span>Lý do</span><textarea required maxLength={2000} value={reason} onChange={event => setReason(event.target.value)} rows={4} className={managementInput} /></label><div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className={managementButton}>Hủy</button><button disabled={busy || !reason.trim()} className={managementButton + ' bg-blue-50'}>{busy ? 'Đang xử lý…' : 'Xác nhận'}</button></div></form></ManagementDialog>;
}
