import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  FileText,
  CheckCircle2,
  XCircle,
  Send,
  KeyRound,
  Trash2,
  FileSignature,
  Shield,
  Loader2,
  Check,
  Copy,
  Info,
} from 'lucide-react';
import {
  assessorOnboardingService,
  ApprovalConflictError,
  ContractUnavailableError,
} from '../../services/assessor-onboarding.service';
import { getApiErrorMessage } from '../../services/api';
import {
  AssessorOnboardingStatus,
  getAssessorOnboardingStatusConfig,
} from '../../types/assessor-onboarding';
import type {
  AssessorOnboardingsListResponse,
  AssessorOnboardingListItem,
  AssessorOnboardingReviewResponse,
  AssessorInvitationResponse,
} from '../../types/assessor-onboarding';

export const AssessorOnboardingsPage: React.FC = () => {
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

  // Selected onboarding detail state (slide-over / modal)
  const [selectedOnboarding, setSelectedOnboarding] = useState<AssessorOnboardingListItem | null>(null);
  const [detailData, setDetailData] = useState<AssessorOnboardingReviewResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Detail actions state
  const [isApproving, setIsApproving] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isResendingContract, setIsResendingContract] = useState(false);
  const [isResendingPassword, setIsResendingPassword] = useState(false);
  const [contractCooldown, setContractCooldown] = useState(0);
  const [passwordCooldown, setPasswordCooldown] = useState(0);

  // Modals inside detail
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [isRevokeConfirmOpen, setIsRevokeConfirmOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // PDF Viewer Modal state
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

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

  // Format date helper in Asia/Ho_Chi_Minh (UTC+7)
  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime())
      ? '—'
      : new Intl.DateTimeFormat('vi-VN', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'Asia/Ho_Chi_Minh',
        }).format(date);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Cooldown timers
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (contractCooldown > 0) {
      timer = setTimeout(() => setContractCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [contractCooldown]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (passwordCooldown > 0) {
      timer = setTimeout(() => setPasswordCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [passwordCooldown]);

  // Clean up PDF blob url
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  // Debounce keyword input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setKeyword(keywordInput.trim());
      setPage(1); // Reset to page 1 on search change
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
            } else if (status === 403) {
              setListError('Bạn không có quyền quản lý hồ sơ thẩm định viên.');
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

    fetchList();

    return () => {
      controller.abort();
    };
  }, [keyword, statusFilter, page, pageSize, reloadTrigger]);

  // Load selected onboarding detail
  const loadDetail = useCallback(async (item: AssessorOnboardingListItem, silent = false) => {
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
      }
    } catch (err: unknown) {
      if (!controller.signal.aborted) {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          const data = err.response?.data as { code?: string; message?: string } | undefined;
          if (status === 404 || data?.code === 'ONBOARDING_NOT_FOUND') {
            setDetailError('Hồ sơ assessor không còn tồn tại trên hệ thống.');
          } else if (status === 403) {
            setDetailError('Bạn không có quyền xem chi tiết hồ sơ này.');
          } else {
            setDetailError(getApiErrorMessage(err, 'Không thể tải chi tiết hồ sơ assessor.'));
          }
        } else {
          setDetailError('Lỗi kết nối khi tải chi tiết hồ sơ.');
        }
        setIsLoadingDetail(false);
      }
    }
  }, []);

  const handleCloseDetail = () => {
    if (detailAbortControllerRef.current) {
      detailAbortControllerRef.current.abort();
    }
    setSelectedOnboarding(null);
    setDetailData(null);
    setDetailError(null);
  };

  // View Contract PDF
  const handleOpenContractPdf = async () => {
    if (!selectedOnboarding) return;
    setIsPdfModalOpen(true);
    setIsLoadingPdf(true);
    setPdfError(null);

    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }

    try {
      const blob = await assessorOnboardingService.getContractPdf(selectedOnboarding.id);
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (err) {
      if (err instanceof ContractUnavailableError) {
        setPdfError('Chưa có hợp đồng nào được tạo cho hồ sơ này.');
      } else {
        setPdfError(getApiErrorMessage(err, 'Không thể tải bản thảo hợp đồng PDF.'));
      }
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handleClosePdfModal = () => {
    setIsPdfModalOpen(false);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    setPdfError(null);
  };

  // Action: Approve
  const handleApprove = async () => {
    if (!selectedOnboarding || isApproving) return;
    setIsApproving(true);
    setIsApproveConfirmOpen(false);

    try {
      await assessorOnboardingService.approve(selectedOnboarding.id);
      showToast('Phê duyệt hồ sơ thành công! Hệ thống đã cấp tài khoản thẩm định viên.');
      // Refresh list and detail
      setReloadTrigger((k) => k + 1);
      await loadDetail(selectedOnboarding, true);
    } catch (err) {
      if (err instanceof ApprovalConflictError) {
        alert(
          `Xung đột phê duyệt: Email đã tồn tại tài khoản hoặc có hồ sơ mở khác (${err.message}). Trạng thái đã chuyển sang Xung đột phê duyệt.`
        );
        setReloadTrigger((k) => k + 1);
        await loadDetail(selectedOnboarding, true);
      } else {
        alert(getApiErrorMessage(err, 'Không thể phê duyệt hồ sơ onboarding.'));
      }
    } finally {
      setIsApproving(false);
    }
  };

  // Action: Reject
  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOnboarding || isSubmittingReject) return;
    const cleanReason = rejectReason.trim();

    if (!cleanReason) {
      setRejectError('Vui lòng nhập lý do từ chối hồ sơ.');
      return;
    }
    if (cleanReason.length > 2000) {
      setRejectError('Lý do từ chối không được vượt quá 2000 ký tự.');
      return;
    }

    setIsSubmittingReject(true);
    setRejectError(null);

    try {
      await assessorOnboardingService.reject(selectedOnboarding.id, cleanReason);
      showToast('Đã từ chối hồ sơ onboarding và gửi thông báo qua email.');
      setIsRejectModalOpen(false);
      setRejectReason('');
      setReloadTrigger((k) => k + 1);
      await loadDetail(selectedOnboarding, true);
    } catch (err) {
      setRejectError(getApiErrorMessage(err, 'Không thể từ chối hồ sơ onboarding.'));
    } finally {
      setIsSubmittingReject(false);
    }
  };

  // Action: Revoke
  const handleRevoke = async () => {
    if (!selectedOnboarding || isRevoking) return;
    setIsRevoking(true);
    setIsRevokeConfirmOpen(false);

    try {
      await assessorOnboardingService.revoke(selectedOnboarding.id);
      showToast('Đã thu hồi lời mời onboarding thành công.');
      setReloadTrigger((k) => k + 1);
      await loadDetail(selectedOnboarding, true);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể thu hồi hồ sơ onboarding.'));
    } finally {
      setIsRevoking(false);
    }
  };

  // Action: Resend Contract
  const handleResendContract = async () => {
    if (!selectedOnboarding || isResendingContract || contractCooldown > 0) return;
    setIsResendingContract(true);

    try {
      await assessorOnboardingService.resendContract(selectedOnboarding.id);
      showToast('Đã gửi lại liên kết ký hợp đồng cho chuyên gia thẩm định.');
      setContractCooldown(60);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể gửi lại liên kết hợp đồng.'));
    } finally {
      setIsResendingContract(false);
    }
  };

  // Action: Resend Password
  const handleResendPassword = async () => {
    if (!selectedOnboarding || isResendingPassword || passwordCooldown > 0) return;
    setIsResendingPassword(true);

    try {
      await assessorOnboardingService.resendPassword(selectedOnboarding.id);
      showToast('Đã gửi lại liên kết thiết lập mật khẩu cho chuyên gia.');
      setPasswordCooldown(60);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể gửi lại liên kết mật khẩu.'));
    } finally {
      setIsResendingPassword(false);
    }
  };

  // Create Invitation Handlers
  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setReloadTrigger((k) => k + 1);
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

  const handleCopyLink = () => {
    if (!createdInvitation) return;
    const fullUrl = createdInvitation.profileLink.startsWith('http')
      ? createdInvitation.profileLink
      : `${window.location.origin}${createdInvitation.profileLink.startsWith('/') ? '' : '/'}${createdInvitation.profileLink}`;

    navigator.clipboard.writeText(fullUrl);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 3000);
  };

  // Determine available actions for detail
  const detailStatus = detailData?.status || selectedOnboarding?.status;
  const canRevoke =
    Boolean(
      detailStatus &&
      (
        [
          AssessorOnboardingStatus.Invited,
          AssessorOnboardingStatus.ProfileSubmitted,
          AssessorOnboardingStatus.AwaitingSignature,
          AssessorOnboardingStatus.AwaitingApproval,
        ] as string[]
      ).includes(detailStatus)
    );

  const canApprove = detailStatus === AssessorOnboardingStatus.AwaitingApproval;
  const canReject =
    detailStatus === AssessorOnboardingStatus.AwaitingApproval ||
    detailStatus === AssessorOnboardingStatus.ApprovalConflict;
  const canResendContract = detailStatus === AssessorOnboardingStatus.AwaitingSignature;
  const canResendPassword = detailStatus === AssessorOnboardingStatus.AwaitingPassword;
  const canViewContract =
    Boolean(
      detailStatus &&
      (
        [
          AssessorOnboardingStatus.AwaitingSignature,
          AssessorOnboardingStatus.AwaitingApproval,
          AssessorOnboardingStatus.ApprovalConflict,
          AssessorOnboardingStatus.AwaitingPassword,
          AssessorOnboardingStatus.Activated,
        ] as string[]
      ).includes(detailStatus)
    );

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-emerald-600 hover:text-emerald-800">
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
              <option value={AssessorOnboardingStatus.AwaitingPassword}>Chờ đặt mật khẩu</option>
              <option value={AssessorOnboardingStatus.Activated}>Đã kích hoạt</option>
              <option value={AssessorOnboardingStatus.Rejected}>Đã từ chối</option>
              <option value={AssessorOnboardingStatus.Revoked}>Đã thu hồi</option>
              <option value={AssessorOnboardingStatus.Expired}>Đã hết hạn</option>
              <option value={AssessorOnboardingStatus.ApprovalConflict}>Xung đột phê duyệt</option>
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
            onClick={() => setReloadTrigger((k) => k + 1)}
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
              onClick={() => setReloadTrigger((k) => k + 1)}
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
                      onClick={() => loadDetail(row)}
                      className={`hover:bg-slate-50/80 transition cursor-pointer ${
                        isSelected ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      {/* Full Name */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {row.fullName || <span className="text-slate-400 font-normal">Chưa cung cấp</span>}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {row.emailNormalized}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                        >
                          {statusCfg.label}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDateTime(row.createdAt)}
                      </td>

                      {/* Submitted At */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDateTime(row.submittedAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadDetail(row);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition inline-flex items-center gap-1.5"
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

              <button
                type="button"
                onClick={handleCloseDetail}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
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
                    onClick={() => loadDetail(selectedOnboarding)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
                  >
                    Thử lại
                  </button>
                </div>
              ) : detailData ? (
                <>
                  {/* Status Banner */}
                  {(() => {
                    const statusCfg = getAssessorOnboardingStatusConfig(detailData.status);
                    return (
                      <div
                        className={`p-4 rounded-xl border flex items-start gap-3 ${statusCfg.bg} ${statusCfg.border}`}
                      >
                        <Info className={`w-5 h-5 shrink-0 mt-0.5 ${statusCfg.text}`} />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border bg-white ${statusCfg.text} ${statusCfg.border}`}>
                              {statusCfg.label}
                            </span>
                            {detailData.autoApprove && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                Tự động phê duyệt: Bật
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 text-xs leading-relaxed">{statusCfg.desc}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Action Buttons Matrix */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-2.5">
                    {canViewContract && (
                      <button
                        type="button"
                        onClick={handleOpenContractPdf}
                        className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-xs transition flex items-center gap-1.5"
                      >
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>Xem hợp đồng PDF</span>
                      </button>
                    )}

                    {canResendContract && (
                      <button
                        type="button"
                        onClick={handleResendContract}
                        disabled={isResendingContract || contractCooldown > 0}
                        className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {contractCooldown > 0
                            ? `Gửi lại hợp đồng (${contractCooldown}s)`
                            : 'Gửi lại link ký hợp đồng'}
                        </span>
                      </button>
                    )}

                    {canResendPassword && (
                      <button
                        type="button"
                        onClick={handleResendPassword}
                        disabled={isResendingPassword || passwordCooldown > 0}
                        className="px-3.5 py-2 text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>
                          {passwordCooldown > 0
                            ? `Gửi lại mật khẩu (${passwordCooldown}s)`
                            : 'Gửi lại link đặt mật khẩu'}
                        </span>
                      </button>
                    )}

                    {canApprove && (
                      <button
                        type="button"
                        onClick={() => setIsApproveConfirmOpen(true)}
                        disabled={isApproving}
                        className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Phê duyệt hồ sơ</span>
                      </button>
                    )}

                    {canReject && (
                      <button
                        type="button"
                        onClick={() => {
                          setRejectReason('');
                          setRejectError(null);
                          setIsRejectModalOpen(true);
                        }}
                        className="px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg shadow-xs transition flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Từ chối hồ sơ</span>
                      </button>
                    )}

                    {canRevoke && (
                      <button
                        type="button"
                        onClick={() => setIsRevokeConfirmOpen(true)}
                        disabled={isRevoking}
                        className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-lg transition flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Thu hồi lời mời</span>
                      </button>
                    )}
                  </div>

                  {/* Two-column grid for Groups 1 and 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Group 1: Hồ sơ */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                        <UserCheck className="w-4 h-4 text-blue-600" />
                        Thông tin hồ sơ
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-500">Họ và tên chuyên gia:</span>
                          <span className="font-semibold text-slate-900 text-right">
                            {detailData.fullName || <span className="text-slate-400 font-normal">Chưa cung cấp</span>}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-500">Email:</span>
                          <span className="font-semibold text-slate-800 text-right">{detailData.emailNormalized}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-500">Trạng thái hồ sơ:</span>
                          <span className="font-semibold text-slate-800 text-right">
                            {getAssessorOnboardingStatusConfig(detailData.status).label}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-500">Ngày tạo lời mời:</span>
                          <span className="font-medium text-slate-700 text-right">
                            {formatDateTime(selectedOnboarding.createdAt)}
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-500">Ngày nộp thông tin:</span>
                          <span className="font-medium text-slate-700 text-right">
                            {formatDateTime(selectedOnboarding.submittedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Group 2: Ký hợp đồng */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                        <FileSignature className="w-4 h-4 text-indigo-600" />
                        Ký hợp đồng điện tử
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-500">Họ tên chữ ký số:</span>
                          <span className="font-semibold text-slate-900 text-right">
                            {detailData.signedName || <span className="text-slate-400 font-normal">Chưa ký</span>}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-500">Thời điểm ký kết:</span>
                          <span className="font-medium text-slate-700 text-right">{formatDateTime(detailData.signedAt)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-500">Xác thực OTP Email:</span>
                          <span className="font-medium text-right">
                            {detailData.emailConfirmedAt ? (
                              <span className="text-emerald-700 font-semibold flex items-center justify-end gap-1">
                                <Check className="w-3.5 h-3.5" />
                                Đã xác thực lúc {formatDateTime(detailData.emailConfirmedAt)}
                              </span>
                            ) : (
                              <span className="text-slate-400">Chưa xác thực</span>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-500">Mở xem hợp đồng:</span>
                          <span className="font-medium text-slate-700 text-right">
                            {formatDateTime(detailData.contractViewedAt)}
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-500">Phiên bản hợp đồng:</span>
                          <span className="font-medium text-slate-700 text-right">{detailData.templateVersion || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Group 3: Phê duyệt */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      Phê duyệt & Xét duyệt
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">Phương thức phê duyệt:</span>
                        <span className="font-semibold text-slate-800 text-right">
                          {detailData.autoApprove ? 'Tự động duyệt qua hệ thống' : 'Quản trị viên phê duyệt thủ công'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500">Thời điểm xét duyệt:</span>
                        <span className="font-medium text-slate-700 text-right">{formatDateTime(detailData.reviewedAt)}</span>
                      </div>
                      {detailData.autoApproveAt && (
                        <div className="flex justify-between py-1 border-b border-slate-50 sm:col-span-2">
                          <span className="text-slate-500">Lịch tự động duyệt dự kiến:</span>
                          <span className="font-medium text-slate-700 text-right">{formatDateTime(detailData.autoApproveAt)}</span>
                        </div>
                      )}
                      <div className="py-1 space-y-1 sm:col-span-2">
                        <span className="text-slate-500 block">Ghi chú / Lý do xét duyệt:</span>
                        <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
                          {detailData.reviewReason || (
                            <span className="text-slate-400 italic">Không có ghi chú thêm</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Group 4: Kích hoạt */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Kích hoạt tài khoản
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Trạng thái kích hoạt:</span>
                        <span className="font-semibold text-right">
                          {detailData.activatedAt ? (
                            <span className="text-emerald-700 flex items-center justify-end gap-1">
                              <Check className="w-3.5 h-3.5" />
                              Đã kích hoạt lúc {formatDateTime(detailData.activatedAt)}
                            </span>
                          ) : (
                            <span className="text-slate-400">Chưa kích hoạt</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
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

      {/* Modal: PDF Viewer */}
      {isPdfModalOpen && (
        <div className="fixed top-16 inset-x-0 bottom-0 z-30 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[calc(100vh-6.5rem)] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Bản hợp đồng điện tử — {selectedOnboarding?.fullName || selectedOnboarding?.emailNormalized}
                </h3>
              </div>
              <button
                onClick={handleClosePdfModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center">
              {isLoadingPdf ? (
                <div className="text-center text-slate-500 space-y-2">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-medium">Đang tải bản hợp đồng PDF...</p>
                </div>
              ) : pdfError ? (
                <div className="p-6 text-center space-y-3 bg-white rounded-2xl border border-red-200 max-w-md shadow-sm">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900">Không thể xem hợp đồng</h4>
                  <p className="text-xs text-slate-600">{pdfError}</p>
                  <button
                    onClick={handleOpenContractPdf}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
                  >
                    Thử tải lại
                  </button>
                </div>
              ) : pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  title="Bản hợp đồng PDF"
                  className="w-full h-full border-none"
                />
              ) : null}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
              <span>Hợp đồng được ký điện tử và lưu trữ bảo mật trên hệ thống UniNet.</span>
              <button
                onClick={handleClosePdfModal}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 rounded-xl transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Approve */}
      {isApproveConfirmOpen && selectedOnboarding && (
        <div className="fixed top-16 inset-x-0 bottom-0 z-30 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900">
                Xác nhận phê duyệt hồ sơ chuyên gia?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hồ sơ đã được ký tên và xác thực email. Phê duyệt sẽ cấp tài khoản thẩm định viên và gửi liên kết đặt mật khẩu cho chuyên gia{' '}
                <strong className="text-slate-900">
                  {selectedOnboarding.fullName || selectedOnboarding.emailNormalized}
                </strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsApproveConfirmOpen(false)}
                disabled={isApproving}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isApproving}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isApproving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isApproving ? 'Đang phê duyệt...' : 'Xác nhận phê duyệt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reject with Reason */}
      {isRejectModalOpen && selectedOnboarding && (
        <div className="fixed top-16 inset-x-0 bottom-0 z-30 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                Từ chối hồ sơ Onboarding
              </h3>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReject} className="space-y-4 text-xs">
              {rejectError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{rejectError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Lý do từ chối hồ sơ <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do chi tiết từ chối hồ sơ..."
                  rows={4}
                  maxLength={2000}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Lý do này sẽ được gửi thông báo đến email chuyên gia.</span>
                  <span>{rejectReason.length}/2000</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  disabled={isSubmittingReject}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReject || !rejectReason.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingReject && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmittingReject ? 'Đang gửi...' : 'Xác nhận từ chối'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Revoke */}
      {isRevokeConfirmOpen && selectedOnboarding && (
        <div className="fixed top-16 inset-x-0 bottom-0 z-30 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900">
                Thu hồi lời mời Onboarding?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hành động này sẽ hủy bỏ hiệu lực của lời mời/hồ sơ của chuyên gia{' '}
                <strong className="text-slate-900">
                  {selectedOnboarding.fullName || selectedOnboarding.emailNormalized}
                </strong>
                . Đường dẫn khai báo hoặc ký hợp đồng sẽ không còn sử dụng được.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRevokeConfirmOpen(false)}
                disabled={isRevoking}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRevoke}
                disabled={isRevoking}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isRevoking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isRevoking ? 'Đang thu hồi...' : 'Xác nhận thu hồi'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Invitation */}
      {isInviteModalOpen && (
        <div className="fixed top-16 inset-x-0 bottom-0 z-30 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Tạo lời mời Onboarding thẩm định viên
              </h2>
              <button onClick={handleCloseInviteModal} className="text-slate-400 hover:text-slate-600">
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
                      value={createdInvitation.profileLink}
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
                    Thời hạn hiệu lực: 7 ngày (hết hạn vào {formatDateTime(createdInvitation.expiresAt)}).
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
