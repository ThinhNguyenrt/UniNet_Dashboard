import { moneyText as money, refundableVnd } from '../../utils/finance-money';
import { useCallback, useState, type FormEvent } from 'react';
import { financeService, type Payment, type Refund, type Withdrawal } from '../../services/finance.service';
import { getApiErrorMessage } from '../../services/api';
import { useAdminResource, useDebouncedSearch } from '../../hooks/useAdminResource';
import { ManagementDialog, ManagementError } from './ManagementUI';
import { managementButton, managementInput } from '../../utils/management';

export type FinanceAction = { kind: 'credit' } | { kind: 'refund-create'; row: Payment } |
  { kind: 'withdrawal-review'; row: Withdrawal; approve: boolean } | { kind: 'refund-review'; row: Refund; approve: boolean } |
  { kind: 'order' | 'withdrawal-confirm'; row: Withdrawal } | { kind: 'refund-confirm'; row: Refund };

export function FinanceActionDialog({ action, onClose, onDone }: { action: FinanceAction; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [amount, setAmount] = useState(''), [reason, setReason] = useState(''), [reference, setReference] = useState(''), [paying, setPaying] = useState(''), [accountId, setAccountId] = useState('');
  // Keep the idempotency key after timeout/retry. A changed payload requires reopening the form.
  const [key] = useState(() => crypto.randomUUID()); const [submitted, setSubmitted] = useState<object | null>(null);
  const confirming = action.kind === 'withdrawal-confirm' || action.kind === 'refund-confirm';
  const review = action.kind === 'withdrawal-review' || action.kind === 'refund-review';
  const title = action.kind === 'credit' ? 'Ghi nhận thu nhập vào ví' : action.kind === 'refund-create' ? 'Tạo yêu cầu hoàn tiền' : action.kind === 'order' ? 'Lập lệnh chi rút tiền' : confirming ? 'Xác nhận kết quả chuyển khoản' : review && action.approve ? 'Duyệt yêu cầu' : 'Từ chối yêu cầu';
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    try {
      let path: string; let data: object;
      if (action.kind === 'credit') { path = 'wallet/credits'; data = { accountId, amount, reason, sourceReference: reference }; }
      else if (action.kind === 'refund-create') { path = 'refunds'; data = { requestKey: key, transactionId: action.row.id, amount, reason }; }
      else if (action.kind === 'order') { path = `withdrawals/${action.row.id}/order`; data = {}; }
      else if (action.kind === 'withdrawal-review' || action.kind === 'refund-review') { path = `${action.kind === 'refund-review' ? 'refunds' : 'withdrawals'}/${action.row.id}/review`; data = { approve: action.approve, reason }; }
      else { path = `${action.kind === 'refund-confirm' ? 'refunds' : 'withdrawals'}/${action.row.id}/confirm`; data = { payingAccount: paying, bankReference: reference }; }
      if (!submitted) setSubmitted(data);
      await financeService.mutate(path, submitted || data); onDone();
    } catch (e) { setError(getApiErrorMessage(e)); } finally { setBusy(false); }
  };
  const locked = busy || submitted !== null;
  return <ManagementDialog title={title} onClose={() => { if (!busy) onClose(); }}><form onSubmit={event => void submit(event)} className="space-y-4">
    {'row' in action && <div className="rounded-xl bg-slate-50 p-4 text-sm"><p className="font-semibold">{money(action.row.amount)}</p><p className="mt-1 break-all font-mono text-xs text-slate-500">{action.row.id}</p>{'bankAccountNumber' in action.row && <p className="mt-2">{action.row.bankName} · {action.row.bankAccountNumber}<br />{action.row.bankAccountHolder}</p>}</div>}
    {error && <ManagementError message={error} />}
    {action.kind === 'credit' && <><RecipientSelect disabled={locked} value={accountId} onChange={setAccountId} /><p className="text-xs text-slate-500">Chỉ ghi nhận khoản thu nhập đã có chứng từ. Khoản thanh toán mua dịch vụ không phải thu nhập ví.</p></>}
    {(action.kind === 'credit' || action.kind === 'refund-create') && <label className="block space-y-1 text-sm"><span>Số tiền (VND)</span><input className={managementInput} type="number" required min={1} step={1} max={action.kind === 'refund-create' ? refundableVnd(action.row.amount, action.row.reservedRefund) : '999999999999999999'} value={amount} disabled={locked} onChange={e => setAmount(e.target.value)} /></label>}
    {(review || action.kind === 'credit' || action.kind === 'refund-create') && <label className="block space-y-1 text-sm"><span>Lý do / nội dung chứng từ</span><textarea className={managementInput} required maxLength={2000} value={reason} disabled={locked} onChange={e => setReason(e.target.value)} /></label>}
    {confirming && <><p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Chỉ xác nhận sau khi ngân hàng báo chuyển khoản thành công. Thao tác này ghi nhận tiền đã trả.</p><label className="block space-y-1 text-sm"><span>Ngân hàng và số tài khoản chi</span><input className={managementInput} required maxLength={150} value={paying} disabled={locked} onChange={e => setPaying(e.target.value)} /></label></>}
    {(confirming || action.kind === 'credit') && <label className="block space-y-1 text-sm"><span>{confirming ? 'Mã giao dịch ngân hàng' : 'Mã chứng từ thu nhập (duy nhất)'}</span><input className={managementInput} required maxLength={150} value={reference} disabled={locked} onChange={e => setReference(e.target.value)} /></label>}
    {action.kind === 'order' && <p className="text-sm text-slate-600">Tạo một lệnh chi với thông tin người nhận ở trên. Tiền tiếp tục được giữ trong ví đến khi xác nhận kết quả chuyển khoản.</p>}
    {action.kind === 'refund-create' && <p className="text-xs text-slate-500">Yêu cầu cần một nhân viên khác có quyền duyệt trước khi hoàn tiền.</p>}
    <div className="flex justify-end gap-2"><button type="button" className={managementButton} disabled={busy} onClick={onClose}>Đóng</button><button className={managementButton} disabled={busy || action.kind === 'credit' && !accountId}>{busy ? 'Đang ghi nhận…' : submitted ? 'Thử lại cùng yêu cầu' : title}</button></div>
  </form></ManagementDialog>;
}
function RecipientSelect({ disabled, value, onChange }: { disabled: boolean; value: string; onChange: (value: string) => void }) {
  const [search, setSearch] = useState(''); const debounced = useDebouncedSearch(search);
  const load = useCallback((signal: AbortSignal) => financeService.recipients(debounced, signal), [debounced]); const resource = useAdminResource(load);
  return <div className="space-y-2 text-sm"><label className="block space-y-1"><span>Tìm tài khoản nhận thu nhập</span><input className={managementInput} placeholder="Email hoặc tên, ít nhất 3 ký tự" value={search} disabled={disabled} maxLength={255} onChange={e => { setSearch(e.target.value); onChange(''); }} /></label>{resource.error && <ManagementError message={resource.error} />}<label className="block space-y-1"><span>Tài khoản được ghi có</span><select className={managementInput} value={value} required disabled={disabled || resource.loading} onChange={e => onChange(e.target.value)}><option value="">Chọn tài khoản</option>{resource.data?.map(r => <option key={r.accountId} value={r.accountId}>{r.fullName} · {r.email}</option>)}</select></label>{debounced.length >= 3 && !resource.loading && resource.data?.length === 0 && <p className="text-xs text-slate-500">Không có tài khoản phù hợp.</p>}</div>;
}
