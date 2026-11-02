import { moneyText as money, refundableVnd } from '../../utils/finance-money';
import { useCallback, useState, type FormEvent } from 'react';
import { financeService, type Payment, type Refund, type Withdrawal } from '../../services/finance.service';
import { getApiErrorMessage } from '../../services/api';
import { useAdminResource, useDebouncedSearch } from '../../hooks/useAdminResource';
import { ManagementDialog, ManagementError } from './ManagementUI';
import { managementButton, managementInput } from '../../utils/management';

export type FinanceAction =
  | { kind: 'credit' }
  | { kind: 'refund-create'; row: Payment }
  | { kind: 'withdrawal-review'; row: Withdrawal; approve: boolean }
  | { kind: 'refund-review'; row: Refund; approve: boolean }
  | { kind: 'order'; row: Withdrawal }
  | { kind: 'withdrawal-confirm'; row: Withdrawal }
  | { kind: 'refund-confirm'; row: Refund };

export function FinanceActionDialog({
  action,
  onClose,
  onDone,
}: {
  action: FinanceAction;
  onClose: () => void;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [paying, setPaying] = useState('');
  const [accountId, setAccountId] = useState('');

  // Giữ requestKey nguyên vẹn khi retry
  const [key] = useState(() => crypto.randomUUID());
  const [submitted, setSubmitted] = useState<object | null>(null);

  const confirming = action.kind === 'withdrawal-confirm' || action.kind === 'refund-confirm';
  const review = action.kind === 'withdrawal-review' || action.kind === 'refund-review';

  const title =
    action.kind === 'credit'
      ? 'Ghi nhận thu nhập vào ví'
      : action.kind === 'refund-create'
      ? 'Tạo yêu cầu hoàn tiền'
      : action.kind === 'order'
      ? 'Lập lệnh chi rút tiền'
      : confirming
      ? 'Xác nhận kết quả chuyển khoản'
      : review && action.approve
      ? 'Duyệt yêu cầu'
      : 'Từ chối yêu cầu';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError('');

    // Kiểm tra tiền điều kiện client
    if (action.kind === 'credit') {
      const normRef = reference.trim().toUpperCase();
      if (!normRef) {
        setError('Vui lòng nhập mã chứng từ thu nhập.');
        return;
      }
      if (normRef.startsWith('WITHDRAWAL:')) {
        setError('Mã chứng từ thu nhập không được bắt đầu bằng "WITHDRAWAL:".');
        return;
      }
      if (!accountId) {
        setError('Vui lòng chọn tài khoản nhận thu nhập.');
        return;
      }
    }

    if (review && !reason.trim()) {
      setError('Lý do xem xét yêu cầu là bắt buộc.');
      return;
    }

    if (confirming) {
      if (!paying.trim() || !reference.trim()) {
        setError('Vui lòng điền đầy đủ tài khoản chi và mã giao dịch ngân hàng.');
        return;
      }
    }

    setBusy(true);
    try {
      let path: string;
      let data: object;

      if (action.kind === 'credit') {
        path = 'wallet/credits';
        data = {
          accountId,
          amount: amount.trim(),
          reason: reason.trim(),
          sourceReference: reference.trim().toUpperCase(),
        };
      } else if (action.kind === 'refund-create') {
        path = 'refunds';
        data = {
          requestKey: key,
          transactionId: action.row.id,
          amount: amount.trim(),
          reason: reason.trim(),
        };
      } else if (action.kind === 'order') {
        path = `withdrawals/${action.row.id}/order`;
        data = {};
      } else if (action.kind === 'withdrawal-review' || action.kind === 'refund-review') {
        path = `${action.kind === 'refund-review' ? 'refunds' : 'withdrawals'}/${action.row.id}/review`;
        data = { approve: action.approve, reason: reason.trim() };
      } else {
        path = `${action.kind === 'refund-confirm' ? 'refunds' : 'withdrawals'}/${action.row.id}/confirm`;
        data = {
          payingAccount: paying.trim().toUpperCase(),
          bankReference: reference.trim().toUpperCase(),
        };
      }

      if (!submitted) setSubmitted(data);
      await financeService.mutate(path, submitted || data);
      onDone();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const locked = busy || submitted !== null;

  return (
    <ManagementDialog
      title={title}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        {'row' in action && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Số tiền:</span>
              <span className="text-base font-bold text-slate-900">{money(action.row.amount)}</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 break-all">
              <span className="font-semibold text-slate-600">Mã: </span>
              <span className="font-mono">{action.row.id}</span>
            </div>
            {'bankAccountNumber' in action.row && (
              <div className="mt-2 pt-2 border-t border-slate-200/60 text-xs text-slate-600 space-y-0.5">
                <p>
                  <span className="text-slate-500">Chủ tài khoản: </span>
                  <span className="font-semibold text-slate-800">{action.row.bankAccountHolder}</span>
                </p>
                <p>
                  <span className="text-slate-500">Ngân hàng: </span>
                  {action.row.bankName} - <span className="font-mono">{action.row.bankAccountNumber}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {error && <ManagementError message={error} />}

        {action.kind === 'credit' && (
          <>
            <RecipientSelect disabled={locked} value={accountId} onChange={setAccountId} />
            <p className="text-xs text-slate-500">
              Chỉ ghi nhận khoản thu nhập đã có chứng từ thẩm định. Khoản thanh toán mua dịch vụ không phải thu nhập ví.
            </p>
          </>
        )}

        {(action.kind === 'credit' || action.kind === 'refund-create') && (
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Số tiền (VND)</span>
            <input
              className={managementInput}
              type="number"
              required
              min={1}
              step={1}
              max={
                action.kind === 'refund-create'
                  ? refundableVnd(action.row.amount, action.row.reservedRefund)
                  : '999999999999999999'
              }
              value={amount}
              disabled={locked}
              placeholder="VD: 500000"
              onChange={(e) => setAmount(e.target.value)}
            />
            {action.kind === 'refund-create' && (
              <span className="text-xs text-slate-500">
                Tối đa có thể hoàn: {money(refundableVnd(action.row.amount, action.row.reservedRefund))}
              </span>
            )}
          </label>
        )}

        {(review || action.kind === 'credit' || action.kind === 'refund-create') && (
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">
              {review ? 'Lý do xem xét yêu cầu' : 'Lý do / nội dung chứng từ'}
            </span>
            <textarea
              className={managementInput + ' min-h-[80px]'}
              required
              maxLength={2000}
              value={reason}
              disabled={locked}
              placeholder={review ? 'Nhập lý do duyệt hoặc từ chối...' : 'Nhập nội dung chứng từ chi tiết...'}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
        )}

        {confirming && (
          <>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 leading-relaxed">
              <strong>Lưu ý quan trọng:</strong> Chỉ xác nhận sau khi kế toán đã thực hiện chuyển khoản ngoài ngân hàng thành công. Thao tác này sẽ ghi nhận tiền đã chi/hoàn và cập nhật trạng thái hoàn tất.
            </div>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Ngân hàng và số tài khoản chi</span>
              <input
                className={managementInput}
                required
                maxLength={150}
                value={paying}
                disabled={locked}
                placeholder="VD: VCB 0123456789"
                onChange={(e) => setPaying(e.target.value)}
              />
            </label>
          </>
        )}

        {(confirming || action.kind === 'credit') && (
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">
              {confirming ? 'Mã giao dịch ngân hàng (FT/Trace ID)' : 'Mã chứng từ thu nhập (duy nhất)'}
            </span>
            <input
              className={managementInput}
              required
              maxLength={150}
              value={reference}
              disabled={locked}
              placeholder={confirming ? 'VD: FT260102001' : 'VD: INCOME-2026-001'}
              onChange={(e) => setReference(e.target.value)}
            />
          </label>
        )}

        {action.kind === 'order' && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-xs text-blue-900 leading-relaxed">
            Hệ thống sẽ tạo lệnh chi cho yêu cầu rút tiền này. Tiền vẫn tiếp tục được giữ (reserved) trong ví cho đến khi kế toán xác nhận kết quả chuyển khoản thành công.
          </div>
        )}

        {action.kind === 'refund-create' && (
          <p className="text-xs text-slate-500">
            Yêu cầu hoàn tiền sau khi tạo sẽ ở trạng thái chờ duyệt. Cần một nhân viên khác có thẩm quyền xem xét duyệt trước khi xác nhận hoàn tiền.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            className={managementButton}
            disabled={busy}
            onClick={onClose}
          >
            Đóng
          </button>
          <button
            type="submit"
            className={managementButton + ' !bg-blue-600 !text-white hover:!bg-blue-700'}
            disabled={busy || (action.kind === 'credit' && !accountId)}
          >
            {busy ? 'Đang ghi nhận…' : submitted ? 'Thử lại cùng yêu cầu' : title}
          </button>
        </div>
      </form>
    </ManagementDialog>
  );
}

function RecipientSelect({
  disabled,
  value,
  onChange,
}: {
  disabled: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  const [search, setSearch] = useState('');
  const debounced = useDebouncedSearch(search);
  const load = useCallback(
    (signal: AbortSignal) => financeService.recipients(debounced, signal),
    [debounced]
  );
  const resource = useAdminResource(load);

  return (
    <div className="space-y-2 text-sm">
      <label className="block space-y-1">
        <span className="font-medium text-slate-700">Tìm tài khoản nhận thu nhập (Assessor)</span>
        <input
          className={managementInput}
          placeholder="Nhập email hoặc tên (tối thiểu 3 ký tự)..."
          value={search}
          disabled={disabled}
          maxLength={255}
          onChange={(e) => {
            setSearch(e.target.value);
            onChange('');
          }}
        />
      </label>
      {resource.error && <ManagementError message={resource.error} />}
      <label className="block space-y-1">
        <span className="font-medium text-slate-700">Tài khoản được ghi có</span>
        <select
          className={managementInput}
          value={value}
          required
          disabled={disabled || resource.loading}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">-- Chọn tài khoản Assessor --</option>
          {resource.data?.map((r) => (
            <option key={r.accountId} value={r.accountId}>
              {r.fullName} ({r.email})
            </option>
          ))}
        </select>
      </label>
      {debounced.length >= 3 && !resource.loading && resource.data?.length === 0 && (
        <p className="text-xs text-slate-500">Không tìm thấy tài khoản Assessor phù hợp.</p>
      )}
    </div>
  );
}
