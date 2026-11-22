import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Megaphone,
  Search,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  X,
  ExternalLink,
  Calendar,
  Building2,
  Package,
  Image as ImageIcon,
  Check,
  Filter,
} from 'lucide-react';
import { advertisementsService } from '../../services/advertisements.service';
import { getApiErrorMessage } from '../../services/api';
import {
  CampaignStatus,
  getCampaignStatusConfig,
  isSafeHttpUrl,
} from '../../types/advertisements';
import type {
  CampaignResponse,
  CampaignsResponse,
} from '../../types/advertisements';

export const AdvertisementsPage: React.FC = () => {
  // Data states
  const [campaigns, setCampaigns] = useState<CampaignResponse[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  // Local filters (applied within current page)
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Detail Modal state
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignResponse | null>(null);

  // Moderation Confirmation Modals
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref sequencing to prevent race conditions
  const requestSeq = useRef(0);

  // Toast Helpers
  const showToastSuccess = (msg: string) => {
    setToastSuccess(msg);
    setTimeout(() => setToastSuccess(null), 4000);
  };

  const showToastError = (msg: string) => {
    setToastError(msg);
    setTimeout(() => setToastError(null), 5000);
  };

  // Fetch campaigns
  const fetchCampaigns = useCallback(
    async (targetPage = page) => {
      setIsLoading(true);
      setErrorMessage(null);
      const currentSeq = ++requestSeq.current;

      try {
        const res: CampaignsResponse = await advertisementsService.getAdminCampaigns(
          targetPage,
          pageSize
        );

        if (currentSeq === requestSeq.current) {
          setCampaigns(res.campaigns || []);
          setTotalItems(res.totalItems || 0);
          setTotalPages(res.totalPages || 1);
          setPage(res.page || 1);
        }
      } catch (err: unknown) {
        if (currentSeq === requestSeq.current) {
          setErrorMessage(
            getApiErrorMessage(err, 'Không thể tải danh sách chiến dịch quảng cáo.')
          );
        }
      } finally {
        if (currentSeq === requestSeq.current) {
          setIsLoading(false);
        }
      }
    },
    [page, pageSize]
  );

  useEffect(() => {
    fetchCampaigns(page);
  }, [fetchCampaigns, page]);

  // Handle Approve Action
  const handleConfirmApprove = async () => {
    if (!selectedCampaign || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const updated = await advertisementsService.moderateCampaign(selectedCampaign.id, {
        isApproved: true,
        reason: null,
      });

      // Update both list and active detail modal
      setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setSelectedCampaign(updated);
      setIsApproveConfirmOpen(false);
      showToastSuccess(`Đã phê duyệt thành công chiến dịch "${updated.title}".`);
    } catch (err: unknown) {
      handleModerationApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reject Action
  const handleConfirmReject = async () => {
    if (!selectedCampaign || isSubmitting) return;

    const trimmed = rejectReason.trim();
    if (!trimmed) {
      setRejectError('Vui lòng nhập lý do từ chối chiến dịch.');
      return;
    }

    setIsSubmitting(true);
    setRejectError(null);

    try {
      const updated = await advertisementsService.moderateCampaign(selectedCampaign.id, {
        isApproved: false,
        reason: trimmed,
      });

      // Update both list and active detail modal
      setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setSelectedCampaign(updated);
      setIsRejectModalOpen(false);
      setRejectReason('');
      showToastSuccess(`Đã từ chối chiến dịch "${updated.title}".`);
    } catch (err: unknown) {
      handleModerationApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Centralized Error Handling for Moderation Actions
  const handleModerationApiError = (err: unknown) => {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 403) {
        showToastError('Tài khoản không có quyền thực hiện kiểm duyệt quảng cáo.');
        return;
      }
      if (status === 404) {
        showToastError('Chiến dịch quảng cáo không còn tồn tại trên hệ thống.');
        setIsApproveConfirmOpen(false);
        setIsRejectModalOpen(false);
        setSelectedCampaign(null);
        fetchCampaigns(page);
        return;
      }
      if (status === 409) {
        showToastError(
          'Chiến dịch đã thay đổi trạng thái hoặc không ở hàng chờ duyệt (INVALID_STATUS). Đang tải lại...'
        );
        setIsApproveConfirmOpen(false);
        setIsRejectModalOpen(false);
        fetchCampaigns(page);
        return;
      }
    }
    showToastError(
      getApiErrorMessage(err, 'Thao tác kiểm duyệt thất bại. Vui lòng thử lại.')
    );
  };

  // Format VND Currency
  const formatVnd = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0 ₫';
    try {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `${amount} ₫`;
    }
  };

  // Format DateTime Helper (Asia/Ho_Chi_Minh)
  const formatDateTime = (dateStr: string | null | undefined): string => {
    if (!dateStr) return 'Chưa xác định';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Chưa xác định';
      return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return 'Chưa xác định';
    }
  };

  // Filter campaigns locally on the current page
  const filteredCampaigns = campaigns.filter((c) => {
    // Keyword match on title or companyName
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchCompany = c.companyName.toLowerCase().includes(q);
      if (!matchTitle && !matchCompany) return false;
    }
    // Status filter
    if (statusFilter !== 'all') {
      if (c.status !== Number(statusFilter)) return false;
    }
    return true;
  });

  // Count pending moderation campaigns on current page
  const pendingCountOnPage = campaigns.filter(
    (c) => c.status === CampaignStatus.PendingModeration
  ).length;

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Toast Alert Success */}
      {toastSuccess && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{toastSuccess}</span>
          <button
            onClick={() => setToastSuccess(null)}
            className="ml-2 text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Toast Alert Error */}
      {toastError && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-3">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="text-xs font-semibold">{toastError}</span>
          <button
            onClick={() => setToastError(null)}
            className="ml-2 text-rose-600 hover:text-rose-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Megaphone className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Kiểm duyệt Banner & Quảng cáo
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Kiểm tra nội dung hình ảnh, liên kết đích và phê duyệt các chiến dịch truyền thông của
            đối tác doanh nghiệp trên hệ thống UniNet.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {pendingCountOnPage > 0 && (
            <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {pendingCountOnPage} chiến dịch chờ duyệt (trang {page})
            </span>
          )}
          <button
            onClick={() => fetchCampaigns(page)}
            disabled={isLoading}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tiêu đề, doanh nghiệp..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
            {keyword && (
              <button
                onClick={() => setKeyword('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            >
              <option value="all">Tất cả trạng thái (trên trang này)</option>
              <option value={String(CampaignStatus.PendingModeration)}>
                Chờ kiểm duyệt (1)
              </option>
              <option value={String(CampaignStatus.Draft)}>Bản nháp (0)</option>
              <option value={String(CampaignStatus.PendingPayment)}>
                Chờ thanh toán (2)
              </option>
              <option value={String(CampaignStatus.Active)}>Đang chạy (3)</option>
              <option value={String(CampaignStatus.Completed)}>Đã kết thúc (4)</option>
              <option value={String(CampaignStatus.Rejected)}>Bị từ chối (5)</option>
            </select>
          </div>

          {/* Filter Notice */}
          <div className="flex items-center text-[11px] text-slate-500 lg:justify-end">
            <span className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              Lọc cục bộ trong {campaigns.length} chiến dịch của trang hiện tại (Tổng cộng:{' '}
              <strong className="text-slate-800">{totalItems}</strong> toàn hệ thống).
            </span>
          </div>
        </div>
      </div>

      {/* Main Table or Loading / Error States */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium">Đang tải danh sách chiến dịch quảng cáo...</p>
          </div>
        ) : errorMessage ? (
          <div className="py-12 px-6 text-center space-y-3">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-rose-600 max-w-md mx-auto">{errorMessage}</p>
            <button
              onClick={() => fetchCampaigns(page)}
              className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
            >
              Thử lại
            </button>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Megaphone className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-medium">Không có chiến dịch quảng cáo nào trên hệ thống.</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Search className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-medium">
              Không tìm thấy chiến dịch nào phù hợp với bộ lọc trên trang này.
            </p>
            <button
              onClick={() => {
                setKeyword('');
                setStatusFilter('all');
              }}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Xóa bộ lọc trang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Banner & Tiêu đề</th>
                  <th className="py-3 px-4">Doanh nghiệp</th>
                  <th className="py-3 px-4">Gói dịch vụ</th>
                  <th className="py-3 px-4">Thời hạn / Ngân sách</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCampaigns.map((c) => {
                  const statusCfg = getCampaignStatusConfig(c.status);
                  const isSafeLink = isSafeHttpUrl(c.destinationUrl);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Banner & Title */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                            {c.mediaUrl ? (
                              <img
                                src={c.mediaUrl}
                                alt={c.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to placeholder icon on broken media URL
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate" title={c.title}>
                              {c.title}
                            </div>
                            {isSafeLink ? (
                              <a
                                href={c.destinationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[200px]"
                                title={c.destinationUrl}
                              >
                                <span className="truncate">{c.destinationUrl}</span>
                                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              </a>
                            ) : (
                              <span
                                className="text-[11px] text-slate-400 truncate max-w-[200px] block"
                                title="URL không hợp lệ hoặc không thuộc HTTP/HTTPS"
                              >
                                {c.destinationUrl || 'Chưa cấu hình URL'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{c.companyName}</span>
                        </div>
                      </td>

                      {/* Package */}
                      <td className="py-3.5 px-4">
                        {c.packageName ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium">
                            <Package className="w-3 h-3 shrink-0" />
                            <span className="truncate">{c.packageName}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Chưa chọn gói dịch vụ
                          </span>
                        )}
                      </td>

                      {/* Budget / Dates */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{formatVnd(c.budgetCap)}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span>
                            {c.startedAt && c.expiredAt
                              ? `${formatDateTime(c.startedAt)} - ${formatDateTime(c.expiredAt)}`
                              : `Tạo: ${formatDateTime(c.createdAt)}`}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                        >
                          {statusCfg.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedCampaign(c)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-xs text-slate-600">
            <span>
              Trang <strong>{page}</strong> / <strong>{totalPages}</strong> (Tổng cộng {totalItems}{' '}
              chiến dịch)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                Trang trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                Trang tiếp
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: View Campaign Detail */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Megaphone className="w-4 h-4" />
                </span>
                <h2 className="text-sm font-bold text-slate-900">Chi tiết chiến dịch quảng cáo</h2>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Campaign Header Box: Title & Status */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    {selectedCampaign.title}
                  </h3>
                  {(() => {
                    const cfg = getCampaignStatusConfig(selectedCampaign.status);
                    return (
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}
                      >
                        {cfg.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-4 text-slate-500 text-[11px] flex-wrap">
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {selectedCampaign.companyName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                    {selectedCampaign.packageName || 'Bản nháp chưa chọn gói'}
                  </span>
                </div>
              </div>

              {/* Banner / Media Preview */}
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-700 block">Hình ảnh Banner quảng cáo:</span>
                <div className="w-full h-44 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                  {selectedCampaign.mediaUrl ? (
                    <img
                      src={selectedCampaign.mediaUrl}
                      alt={selectedCampaign.title}
                      className="w-full h-full object-contain bg-slate-900/5"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-center text-slate-400 space-y-1">
                      <ImageIcon className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-[11px]">Chưa tải hình ảnh banner</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Ad Content */}
              <div className="space-y-1">
                <span className="font-semibold text-slate-700 block">Nội dung quảng cáo:</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedCampaign.content || 'Không có nội dung mô tả.'}
                </div>
              </div>

              {/* Destination URL: Strictly validates HTTP(S) */}
              <div className="space-y-1">
                <span className="font-semibold text-slate-700 block">Liên kết đích (Destination URL):</span>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                  {isSafeHttpUrl(selectedCampaign.destinationUrl) ? (
                    <a
                      href={selectedCampaign.destinationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5 truncate"
                    >
                      <span className="truncate">{selectedCampaign.destinationUrl}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-amber-700 text-[11px] font-mono truncate">
                      {selectedCampaign.destinationUrl || 'Chưa cung cấp liên kết'} (Không phải liên kết HTTP/HTTPS an toàn)
                    </span>
                  )}
                </div>
              </div>

              {/* Rejection Reason if any */}
              {selectedCampaign.rejectionReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-rose-800">
                  <div className="flex items-center gap-1.5 font-bold">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Lý do từ chối kiểm duyệt:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed pl-5">
                    {selectedCampaign.rejectionReason}
                  </p>
                </div>
              )}

              {/* Stats & Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px]">Ngân sách tối đa</span>
                  <span className="font-bold text-slate-900 block text-xs mt-0.5">
                    {formatVnd(selectedCampaign.budgetCap)}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px]">Lượt hiển thị (Impression)</span>
                  <span className="font-bold text-slate-900 block text-xs mt-0.5">
                    {selectedCampaign.impressionCount.toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px]">Lượt nhấp (Click)</span>
                  <span className="font-bold text-slate-900 block text-xs mt-0.5">
                    {selectedCampaign.clickCount.toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px]">Thời gian bắt đầu</span>
                  <span className="font-medium text-slate-700 block text-[11px] mt-0.5">
                    {selectedCampaign.startedAt
                      ? formatDateTime(selectedCampaign.startedAt)
                      : 'Chưa bắt đầu'}
                  </span>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div>
                  <span className="text-slate-400">Thời gian tạo: </span>
                  <span className="font-medium text-slate-700">
                    {formatDateTime(selectedCampaign.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Cập nhật lần cuối: </span>
                  <span className="font-medium text-slate-700">
                    {formatDateTime(selectedCampaign.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-2 flex-wrap">
              {/* Notice for processed campaigns */}
              <div className="text-[11px] text-slate-500">
                {selectedCampaign.status === CampaignStatus.PendingModeration ? (
                  <span className="text-amber-700 font-medium">
                    Chiến dịch đang chờ quản trị viên / kiểm duyệt viên xem xét.
                  </span>
                ) : (
                  <span className="text-slate-400">
                    Chiến dịch đã được xử lý (không khả dụng nút duyệt/từ chối).
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Decision buttons only visible when status === PendingModeration (1) */}
                {selectedCampaign.status === CampaignStatus.PendingModeration && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectReason('');
                        setRejectError(null);
                        setIsRejectModalOpen(true);
                      }}
                      className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Từ chối</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsApproveConfirmOpen(true)}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Phê duyệt</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedCampaign(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Approve */}
      {isApproveConfirmOpen && selectedCampaign && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900">
                Xác nhận phê duyệt chiến dịch quảng cáo?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bạn đang chuẩn bị phê duyệt chiến dịch{' '}
                <strong className="text-slate-900">"{selectedCampaign.title}"</strong> của doanh nghiệp{' '}
                <strong className="text-slate-900">{selectedCampaign.companyName}</strong>. Chiến dịch
                sẽ được chuyển sang trạng thái <strong>Đang chạy (Active)</strong> và bắt đầu phân phối
                hiển thị.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsApproveConfirmOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Xác nhận duyệt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reject with Required Reason */}
      {isRejectModalOpen && selectedCampaign && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900">Từ chối chiến dịch quảng cáo</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Chiến dịch <strong className="text-slate-900">"{selectedCampaign.title}"</strong> sẽ bị
                chuyển sang trạng thái <strong>Bị từ chối (Rejected)</strong>.
              </p>
            </div>

            {rejectError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{rejectError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Lý do từ chối <span className="text-rose-500">*</span>:
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (rejectError) setRejectError(null);
                }}
                rows={3}
                placeholder="VD: Vui lòng thay liên kết đích bằng trang chính thức của doanh nghiệp."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 resize-none transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectReason('');
                  setRejectError(null);
                }}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>Xác nhận từ chối</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvertisementsPage;
