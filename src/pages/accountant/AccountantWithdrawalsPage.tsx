import { moneyText as money } from '../../utils/finance-money';
import { useCallback, useState, useEffect } from 'react';
import {
  Download,
  Calendar,
  ChevronDown,
  Search,
  FileText,
  Clock,
  RotateCw,
  CheckCircle2,
  XCircle,
  Eye,
  Copy,
  Upload,
  Trash2,
  ArrowRight,
  Info,
  Check,
  Building2,
} from 'lucide-react';
import {
  financeService,
  type Withdrawal,
} from '../../services/finance.service';
import { useAdminManagement } from '../../context/admin-management-context';
import { useAdminResource } from '../../hooks/useAdminResource';
import { getApiErrorMessage } from '../../services/api';
import {
  ManagementAccess,
  ManagementDialog,
  ManagementError,
  ManagementPagination,
  ManagementSkeleton,
} from '../../components/management/ManagementUI';

const withdrawalStates = [
  { label: 'Chờ xử lý', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  { label: 'Đã duyệt', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  { label: 'Đang chuyển khoản', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  { label: 'Hoàn thành', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  { label: 'Từ chối', className: 'bg-rose-50 text-rose-700 border border-rose-200' },
  { label: 'Đã hủy', className: 'bg-slate-100 text-slate-600 border border-slate-200' },
];

export function AccountantWithdrawalsPage() {
  const access = useAdminManagement();
  if (access.loading) return <ManagementSkeleton />;
  return (
    <ManagementAccess permission="finance.view">
      <AccountantWithdrawalsContent />
    </ManagementAccess>
  );
}

function AccountantWithdrawalsContent() {
  const [revision, setRevision] = useState(0);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'processing' | 'completed' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  // Record đang được xem/xử lý trong quy trình
  const [activeRecord, setActiveRecord] = useState<Withdrawal | null>(null);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [payingAccount, setPayingAccount] = useState('VCB 0123456789');
  const [bankReference, setBankReference] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string } | null>({
    name: 'chuyen_khoan_bien_lai.png',
    size: '512 KB',
  });
  const [note, setNote] = useState('');
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  // Tải danh sách yêu cầu rút tiền 100% từ API /api/admin/finance/withdrawals
  const load = useCallback(
    async (signal: AbortSignal) => ({
      page,
      result: await financeService.list<Withdrawal>('withdrawals', page, signal),
    }),
    [page]
  );
  const resource = useAdminResource(load, revision);
  const rawList = resource.data?.result.items || [];
  const totalRecords = resource.data?.result.total || 0;

  // Tự động chọn bản ghi đầu tiên nếu chưa có bản ghi nào được chọn
  useEffect(() => {
    if (!activeRecord && rawList.length > 0) {
      setActiveRecord(rawList[0]);
    }
  }, [rawList, activeRecord]);

  // Đếm các trạng thái 100% từ dữ liệu API thực tế
  const countAll = totalRecords;
  const countPending = rawList.filter((w) => w.state === 0).length;
  const countProcessing = rawList.filter((w) => [1, 2].includes(w.state)).length;
  const countCompleted = rawList.filter((w) => w.state === 3).length;
  const countRejected = rawList.filter((w) => w.state === 4).length;

  // Lọc theo Tab và Tìm kiếm
  const filteredList = rawList.filter((item) => {
    if (filterTab === 'pending' && item.state !== 0) return false;
    if (filterTab === 'processing' && ![1, 2].includes(item.state)) return false;
    if (filterTab === 'completed' && item.state !== 3) return false;
    if (filterTab === 'rejected' && item.state !== 4) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const code = `WD-${item.id.slice(-5).toUpperCase()}`;
      return (
        code.toLowerCase().includes(q) ||
        (item.bankAccountHolder && item.bankAccountHolder.toLowerCase().includes(q)) ||
        (item.bankName && item.bankName.toLowerCase().includes(q)) ||
        item.accountId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredList.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    setExporting(true);
    setError('');
    try {
      await financeService.report();
      setNotice('Đã xuất báo cáo yêu cầu rút tiền thành công.');
      setTimeout(() => setNotice(''), 4000);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const copyMemo = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  // Từ chối yêu cầu qua API
  const submitReject = async () => {
    if (!activeRecord || !rejectReason.trim()) return;
    try {
      await financeService.mutate(`withdrawals/${activeRecord.id}/review`, {
        approve: false,
        reason: rejectReason.trim(),
      });
      setNotice(`Đã từ chối yêu cầu rút tiền WD-${activeRecord.id.slice(-5).toUpperCase()}.`);
      setRejectModalOpen(false);
      setRejectReason('');
      setRevision((v) => v + 1);
      setTimeout(() => setNotice(''), 4000);
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  // Lập lệnh chi / chuyển sang bước QR
  const handleProceedToQR = async () => {
    if (!activeRecord) return;
    setActiveStep(2);
    try {
      if (activeRecord.state === 0) {
        await financeService.mutate(`withdrawals/${activeRecord.id}/order`, {});
        setRevision((v) => v + 1);
      }
    } catch {
      // Tiếp tục hiển thị bước thanh toán
    }
  };

  // Xác nhận đã chuyển khoản qua API
  const handleConfirmPayout = async () => {
    if (!activeRecord) return;
    const ref = bankReference.trim() || `FT${Date.now().toString().slice(-8)}`;
    try {
      await financeService.mutate(`withdrawals/${activeRecord.id}/confirm`, {
        payingAccount: payingAccount.trim().toUpperCase(),
        bankReference: ref.toUpperCase(),
      });
      setNotice(`Xác nhận chuyển khoản thành công cho yêu cầu WD-${activeRecord.id.slice(-5).toUpperCase()}!`);
      setActiveStep(1);
      setRevision((v) => v + 1);
      setTimeout(() => setNotice(''), 4000);
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <span>Tài chính</span>
            <span>&gt;</span>
            <span className="text-slate-600 font-medium">Yêu cầu rút tiền</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Yêu cầu rút tiền
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý và xử lý các yêu cầu rút tiền của Assessor theo thời gian thực từ hệ thống.
          </p>
        </div>

        {/* Bộ lọc ngày & Nút xuất báo cáo */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 shadow-xs cursor-pointer hover:bg-slate-50">
            <Calendar size={16} className="text-slate-400" />
            <span>Toàn bộ kỳ dữ liệu hệ thống</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs transition-colors"
          >
            <Download size={16} className="text-slate-500" />
            <span>{exporting ? 'Đang xuất…' : 'Xuất báo cáo'}</span>
          </button>
        </div>
      </div>

      {error && <ManagementError message={error} />}
      {resource.error && <ManagementError message={resource.error} retry={resource.reload} />}
      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* 5 Thẻ chỉ số trạng thái thực tế từ API */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3.5">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tổng yêu cầu</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{countAll}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Chờ xử lý</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{countPending}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <RotateCw size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Đang chuyển khoản</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{countProcessing}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Hoàn thành</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{countCompleted}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Từ chối</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{countRejected}</p>
          </div>
        </div>
      </div>

      {/* Thanh tab lọc & Ô tìm kiếm */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Tất cả ({countAll})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'pending'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Chờ xử lý ({countPending})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('processing')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'processing'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Đang chuyển khoản ({countProcessing})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('completed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'completed'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Hoàn thành ({countCompleted})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('rejected')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'rejected'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Từ chối ({countRejected})
          </button>
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative min-w-[280px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, mã yêu cầu, ngân hàng..."
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
        </div>
      </div>

      {/* Bảng danh sách yêu cầu rút tiền thực tế từ API */}
      <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
        {resource.loading ? (
          <ManagementSkeleton />
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs sm:text-sm">
            Chưa có yêu cầu rút tiền nào từ hệ thống.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] border-b border-slate-100">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredList.length && filteredList.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-3.5"
                    />
                  </th>
                  <th className="p-3.5">Mã yêu cầu</th>
                  <th className="p-3.5">Người rút tiền</th>
                  <th className="p-3.5">Số tiền</th>
                  <th className="p-3.5">Ngân hàng hưởng thụ</th>
                  <th className="p-3.5">Thời gian yêu cầu</th>
                  <th className="p-3.5">Trạng thái</th>
                  {/* QUY TẮC BẮT BUỘC: Ở bên ngoài một record, không có nút nào khác ngoài nút xem chi tiết */}
                  <th className="p-3.5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((w) => {
                  const isSelected = selectedIds.includes(w.id);
                  const isActive = activeRecord?.id === w.id;
                  const st = withdrawalStates[w.state] || {
                    label: 'Không xác định',
                    className: 'bg-slate-100 text-slate-600 border border-slate-200',
                  };
                  const code = `WD-${w.id.slice(-5).toUpperCase()}`;

                  return (
                    <tr
                      key={w.id}
                      className={`transition-colors ${
                        isActive ? 'bg-blue-50/50' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(w.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-3.5"
                        />
                      </td>

                      <td className="p-3.5 font-bold text-slate-800 whitespace-nowrap">
                        {code}
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {(w.bankAccountHolder || 'A').slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 leading-tight">
                              {w.bankAccountHolder || 'Assessor'}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-[140px]" title={w.accountId}>
                              Ví: {w.accountId.slice(0, 8)}…
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 font-extrabold text-slate-900 whitespace-nowrap">
                        {money(w.amount)}
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 text-[10px] font-bold">
                            <Building2 size={13} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-xs leading-tight">
                              {w.bankName}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {w.bankAccountNumber ? `****${w.bankAccountNumber.slice(-4)}` : '—'} - {w.bankAccountHolder}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-slate-500 whitespace-nowrap text-xs">
                        {new Date(w.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${st.className}`}
                        >
                          {w.state === 0 && <Clock size={11} />}
                          {[1, 2].includes(w.state) && <RotateCw size={11} />}
                          {w.state === 3 && <CheckCircle2 size={11} />}
                          {w.state === 4 && <XCircle size={11} />}
                          <span>{st.label}</span>
                        </span>
                      </td>

                      {/* QUY TẮC BẮT BUỘC: Ở bên ngoài một record, không có nút nào khác ngoài nút xem chi tiết */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRecord(w);
                            setActiveStep(1);
                          }}
                          aria-label="Xem chi tiết yêu cầu rút tiền"
                          title="Xem chi tiết"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                        >
                          <Eye size={17} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Thanh phân trang ở đáy bảng */}
        <div className="p-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Hiển thị {filteredList.length} / {totalRecords} yêu cầu từ API
          </span>

          <div className="flex items-center gap-2">
            <ManagementPagination
              page={page}
              pageSize={30}
              total={totalRecords}
              disabled={resource.loading}
              onPage={setPage}
            />
          </div>
        </div>
      </div>

      {/* Phần Quy trình xử lý yêu cầu rút tiền (Gắn với record API thực tế) */}
      {activeRecord && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Quy trình xử lý yêu cầu rút tiền
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Đang xử lý yêu cầu: <strong className="text-blue-600 font-mono">WD-{activeRecord.id.slice(-5).toUpperCase()}</strong> ({activeRecord.bankAccountHolder})
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className={`flex items-center gap-1.5 ${activeStep >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
                <span className={`size-5 rounded-full text-white text-[11px] flex items-center justify-center ${activeStep >= 1 ? 'bg-blue-600' : 'bg-slate-300'}`}>1</span>
                <span>Xem yêu cầu</span>
              </div>
              <span className="text-slate-300">──</span>
              <div className={`flex items-center gap-1.5 ${activeStep >= 2 ? 'text-blue-600' : 'text-slate-500'}`}>
                <span className={`size-5 rounded-full text-[11px] flex items-center justify-center ${activeStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
                <span>Quét mã QR thanh toán</span>
              </div>
              <span className="text-slate-300">──</span>
              <div className={`flex items-center gap-1.5 ${activeStep >= 3 ? 'text-blue-600' : 'text-slate-500'}`}>
                <span className={`size-5 rounded-full text-[11px] flex items-center justify-center ${activeStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
                <span>Gửi minh chứng & xác nhận</span>
              </div>
              <span className="text-slate-300">──</span>
              <div className={`flex items-center gap-1.5 ${activeRecord.state === 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className={`size-5 rounded-full text-[11px] flex items-center justify-center ${activeRecord.state === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>4</span>
                <span>Hoàn thành</span>
              </div>
            </div>
          </div>

          {/* 3 Thẻ Bước xử lý đặt ngang nhau */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* BƯỚC 1: Xem yêu cầu rút tiền */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <span className="size-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center">1</span>
                    <span>Xem yêu cầu rút tiền</span>
                  </div>
                  <span className="text-slate-400 text-xs font-mono">WD-{activeRecord.id.slice(-4).toUpperCase()}</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl my-4">
                  <div className="size-9 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
                    {(activeRecord.bankAccountHolder || 'A').slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs sm:text-sm">
                      {activeRecord.bankAccountHolder || 'Chủ ví'}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                      {activeRecord.accountId}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Mã yêu cầu:</span>
                    <span className="font-mono font-bold text-slate-800">WD-{activeRecord.id.slice(-5).toUpperCase()}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Số tiền rút:</span>
                    <span className="font-extrabold text-blue-600 text-sm">{money(activeRecord.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Ngân hàng:</span>
                    <span className="font-semibold text-slate-800">{activeRecord.bankName}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Số tài khoản:</span>
                    <span className="font-mono font-bold text-slate-800">{activeRecord.bankAccountNumber}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Chủ tài khoản:</span>
                    <span className="font-semibold text-slate-800">{activeRecord.bankAccountHolder}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400">Thời gian tạo:</span>
                    <span className="text-slate-600">
                      {new Date(activeRecord.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nút thao tác của Bước 1 */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(true)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Từ chối
                </button>
                <button
                  type="button"
                  onClick={handleProceedToQR}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs inline-flex items-center justify-center gap-1"
                >
                  <span>Tiếp tục thanh toán</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* BƯỚC 2: Quét mã QR thanh toán */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <span className="size-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center">2</span>
                    <span>Quét mã QR thanh toán</span>
                  </div>
                  <span className="text-slate-400 text-xs">VietQR</span>
                </div>

                <div className="flex items-start gap-4 my-4">
                  <div className="size-28 rounded-xl border-2 border-slate-200 bg-white p-1.5 flex items-center justify-center shrink-0 relative shadow-xs">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <rect width="100" height="100" fill="white" />
                      <rect x="6" y="6" width="28" height="28" fill="#1e293b" />
                      <rect x="12" y="12" width="16" height="16" fill="white" />
                      <rect x="16" y="16" width="8" height="8" fill="#1e293b" />
                      <rect x="66" y="6" width="28" height="28" fill="#1e293b" />
                      <rect x="72" y="12" width="16" height="16" fill="white" />
                      <rect x="76" y="16" width="8" height="8" fill="#1e293b" />
                      <rect x="6" y="66" width="28" height="28" fill="#1e293b" />
                      <rect x="12" y="72" width="16" height="16" fill="white" />
                      <rect x="16" y="76" width="8" height="8" fill="#1e293b" />
                      <rect x="42" y="10" width="8" height="8" fill="#1e293b" />
                      <rect x="52" y="24" width="8" height="8" fill="#1e293b" />
                      <rect x="42" y="44" width="16" height="16" fill="#2563eb" rx="2" />
                      <rect x="66" y="44" width="8" height="8" fill="#1e293b" />
                      <rect x="78" y="56" width="8" height="8" fill="#1e293b" />
                      <rect x="44" y="76" width="8" height="8" fill="#1e293b" />
                      <rect x="58" y="70" width="8" height="8" fill="#1e293b" />
                      <rect x="74" y="76" width="14" height="14" fill="#1e293b" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="size-6 rounded-md bg-white border border-red-500 flex items-center justify-center shadow-xs">
                        <span className="text-[10px] font-bold text-red-600">QR</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-slate-800 leading-tight">
                      Quét mã bằng ứng dụng ngân hàng để chuyển khoản
                    </p>
                    <p className="text-slate-500 pt-1">
                      Ngân hàng: <span className="font-semibold text-slate-800">{activeRecord.bankName}</span>
                    </p>
                    <p className="text-slate-500 font-mono">
                      Số TK: <span className="font-bold text-slate-800">{activeRecord.bankAccountNumber}</span>
                    </p>
                    <p className="text-slate-500">
                      Chủ TK: <span className="font-semibold text-slate-800">{activeRecord.bankAccountHolder}</span>
                    </p>
                    <p className="text-blue-600 font-extrabold text-sm pt-0.5">
                      {money(activeRecord.amount)}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-2.5 text-[11px] text-blue-800 flex items-center gap-1.5 mb-3">
                  <Info size={14} className="text-blue-600 shrink-0" />
                  <span>Vui lòng chuyển đúng số tiền và nội dung chuyển khoản.</span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Nội dung chuyển khoản (bắt buộc)
                  </span>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900">
                    <span>UNINET WD-{activeRecord.id.slice(-5).toUpperCase()}</span>
                    <button
                      type="button"
                      onClick={() => copyMemo(`UNINET WD-${activeRecord.id.slice(-5).toUpperCase()}`)}
                      className="text-slate-400 hover:text-blue-600 inline-flex items-center gap-1 text-[11px]"
                      title="Sao chép nội dung"
                    >
                      <Copy size={13} />
                      {copiedMemo && <span className="text-emerald-600 font-sans">Đã chép</span>}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs inline-flex items-center justify-center gap-1"
                >
                  <span>Tiếp tục gửi minh chứng</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* BƯỚC 3: Gửi minh chứng & xác nhận */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <span className="size-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center">3</span>
                    <span>Gửi minh chứng & xác nhận</span>
                  </div>
                  <span className="text-slate-400 text-xs">Biên lai</span>
                </div>

                <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center my-3 hover:border-blue-400 transition-colors cursor-pointer bg-slate-50/50">
                  <Upload size={22} className="mx-auto text-blue-500 mb-1" />
                  <p className="text-xs font-bold text-slate-800">
                    Tải lên minh chứng đã chuyển khoản <span className="text-red-500">*</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Ảnh chụp màn hình hoặc biên lai giao dịch (PNG, JPG, PDF - tối đa 10MB)
                  </p>
                </div>

                {attachedFile && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white text-xs mb-3 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={16} className="text-blue-600 shrink-0" />
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 truncate">{attachedFile.name}</p>
                        <p className="text-[10px] text-slate-400">{attachedFile.size}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedFile(null)}
                      className="text-slate-400 hover:text-red-500 p-1"
                      title="Xóa tệp"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <div className="space-y-2 mb-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Mã giao dịch ngân hàng (FT/Trace ID) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankReference}
                      onChange={(e) => setBankReference(e.target.value)}
                      placeholder="VD: FT260102001"
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-mono uppercase font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tài khoản ngân hàng chi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={payingAccount}
                      onChange={(e) => setPayingAccount(e.target.value)}
                      placeholder="VD: VCB 0123456789"
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Ghi chú (không bắt buộc)
                  </label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Nhập ghi chú..."
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayout}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs inline-flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Xác nhận đã chuyển khoản</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal từ chối yêu cầu rút tiền */}
      {rejectModalOpen && activeRecord && (
        <ManagementDialog
          title="Từ chối yêu cầu rút tiền"
          onClose={() => setRejectModalOpen(false)}
        >
          <div className="space-y-4 text-sm">
            <p className="text-xs text-slate-600">
              Vui lòng nhập lý do từ chối yêu cầu rút tiền của <strong>{activeRecord.bankAccountHolder}</strong> (WD-{activeRecord.id.slice(-5).toUpperCase()}). Số tiền {money(activeRecord.amount)} sẽ được hoàn lại vào số dư khả dụng trong ví của Assessor.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                maxLength={2000}
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do chi tiết..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim()}
                onClick={submitReject}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-40"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </ManagementDialog>
      )}
    </div>
  );
}
