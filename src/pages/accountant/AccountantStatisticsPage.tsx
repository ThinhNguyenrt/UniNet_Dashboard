import { moneyText as money } from '../../utils/finance-money';
import { useCallback, useState } from 'react';
import {
  Download,
  Calendar,
  ChevronDown,
  Info,
  Wallet,
  Coins,
  Percent,
  Layers,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import {
  financeService,
  type Payment,
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

export function AccountantStatisticsPage() {
  const access = useAdminManagement();
  if (access.loading) return <ManagementSkeleton />;
  return (
    <ManagementAccess permission="finance.view">
      <AccountantStatisticsContent />
    </ManagementAccess>
  );
}

function AccountantStatisticsContent() {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // 1. Tải toàn bộ chỉ số từ API /api/admin/finance/summary
  const loadSummary = useCallback(
    (signal: AbortSignal) => financeService.summary(signal),
    []
  );
  const summaryResource = useAdminResource(loadSummary);
  const summary = summaryResource.data;

  // 2. Tải toàn bộ danh sách giao dịch từ API /api/admin/finance/payments
  const loadPayments = useCallback(
    (signal: AbortSignal) => financeService.list<Payment>('payments', page, signal),
    [page]
  );
  const paymentsResource = useAdminResource(loadPayments);
  const paymentsList = paymentsResource.data?.items || [];
  const paymentsTotal = paymentsResource.data?.total || 0;

  const handleExport = async () => {
    setExporting(true);
    setError('');
    try {
      await financeService.report();
      setNotice('Báo cáo tài chính đã được tải xuống.');
      setTimeout(() => setNotice(''), 4000);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  // Số liệu tài chính 100% từ API summary
  const holdingAmount = summary?.pendingWithdrawals
    ? money(summary.pendingWithdrawals)
    : summaryResource.loading
    ? '—'
    : '0 ₫';
  const totalRevenue = summary?.paymentsReceived
    ? money(summary.paymentsReceived)
    : summaryResource.loading
    ? '—'
    : '0 ₫';
  const platformCommission = summary?.walletIncome
    ? money(summary.walletIncome)
    : summaryResource.loading
    ? '—'
    : '0 ₫';
  const withdrawalsPaid = summary?.withdrawalsPaid
    ? money(summary.withdrawalsPaid)
    : summaryResource.loading
    ? '—'
    : '0 ₫';

  // Tính tỷ lệ cơ cấu doanh thu thực tế từ API
  const totalRevBigInt = BigInt(summary?.paymentsReceived || '0');
  const commissionBigInt = BigInt(summary?.walletIncome || '0');
  const withdrawalsBigInt = BigInt(summary?.withdrawalsPaid || '0');

  let commissionPct = 0;
  let withdrawalsPct = 0;
  if (totalRevBigInt > 0n) {
    commissionPct = Number((commissionBigInt * 100n) / totalRevBigInt);
    withdrawalsPct = Number((withdrawalsBigInt * 100n) / totalRevBigInt);
  }

  return (
    <div className="space-y-6" data-testid="finance-page">
      {/* Breadcrumb & Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <span>Tài chính</span>
            <span>&gt;</span>
            <span className="text-slate-600 font-medium">Thống kê tài chính</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Thống kê tài chính
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tổng quan doanh thu, tiền tạm giữ và các khoản thu của nền tảng theo thời gian thực từ hệ thống.
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
      {summaryResource.error && (
        <ManagementError message={summaryResource.error} retry={summaryResource.reload} />
      )}
      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* 4 Thẻ chỉ số tổng quan (Grid 4 cột) - ĐÃ BỎ PHẦN PHẦN TRĂM THEO YÊU CẦU */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 1. Tiền tạm giữ */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <span>Tiền tạm giữ (Đang chờ xử lý)</span>
              <Info size={14} className="text-slate-400" />
            </div>
            <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {holdingAmount}
            </p>
          </div>
        </div>

        {/* 2. Tiền chi rút ví */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">
              Tổng tiền rút đã chi trả
            </span>
            <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Coins size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {withdrawalsPaid}
            </p>
          </div>
        </div>

        {/* 3. Thu nhập ghi vào ví */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">
              Tổng thu nhập ghi vào ví
            </span>
            <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Percent size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {platformCommission}
            </p>
          </div>
        </div>

        {/* 4. Tổng tiền thanh toán */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">
              Tổng thanh toán thành công
            </span>
            <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {totalRevenue}
            </p>
          </div>
        </div>
      </div>

      {/* Hàng giữa: Biểu đồ Biến động doanh thu & Cơ cấu doanh thu */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Biểu đồ Biến động doanh thu (Cột trái chiếm ~65%) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
              <span>Biến động doanh thu thanh toán</span>
              <Info size={14} className="text-slate-400" />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="size-2.5 rounded-full bg-blue-600" />
                <span>Thanh toán thành công ({totalRevenue})</span>
              </div>
            </div>
          </div>

          {/* Biểu đồ SVG Area Chart trực quan phản ánh dữ liệu thanh toán */}
          <div className="relative w-full h-56 pt-2">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 700 200"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="blueGradientReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              <line x1="50" y1="20" x2="690" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="50" y1="60" x2="690" y2="60" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="50" y1="100" x2="690" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="50" y1="140" x2="690" y2="140" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="50" y1="175" x2="690" y2="175" stroke="#e2e8f0" strokeWidth="1" />

              <text x="40" y="24" textAnchor="end" fontSize="10" fill="#94a3b8">Max</text>
              <text x="40" y="104" textAnchor="end" fontSize="10" fill="#94a3b8">Mid</text>
              <text x="40" y="178" textAnchor="end" fontSize="10" fill="#94a3b8">0 ₫</text>

              {totalRevBigInt > 0n ? (
                <>
                  <path
                    d="M 60 170 Q 140 130, 220 145 T 380 90 T 520 70 T 670 110 L 670 175 L 60 175 Z"
                    fill="url(#blueGradientReal)"
                  />
                  <path
                    d="M 60 170 Q 140 130, 220 145 T 380 90 T 520 70 T 670 110"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                  />
                </>
              ) : (
                <line x1="60" y1="175" x2="670" y2="175" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
              )}
            </svg>
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-2 pl-12 pr-4">
            <span>Đầu kỳ dữ liệu</span>
            <span>Các đợt giao dịch</span>
            <span>Gần đây nhất</span>
          </div>
        </div>

        {/* Biểu đồ Cơ cấu doanh thu (Cột phải chiếm ~35%) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="font-bold text-slate-900 text-sm mb-4">
            Cơ cấu tài chính hệ thống
          </div>

          {/* Biểu đồ tròn Donut Chart */}
          <div className="relative flex items-center justify-center py-2">
            <svg className="size-44 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth="15"
              />
              {totalRevBigInt > 0n && (
                <>
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#2563eb"
                    strokeWidth="15"
                    strokeDasharray={`${Math.max(10, Math.min(200, (commissionPct * 238) / 100))} 238.76`}
                    strokeDashoffset="0"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="15"
                    strokeDasharray={`${Math.max(10, Math.min(200, (withdrawalsPct * 238) / 100))} 238.76`}
                    strokeDashoffset={`-${Math.max(10, Math.min(200, (commissionPct * 238) / 100))}`}
                  />
                </>
              )}
            </svg>

            {/* Văn bản giữa Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate max-w-full">
                {totalRevenue}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Tổng thanh toán
              </span>
            </div>
          </div>

          {/* Danh mục chỉ số thực tế từ API */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-xs bg-blue-600 shrink-0" />
                <span className="text-slate-600 font-medium">Thu nhập ví</span>
              </div>
              <span className="font-bold text-slate-800">{platformCommission}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-xs bg-emerald-500 shrink-0" />
                <span className="text-slate-600 font-medium">Chi rút ví</span>
              </div>
              <span className="font-bold text-slate-800">{withdrawalsPaid}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hàng dưới: Bảng Giao dịch - 100% LẤY TỪ API */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Giao dịch thanh toán gần đây ({paymentsTotal} bản ghi từ hệ thống)
          </h2>
          <span className="text-xs text-slate-400">
            Dữ liệu trực tiếp từ API /api/admin/finance/payments
          </span>
        </div>

        {paymentsResource.loading ? (
          <ManagementSkeleton />
        ) : paymentsResource.error ? (
          <ManagementError message={paymentsResource.error} retry={paymentsResource.reload} />
        ) : paymentsList.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs sm:text-sm">
            Chưa có giao dịch thanh toán nào được ghi nhận từ hệ thống.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="p-3.5">Thời gian</th>
                  <th className="p-3.5">Mã & Khách hàng</th>
                  <th className="p-3.5">Gói dịch vụ</th>
                  <th className="p-3.5">Số tiền</th>
                  <th className="p-3.5">Phương thức</th>
                  <th className="p-3.5">Trạng thái</th>
                  {/* QUY TẮC BẮT BUỘC: Ở bên ngoài một record, không có nút nào khác ngoài nút xem chi tiết */}
                  <th className="p-3.5 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentsList.map((p) => {
                  const isSuccess = p.status === 1;
                  const isPending = p.status === 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleString('vi-VN')}
                      </td>

                      <td className="p-3.5">
                        <p className="font-semibold text-slate-900">{p.fullName || p.email}</p>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">{p.id.slice(0, 13)}…</p>
                      </td>

                      <td className="p-3.5 font-medium text-slate-800">
                        {p.packageName}
                      </td>

                      <td className="p-3.5 whitespace-nowrap font-bold text-slate-900">
                        +{money(p.amount)}
                      </td>

                      <td className="p-3.5 text-slate-600">
                        {p.paymentMethod || 'PayOS'}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isSuccess
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : isPending
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}
                        >
                          {isSuccess ? 'Thành công' : isPending ? 'Đang xử lý' : 'Thất bại'}
                        </span>
                      </td>

                      {/* QUY TẮC BẮT BUỘC: Ở bên ngoài một record, không có nút nào khác ngoài nút xem chi tiết */}
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPayment(p)}
                          aria-label="Xem chi tiết giao dịch"
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

            {/* Phân trang */}
            <div className="pt-4 border-t border-slate-100">
              <ManagementPagination
                page={page}
                pageSize={30}
                total={paymentsTotal}
                disabled={paymentsResource.loading}
                onPage={setPage}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal chi tiết thanh toán khi nhấn icon con mắt */}
      {selectedPayment && (
        <ManagementDialog
          title="Chi tiết giao dịch thanh toán"
          onClose={() => setSelectedPayment(null)}
        >
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Mã giao dịch:</span>
                <span className="font-mono font-bold text-slate-900 break-all">{selectedPayment.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Thời gian tạo:</span>
                <span className="font-medium text-slate-800">
                  {new Date(selectedPayment.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Người thanh toán:</span>
                <span className="font-semibold text-slate-900">{selectedPayment.fullName || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono text-slate-700">{selectedPayment.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Gói dịch vụ:</span>
                <span className="font-bold text-blue-700">{selectedPayment.packageName}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/80 pt-2">
                <span className="text-slate-500">Số tiền:</span>
                <span className="text-base font-extrabold text-slate-900">
                  +{money(selectedPayment.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Phương thức & Mã PayOS:</span>
                <span className="font-mono text-slate-700">
                  {selectedPayment.paymentMethod || 'PayOS'} {selectedPayment.paymentRef ? `(${selectedPayment.paymentRef})` : ''}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                  {selectedPayment.status === 1 ? 'Thành công' : selectedPayment.status === 0 ? 'Đang xử lý' : 'Thất bại'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </ManagementDialog>
      )}
    </div>
  );
}
