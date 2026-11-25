import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  UserCheck,
  Plus,
  Search,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Check,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { assessorOnboardingService } from '../../services/assessor-onboarding.service';
import { formatAssessorOnboardingLink } from '../../utils/assessor-link';
import { getApiErrorMessage } from '../../services/api';
import {
  AssessorOnboardingStatus,
  formatOnboardingDateTime,
  getAssessorOnboardingStatusConfig,
} from '../../types/assessor-onboarding';
import type {
  AssessorOnboardingsListResponse,
  AssessorOnboardingListItem,
  AssessorOnboardingReviewResponse,
  AssessorInvitationResponse,
} from '../../types/assessor-onboarding';
import { AssessorOnboardingDetailView } from '../../components/admin/AssessorOnboardingDetailView';

export const AssessorOnboardingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  // Query parameters state
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // List data state
  const [listData, setListData] = useState<AssessorOnboardingsListResponse | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Selected onboarding detail state (modal)
  const [selectedOnboarding, setSelectedOnboarding] = useState<AssessorOnboardingListItem | null>(null);
  const [detailData, setDetailData] = useState<AssessorOnboardingReviewResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create Invitation Modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [autoApprove, setAutoApprove] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [createdInvitation, setCreatedInvitation] = useState<AssessorInvitationResponse | null>(null);
  const [isCopiedLink, setIsCopiedLink] = useState(false);

  // Abort controllers refs
  const listAbortControllerRef = useRef<AbortController | null>(null);
  const detailAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const refreshList = useCallback(() => {
    setReloadTrigger((k) => k + 1);
  }, []);

  // Debounce keyword input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setKeyword(keywordInput.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [keywordInput]);

  // Load onboardings list
  useEffect(() => {
    if (listAbortControllerRef.current) {
      listAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    listAbortControllerRef.current = controller;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingList(true);
    setListError(null);

    async function fetchList() {
      try {
        const res = await assessorOnboardingService.list(
          {
            keyword,
            status: statusFilter,
            page,
            pageSize,
          },
          controller.signal
        );

        if (!controller.signal.aborted) {
          if (res.onboardings.length === 0 && res.totalPages > 0 && page > res.totalPages) {
            setPage(res.totalPages);
            return;
          }
          setListData(res);
          setIsLoadingList(false);
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          if (axios.isAxiosError(err)) {
            const status = err.response?.status;
            const data = err.response?.data as { code?: string; message?: string } | undefined;
            const code = data?.code || '';

            if (status === 400) {
              if (code === 'INVALID_PAGINATION') {
                setListError('Thông số phân trang không hợp lệ. Đã chuyển về trang 1.');
                setPage(1);
              } else if (code === 'INVALID_ONBOARDING_STATUS') {
                setListError('Trạng thái hồ sơ không hợp lệ.');
              } else if (code === 'INVALID_KEYWORD') {
                setListError('Từ khóa tìm kiếm không hợp lệ (tối đa 255 ký tự).');
              } else {
                setListError(data?.message || 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại bộ lọc.');
              }
            } else if (status === 401) {
              setListError('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
            } else if (status === 403 || code === 'FORBIDDEN') {
              setListError(data?.message || 'Bạn không có quyền quản lý hồ sơ thẩm định viên.');
            } else {
              setListError(getApiErrorMessage(err, 'Không thể tải danh sách hồ sơ assessor.'));
            }
          } else {
            setListError('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
          }
          setIsLoadingList(false);
        }
      }
    }

    void fetchList();

    return () => {
      controller.abort();
    };
  }, [keyword, statusFilter, page, pageSize, reloadTrigger]);

  // Load selected onboarding detail
  const loadDetail = useCallback(
    async (
      item: AssessorOnboardingListItem,
      silent = false
    ): Promise<AssessorOnboardingReviewResponse | null> => {
      if (detailAbortControllerRef.current) {
        detailAbortControllerRef.current.abort();
      }
      const controller = new AbortController();
      detailAbortControllerRef.current = controller;

      setSelectedOnboarding(item);
      if (!silent) {
        setIsLoadingDetail(true);
        setDetailError(null);
        setDetailData(null);
      }

      try {
        const res = await assessorOnboardingService.getDetail(item.id, controller.signal);
        if (!controller.signal.aborted) {
          setDetailData(res);
          setIsLoadingDetail(false);
          return res;
        }
        return null;
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          if (axios.isAxiosError(err)) {
            const status = err.response?.status;
            const data = err.response?.data as { code?: string; message?: string } | undefined;
            if (status === 404 || data?.code === 'ONBOARDING_NOT_FOUND') {
              setDetailError('Hồ sơ assessor không còn khả dụng hoặc không tồn tại trên hệ thống.');
            } else if (status === 401) {
              setDetailError('Phiên làm việc không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
            } else if (status === 403 || data?.code === 'FORBIDDEN') {
              setDetailError(data?.message || 'Bạn không có quyền xem chi tiết hồ sơ này.');
            } else {
              setDetailError(getApiErrorMessage(err, 'Không thể tải chi tiết hồ sơ assessor.'));
            }
          } else {
            setDetailError('Lỗi kết nối khi tải chi tiết hồ sơ.');
          }
          setIsLoadingDetail(false);
        }
        return null;
      }
    },
    []
  );

  const handleCloseDetail = () => {
    if (detailAbortControllerRef.current) {
      detailAbortControllerRef.current.abort();
    }
    setSelectedOnboarding(null);
    setDetailData(null);
    setDetailError(null);
  };

  // Create Invitation Handlers
  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const cleanEmail = inviteEmail.trim();

    if (!cleanEmail) {
      setInviteError('Vui lòng nhập địa chỉ email của chuyên gia.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setInviteError('Địa chỉ email không đúng định dạng.');
      return;
    }

    setIsInviting(true);
    setInviteError(null);

    try {
      const result = await assessorOnboardingService.invite({
        email: cleanEmail,
        autoApprove,
      });
      setCreatedInvitation(result);
      refreshList();
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Không thể tạo lời mời onboarding.');
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        if (msg.includes('EMAIL_ALREADY_REGISTERED')) {
          setInviteError('Email này đã được đăng ký tài khoản trong hệ thống.');
        } else if (msg.includes('ONBOARDING_ALREADY_OPEN')) {
          setInviteError('Email này đang có một hồ sơ onboarding mở khác chưa hoàn tất.');
        } else {
          setInviteError(msg);
        }
      } else {
        setInviteError(msg);
      }
    } finally {
      setIsInviting(false);
    }
  };

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false);
    setInviteEmail('');
    setAutoApprove(false);
    setCreatedInvitation(null);
    setInviteError(null);
    setIsCopiedLink(false);
  };

  const formattedOnboardingLink = createdInvitation
    ? formatAssessorOnboardingLink(createdInvitation.profileLink)
    : '';

  const handleCopyLink = () => {
    if (!formattedOnboardingLink) return;
    navigator.clipboard.writeText(formattedOnboardingLink);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <UserCheck className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hồ sơ assessor</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý quy trình onboarding, xem xét hồ sơ và phê duyệt tài khoản chuyên gia thẩm định
              </p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              handleCloseInviteModal();
              setIsInviteModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Tạo lời mời mới
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Tìm theo họ tên hoặc email..."
              maxLength={255}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
            {keywordInput && (
              <button
                type="button"
                onClick={() => setKeywordInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Trạng thái:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value={AssessorOnboardingStatus.Invited}>Đã gửi lời mời</option>
              <option value={AssessorOnboardingStatus.ProfileSubmitted}>Đã nộp hồ sơ</option>
              <option value={AssessorOnboardingStatus.AwaitingSignature}>Chờ ký hợp đồng</option>
              <option value={AssessorOnboardingStatus.AwaitingApproval}>Chờ phê duyệt</option>
              <option value={AssessorOnboardingStatus.ApprovalConflict}>Xung đột phê duyệt</option>
              <option value={AssessorOnboardingStatus.AwaitingPassword}>Chờ thiết lập mật khẩu</option>
              <option value={AssessorOnboardingStatus.Activated}>Đã kích hoạt</option>
              <option value={AssessorOnboardingStatus.Rejected}>Đã từ chối</option>
              <option value={AssessorOnboardingStatus.Revoked}>Đã thu hồi</option>
              <option value={AssessorOnboardingStatus.Expired}>Đã hết hạn</option>
            </select>
          </div>
        </div>

        {/* Reset & Refresh */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {(keywordInput || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setKeywordInput('');
                setStatusFilter('all');
                setPage(1);
              }}
              className="px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          )}

          <button
            type="button"
            onClick={refreshList}
            disabled={isLoadingList}
            className="px-3 py-2 text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {listError ? (
          <div className="p-8 text-center space-y-3">
            <div className="p-3 bg-red-50 text-red-600 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-700 font-medium">{listError}</p>
            <button
              type="button"
              onClick={refreshList}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              Thử lại
            </button>
          </div>
        ) : isLoadingList ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            <p className="text-xs font-medium">Đang tải danh sách hồ sơ assessor...</p>
          </div>
        ) : !listData || listData.onboardings.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <UserCheck className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              {keyword || statusFilter !== 'all'
                ? 'Không có hồ sơ phù hợp bộ lọc'
                : 'Chưa có hồ sơ assessor'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {keyword || statusFilter !== 'all'
                ? 'Hãy thử điều chỉnh lại từ khóa tìm kiếm hoặc chọn tất cả trạng thái.'
                : 'Nhấn "Tạo lời mời mới" để bắt đầu gửi lời mời onboarding cho chuyên gia.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="py-3.5 px-4">Họ và tên</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-3">Trạng thái</th>
                  <th className="py-3.5 px-4">Ngày tạo</th>
                  <th className="py-3.5 px-4">Ngày nộp</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listData.onboardings.map((row) => {
                  const statusCfg = getAssessorOnboardingStatusConfig(row.status);
                  const isSelected = selectedOnboarding?.id === row.id;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => void loadDetail(row)}
                      className={`hover:bg-slate-50/80 transition cursor-pointer ${
                        isSelected ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {row.fullName || <span className="text-slate-400 font-normal">Chưa cung cấp</span>}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {row.emailNormalized}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatOnboardingDateTime(row.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatOnboardingDateTime(row.submittedAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void loadDetail(row);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem chi tiết</span>
                          </button>
                          <Link
                            to={`/admin/assessor-onboardings/${row.id}`}
                            onClick={(e) => e.stopPropagation()}
                            title="Mở trang chi tiết"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition inline-flex items-center"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {listData && (
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Tổng số hồ sơ: <span className="font-semibold text-slate-900">{listData.totalItems}</span>{' '}
              {listData.totalPages > 1 && (
                <span>
                  (Trang <span className="font-semibold text-slate-800">{listData.page}</span> /{' '}
                  <span className="font-semibold text-slate-800">{listData.totalPages}</span>)
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Hiển thị:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs focus:outline-hidden"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoadingList}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Trước</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(listData.totalPages, p + 1))}
                  disabled={page >= listData.totalPages || isLoadingList}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
                >
                  <span>Sau</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Centered Detail Modal */}
      {selectedOnboarding && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseDetail();
          }}
          className="fixed top-16 inset-x-0 bottom-0 z-20 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
        >
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-6.5rem)] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <UserCheck className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Chi tiết hồ sơ assessor</h2>
                  <p className="text-xs text-slate-500">
                    {detailData?.fullName || selectedOnboarding.fullName || selectedOnboarding.emailNormalized}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/admin/assessor-onboardings/${selectedOnboarding.id}`}
                  className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở toàn trang</span>
                </Link>
                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingDetail ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-xs font-medium">Đang tải chi tiết hồ sơ từ hệ thống...</p>
                </div>
              ) : detailError ? (
                <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900">Không thể tải thông tin hồ sơ</h3>
                  <p className="text-xs text-slate-600">{detailError}</p>
                  <button
                    type="button"
                    onClick={() => void loadDetail(selectedOnboarding)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
                  >
                    Thử lại
                  </button>
                </div>
              ) : detailData ? (
                <AssessorOnboardingDetailView
                  detail={detailData}
                  isAdmin={isAdmin}
                  createdAt={selectedOnboarding.createdAt}
                  submittedAt={selectedOnboarding.submittedAt}
                  variant="modal"
                  onRefreshDetail={() => loadDetail(selectedOnboarding, true)}
                  onRefreshList={refreshList}
                  onNotFound={(msg) => setDetailError(msg)}
                  onToast={showToast}
                />
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={handleCloseDetail}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition shadow-xs"
              >
                Đóng chi tiết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Invitation */}
      {isInviteModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Tạo lời mời Onboarding thẩm định viên
              </h2>
              <button
                type="button"
                onClick={handleCloseInviteModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createdInvitation ? (
              <div className="space-y-4 py-1 text-xs">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Lời mời onboarding đã được tạo thành công!</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Vui lòng sao chép đường dẫn bên dưới và gửi đến chuyên gia thẩm định để bắt đầu quy trình khai báo hồ sơ.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="text-slate-600 font-medium block">
                    Đường dẫn khai báo thông tin cá nhân:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={formattedOnboardingLink}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-[11px] font-mono text-slate-800 select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-[11px] flex items-center gap-1 shrink-0 transition"
                    >
                      {isCopiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopiedLink ? 'Đã sao chép' : 'Sao chép link'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Thời hạn hiệu lực: 7 ngày (hết hạn vào {formatOnboardingDateTime(createdInvitation.expiresAt)}).
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseInviteModal}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateInvitation} className="space-y-4 text-xs">
                {inviteError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{inviteError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Địa chỉ Email chuyên gia thẩm định <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="assessor@example.com"
                    maxLength={255}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                  <p className="text-[11px] text-slate-400">
                    Email phải là địa chỉ duy nhất, chưa từng đăng ký tài khoản trên hệ thống.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoApprove}
                      onChange={(e) => setAutoApprove(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-800">
                        Bật chế độ tự động phê duyệt (Auto Approve)
                      </span>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Khi bật, hệ thống sẽ tự động phê duyệt sau khi chuyên gia ký hợp đồng điện tử hợp lệ.
                        Quản trị viên vẫn có thể chủ động xem xét và phê duyệt trước thời điểm đó.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseInviteModal}
                    disabled={isInviting}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {isInviting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Tạo lời mời</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessorOnboardingsPage;
