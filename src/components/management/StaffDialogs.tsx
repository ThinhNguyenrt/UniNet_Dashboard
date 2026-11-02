import { useCallback, useState, type FormEvent } from 'react';
import { useAdminResource } from '../../hooks/useAdminResource';
import { adminManagementService } from '../../services/admin-management.service';
import { getApiErrorMessage } from '../../services/api';
import { permissionLabels, roleLabels, type AdminUser } from '../../types/admin-management';
import { managementButton, managementInput } from '../../utils/management';
import { ManagementDialog, ManagementError, ManagementSkeleton } from './ManagementUI';

export function StaffPermissionsDialog({ user, onClose, onDone }: { user: AdminUser; onClose: () => void; onDone: () => void }) {
  const load = useCallback((signal: AbortSignal) => adminManagementService.permissions(user.id, signal), [user.id]);
  const resource = useAdminResource(load);
  const [draft, setDraft] = useState<Record<string, boolean>>({}), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const changes = (resource.data ?? []).filter(item => draft[item.permission] !== undefined && draft[item.permission] !== item.granted).map(item => ({ permission: item.permission, granted: draft[item.permission] }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (busy || !changes.length) return; setBusy(true); setError('');
    try { await adminManagementService.setPermissions(user.id, changes); onDone(); }
    catch (cause) { setError(getApiErrorMessage(cause)); resource.reload(); } finally { setBusy(false); }
  };
  return <ManagementDialog title={'Phân quyền: ' + user.fullName} onClose={() => { if (!busy) onClose(); }}>{resource.loading ? <ManagementSkeleton /> : resource.error ? <ManagementError message={resource.error} retry={resource.reload} /> : <form onSubmit={event => void submit(event)} className="space-y-4"><p className="text-sm text-slate-500">Quyền được kiểm tra lại tại API. Nhân viên không thể đổi vai trò hoặc tự nâng quyền.</p>{error && <ManagementError message={error} />}<div className="space-y-1">{resource.data?.filter(item => permissionWithinRole(user.role, item.permission)).map(item => {
    const adminOnly = !permissionWithinRole(user.role, item.permission);
    return <label key={item.permission} className={'flex min-h-11 items-center gap-3 rounded-lg p-2 text-sm ' + (adminOnly ? 'text-slate-400' : 'text-slate-700')}><input type="checkbox" disabled={busy || adminOnly} checked={draft[item.permission] ?? item.granted} onChange={event => setDraft(value => ({ ...value, [item.permission]: event.target.checked }))} className="size-4 accent-blue-600" /><span>{permissionLabels[item.permission] ?? item.permission}{adminOnly && ' (chỉ Admin)'}</span></label>;
  })}</div><div className="flex justify-end gap-2"><button type="button" disabled={busy} className={managementButton} onClick={onClose}>Hủy</button><button disabled={busy || !changes.length} className={managementButton}>{busy ? 'Đang lưu…' : 'Lưu phân quyền'}</button></div></form>}</ManagementDialog>;
}

export function CreateStaffDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [fullName, setFullName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [confirmPassword, setConfirmPassword] = useState(''), [role, setRole] = useState(3), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return;
    if (password !== confirmPassword) { setError('Mật khẩu xác nhận không khớp.'); return; }
    setBusy(true); setError('');
    try { await adminManagementService.createStaff({ fullName: fullName.trim(), email: email.trim(), password, confirmPassword, role }); onDone(); }
    catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); }
  };
  return <ManagementDialog title="Thêm nhân viên mới" onClose={() => { if (!busy) onClose(); }}><form onSubmit={event => void submit(event)} className="space-y-4">{error && <ManagementError message={error} />}
    <label className="block space-y-1 text-sm"><span>Họ và tên</span><input required maxLength={255} value={fullName} onChange={event => setFullName(event.target.value)} className={managementInput} /></label>
    <label className="block space-y-1 text-sm"><span>Email</span><input type="email" required maxLength={255} value={email} onChange={event => setEmail(event.target.value)} className={managementInput} /></label>
    <label className="block space-y-1 text-sm"><span>Vai trò</span><select aria-label={"Vai tr\u00f2"} value={role} onChange={event => setRole(Number(event.target.value))} className={managementInput}>{[2, 3, 4, 5].map(value => <option key={value} value={value}>{roleLabels[value]}</option>)}</select></label>
    <label className="block space-y-1 text-sm"><span>Mật khẩu</span><input aria-label="Mật khẩu" aria-describedby="staff-password-help" type="password" autoComplete="new-password" required minLength={8} maxLength={1024} value={password} onChange={event => setPassword(event.target.value)} className={managementInput} /><span id="staff-password-help" className="text-xs text-slate-500">Ít nhất 8 ký tự, có chữ và số.</span></label>
    <label className="block space-y-1 text-sm"><span>Xác nhận mật khẩu</span><input type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className={managementInput} /></label>
    <button disabled={busy} className={managementButton}>{busy ? 'Đang tạo…' : 'Tạo nhân viên'}</button>
  </form></ManagementDialog>;
}

function permissionWithinRole(role: number, permission: string) {
  if (role === 6) return true;
  if (permission.startsWith('finance.')) return role === 5;
  if (permission === 'verification.evidence.review') return role === 2;
  if (['verification.student.review', 'verification.partner.review'].includes(permission)) return role === 3;
  if (['users.view', 'users.detail'].includes(permission)) return role === 3 || role === 4;
  return role === 4 && ['project.review', 'recruitment.review', 'community.review', 'users.lock', 'users.unlock'].includes(permission);
}
