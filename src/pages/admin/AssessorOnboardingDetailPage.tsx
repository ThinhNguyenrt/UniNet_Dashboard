import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  UserCheck,
  ArrowLeft,
  RotateCcw,
  FileText,
  CheckCircle2,
  XCircle,
  Send,
  KeyRound,
  Trash2,
  Shield,
  FileSignature,
  AlertCircle,
  X,
  Check,
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
  ASSESSOR_ONBOARDING_STATUS_CONFIG,
} from '../../types/assessor-onboarding';
import type {
  AssessorOnboardingReviewResponse,
  SessionOnboardingItem,
} from '../../types/assessor-onboarding';

const SESSION_STORAGE_KEY = 'uninet_assessor_onboarding_history';

export const AssessorOnboardingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Data states
  const [detail, setDetail] = useState<AssessorOnboardingReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Mutation loading & cooldown states
  const [isApproving, setIsApproving] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isResendingContract, setIsResendingContract] = useState(false);
  const [isResendingPassword, setIsResendingPassword] = useState(false);
  const [contractCooldown, setContractCooldown] = useState(0);
  const [passwordCooldown, setPasswordCooldown] = useState(0);

  // Modals
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const [isRevokeConfirmOpen, setIsRevokeConfirmOpen] = useState(false);
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);

  // PDF Viewer Modal
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Timer reference for cooldown countdowns
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

  // Save/Update session history
  const updateSessionHistory = useCallback((res: AssessorOnboardingReviewResponse) => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      const parsed: SessionOnboardingItem[] = stored ? JSON.parse(stored) : [];
      const filtered = parsed.filter((item) => item.id.toLowerCase() !== res.id.toLowerCase());
      const updated: SessionOnboardingItem[] = [
        {
          id: res.id,
          email: res.emailNormalized,
          fullName: res.fullName,
          status: res.status,
          updatedAt: new Date().toISOString(),
        },
        ...filtered,
      ].slice(0, 20);
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }, []);

  // Fetch detail
  const fetchDetail = useCallback(
    async (showLoadingSpinner = true) => {
      if (!id) return;
      if (showLoadingSpinner) setIsLoading(true);
      setErrorMessage(null);

      try {
        const res = await assessorOnboardingService.getDetail(id);
        setDetail(res);
        updateSessionHistory(res);
      } catch (err) {
        setErrorMessage(
          getApiErrorMessage(err, 'Không tìm thấy hoặc không thể tải chi tiết hồ sơ onboarding.')
        );
      } finally {
        if (showLoadingSpinner) setIsLoading(false);
      }
    },
    [id, updateSessionHistory]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDetail(true);
  }, [fetchDetail]);

  // Auto-polling every 12 seconds for active pending states
  useEffect(() => {
    if (!detail) return;
    const pendingStatuses: string[] = [
      AssessorOnboardingStatus.Invited,
      AssessorOnboardingStatus.ProfileSubmitted,
      AssessorOnboardingStatus.AwaitingSignature,
      AssessorOnboardingStatus.AwaitingApproval,
      AssessorOnboardingStatus.AwaitingPassword,
    ];

    if (!pendingStatuses.includes(detail.status)) {
      return;
    }

    const intervalId = setInterval(() => {
      if (!document.hidden) {
        fetchDetail(false);
      }
    }, 12000);

    return () => clearInterval(intervalId);
  }, [detail, fetchDetail]);

  // Show Toast
  const showToast = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  // View Contract PDF
  const handleOpenContractPdf = async () => {
    if (!id) return;
    setIsPdfModalOpen(true);
    setIsLoadingPdf(true);
    setPdfError(null);

    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }

    try {
      const blob = await assessorOnboardingService.getContractPdf(id);
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (err) {
      if (err instanceof ContractUnavailableError) {
        setPdfError('Bản hợp đồng chưa được tạo hoặc chưa khả dụng cho hồ sơ này.');
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

  // Approve action
  const handleApprove = async () => {
    if (!id || isApproving) return;
    setIsApproving(true);
    setIsApproveConfirmOpen(false);

    try {
      await assessorOnboardingService.approve(id);
      showToast('Đã phê duyệt hồ sơ thành công! Hệ thống đã cấp tài khoản thẩm định viên.');
      await fetchDetail(false);
    } catch (err) {
      if (err instanceof ApprovalConflictError) {
        alert(
          `Xung đột cấp tài khoản: Email này đã được sử dụng hoặc có xung đột hồ sơ (${err.message}). Trạng thái đã chuyển sang Xung đột (ApprovalConflict).`
        );
        await fetchDetail(false);
      } else {
        alert(getApiErrorMessage(err, 'Không thể phê duyệt hồ sơ onboarding.'));
      }
    } finally {
      setIsApproving(false);
    }
  };

  // Reject action
  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || isSubmittingReject) return;
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
      await assessorOnboardingService.reject(id, cleanReason);
      showToast('Đã từ chối hồ sơ onboarding và gửi thông báo qua email.');
      setIsRejectModalOpen(false);
      setRejectReason('');
      await fetchDetail(false);
    } catch (err) {
      setRejectError(getApiErrorMessage(err, 'Không thể từ chối hồ sơ onboarding.'));
    } finally {
      setIsSubmittingReject(false);
    }
  };

  // Revoke action
  const handleRevoke = async () => {
    if (!id || isRevoking) return;
    setIsRevoking(true);
    setIsRevokeConfirmOpen(false);

    try {
      await assessorOnboardingService.revoke(id);
      showToast('Đã thu hồi lời mời onboarding thành công.');
      await fetchDetail(false);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể thu hồi hồ sơ onboarding.'));
    } finally {
      setIsRevoking(false);
    }
  };

  // Resend Contract action
  const handleResendContract = async () => {
    if (!id || isResendingContract || contractCooldown > 0) return;
    setIsResendingContract(true);

    try {
      await assessorOnboardingService.resendContract(id);
      showToast('Đã gửi lại liên kết ký hợp đồng cho chuyên gia thẩm định.');
      setContractCooldown(60);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể gửi lại liên kết hợp đồng.'));
    } finally {
      setIsResendingContract(false);
    }
  };

  // Resend Password action
  const handleResendPassword = async () => {
    if (!id || isResendingPassword || passwordCooldown > 0) return;
    setIsResendingPassword(true);

    try {
      await assessorOnboardingService.resendPassword(id);
      showToast('Đã gửi lại liên kết thiết lập mật khẩu cho chuyên gia.');
      setPasswordCooldown(60);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể gửi lại liên kết mật khẩu.'));
    } finally {
      setIsResendingPassword(false);
    }
  };

  // Format date helper
  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Chưa có thông tin';
    try {
      return new Date(dateStr).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium">Đang tải thông tin chi tiết hồ sơ onboarding...</p>
      </div>
    );
  }

  if (errorMessage || !detail) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4 text-center py-20">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Không tìm thấy hồ sơ</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          {errorMessage || 'Hồ sơ onboarding không tồn tại hoặc ID không hợp lệ.'}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/admin/assessor-onboardings')}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
          >
            Về trang tra cứu
          </button>
          <button
            onClick={() => fetchDetail(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const statusConfig =
    ASSESSOR_ONBOARDING_STATUS_CONFIG[detail.status] || {
      label: detail.status,
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      desc: 'Trạng thái hiện tại của hồ sơ.',
    };

  // Action permissions based on status
  const canRevoke = (
    [
      AssessorOnboardingStatus.Invited,
      AssessorOnboardingStatus.ProfileSubmitted,
      AssessorOnboardingStatus.AwaitingSignature,
      AssessorOnboardingStatus.AwaitingApproval,
    ] as string[]
  ).includes(detail.status);

  const canApprove = detail.status === AssessorOnboardingStatus.AwaitingApproval;
  const canReject =
    detail.status === AssessorOnboardingStatus.AwaitingApproval ||
    detail.status === AssessorOnboardingStatus.ApprovalConflict;

  const canResendContract = detail.status === AssessorOnboardingStatus.AwaitingSignature;
  const canResendPassword = detail.status === AssessorOnboardingStatus.AwaitingPassword;

  const canViewContract = (
    [
      AssessorOnboardingStatus.AwaitingSignature,
      AssessorOnboardingStatus.AwaitingApproval,
      AssessorOnboardingStatus.ApprovalConflict,
      AssessorOnboardingStatus.AwaitingPassword,
      AssessorOnboardingStatus.Activated,
    ] as string[]
  ).includes(detail.status);

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {actionSuccessMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{actionSuccessMessage}</span>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="ml-2 text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Breadcrumb & Refresh */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/admin/assessor-onboardings')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh mục Onboarding
        </button>

        <button
          onClick={() => fetchDetail(false)}
          className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Làm mới
        </button>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-100 text-slate-700">
                Hồ sơ Onboarding chuyên gia
              </span>
              <span
                className={`text-xs font-bold px-3 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
              >
                {statusConfig.label}
              </span>
              {detail.autoApprove && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Tự động duyệt: Bật
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {detail.fullName || detail.emailNormalized}
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Mã hồ sơ: <span className="font-semibold text-slate-700">{detail.id}</span>
            </p>
          </div>

          {/* Action Buttons Matrix */}
          <div className="flex items-center gap-2 flex-wrap">
            {canViewContract && (
              <button
                type="button"
                onClick={handleOpenContractPdf}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition flex items-center gap-1.5"
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
                className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
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
                className="px-3.5 py-2 text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>
                  {passwordCooldown > 0
                    ? `Gửi lại link mật khẩu (${passwordCooldown}s)`
                    : 'Gửi lại link đặt mật khẩu'}
                </span>
              </button>
            )}

            {canApprove && (
              <button
                type="button"
                onClick={() => setIsApproveConfirmOpen(true)}
                disabled={isApproving}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
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
                className="px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl shadow-xs transition flex items-center gap-1.5"
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
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-xl transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Thu hồi</span>
              </button>
            )}
          </div>
        </div>

        {/* Status helper callout */}
        <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${statusConfig.bg} ${statusConfig.border}`}>
          <Info className={`w-4 h-4 shrink-0 mt-0.5 ${statusConfig.text}`} />
          <div className="space-y-0.5">
            <span className={`font-bold ${statusConfig.text}`}>{statusConfig.label}</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">{statusConfig.desc}</p>
          </div>
        </div>
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Thông tin định danh & Tài khoản */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserCheck className="w-4 h-4 text-blue-600" />
            Thông tin định danh chuyên gia
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Họ và tên chuyên gia:</span>
              <span className="font-semibold text-slate-900">
                {detail.fullName || 'Chưa cập nhật (đang chờ điền)'}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Địa chỉ Email:</span>
              <span className="font-medium text-slate-800">{detail.emailNormalized}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Xác thực OTP Email:</span>
              <span className="font-medium">
                {detail.emailConfirmedAt ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Đã xác thực lúc {formatDateTime(detail.emailConfirmedAt)}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Chưa xác thực</span>
                )}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Tài khoản hệ thống (AccountId):</span>
              <span className="font-medium">
                {detail.accountId ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                    Đã cấp tài khoản
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Chưa cấp</span>
                )}
              </span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Kích hoạt tài khoản:</span>
              <span className="font-medium">
                {detail.activatedAt ? (
                  <span className="text-emerald-700 font-semibold">
                    Đã kích hoạt lúc {formatDateTime(detail.activatedAt)}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Chưa kích hoạt</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Bằng chứng hợp đồng điện tử */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileSignature className="w-4 h-4 text-indigo-600" />
            Bằng chứng ký kết hợp đồng điện tử
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Họ tên chữ ký số:</span>
              <span className="font-semibold text-slate-900">
                {detail.signedName || 'Chưa thực hiện ký'}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Thời điểm ký kết:</span>
              <span className="font-medium text-slate-800">
                {formatDateTime(detail.signedAt)}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Thời điểm chuyên gia mở xem PDF:</span>
              <span className="font-medium text-slate-800">
                {formatDateTime(detail.contractViewedAt)}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Phiên bản mẫu hợp đồng:</span>
              <span className="font-medium text-slate-800">
                {detail.templateVersion || 'Chưa có thông tin'}
              </span>
            </div>

            <div className="space-y-1 py-1">
              <span className="text-slate-400 block">Mã băm toàn vẹn SHA-256:</span>
              {detail.contractSha256 ? (
                <code className="block p-2 bg-slate-50 rounded-lg border border-slate-200 text-[10px] font-mono text-slate-700 break-all select-all">
                  {detail.contractSha256}
                </code>
              ) : (
                <span className="text-slate-400 italic">Chưa tạo hợp đồng</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Thông tin phê duyệt & Xử lý */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 lg:col-span-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-4 h-4 text-purple-600" />
            Thông tin xét duyệt hồ sơ
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-slate-400 block">Phương thức phê duyệt:</span>
              <span className="font-semibold text-slate-800">
                {detail.autoApprove ? 'Tự động duyệt qua Worker' : 'Quản trị viên duyệt thủ công'}
              </span>
              {detail.autoApproveAt && (
                <p className="text-[11px] text-slate-500">
                  Lịch tự duyệt: {formatDateTime(detail.autoApproveAt)}
                </p>
              )}
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-slate-400 block">Thời điểm xét duyệt:</span>
              <span className="font-semibold text-slate-800">
                {formatDateTime(detail.reviewedAt)}
              </span>
              <p className="text-[11px] text-slate-500">
                {detail.reviewedByAccountId
                  ? 'Thực hiện bởi quản trị viên'
                  : detail.reviewedAt
                  ? 'Hệ thống tự động phê duyệt'
                  : 'Chưa xét duyệt'}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 sm:col-span-2 lg:col-span-1">
              <span className="text-slate-400 block">Ghi chú / Lý do kết quả duyệt:</span>
              <span className="font-semibold text-slate-800 block">
                {detail.reviewReason || (
                  <span className="text-slate-400 italic font-normal">Không có ghi chú thêm</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: PDF Viewer */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Bản thảo hợp đồng điện tử - {detail.fullName || detail.emailNormalized}
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
                  <p className="text-xs font-medium">Đang tải bản hợp đồng PDF bảo mật...</p>
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
                  title="Bản thảo hợp đồng PDF"
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
      {isApproveConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900">
                Xác nhận phê duyệt hồ sơ chuyên gia?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hồ sơ đã được ký tên và xác thực email. Phê duyệt sẽ cấp tài khoản thẩm định viên và
                gửi liên kết đặt mật khẩu cho chuyên gia{' '}
                <strong className="text-slate-900">{detail.fullName || detail.emailNormalized}</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsApproveConfirmOpen(false)}
                disabled={isApproving}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isApproving}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isApproving ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Xác nhận phê duyệt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reject Form */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
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

            <form onSubmit={handleReject} className="space-y-3 text-xs">
              {rejectError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{rejectError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do cụ thể gửi đến chuyên gia (ví dụ: Thông tin chữ ký chưa khớp với giấy tờ, vui lòng khai báo lại)..."
                  rows={4}
                  maxLength={2000}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition"
                />
                <p className="text-[11px] text-slate-400">
                  Lưu ý: Lý do này sẽ được gửi trực tiếp qua email cho chuyên gia. Không nhập ghi chú nội bộ.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  disabled={isSubmittingReject}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReject}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingReject ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Xác nhận từ chối</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Revoke */}
      {isRevokeConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900">
                Xác nhận thu hồi lời mời onboarding?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bạn đang chuẩn bị thu hồi hồ sơ onboarding của chuyên gia{' '}
                <strong className="text-slate-900">{detail.emailNormalized}</strong>. Sau khi thu hồi,
                đường dẫn khai báo và hợp đồng hiện tại sẽ bị vô hiệu hóa hoàn toàn.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRevokeConfirmOpen(false)}
                disabled={isRevoking}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleRevoke}
                disabled={isRevoking}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isRevoking ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Xác nhận thu hồi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessorOnboardingDetailPage;
