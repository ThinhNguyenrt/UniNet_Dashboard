import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  FileSignature,
  FileText,
  Info,
  KeyRound,
  Loader2,
  Send,
  Shield,
  Trash2,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import {
  assessorOnboardingService,
  ContractUnavailableError,
  parseOnboardingActionError,
} from '../../services/assessor-onboarding.service';
import { getApiErrorMessage } from '../../services/api';
import {
  AssessorOnboardingStatus,
  canEnableAssessorApprove,
  formatOnboardingDateTime,
  getAssessorOnboardingStatusConfig,
  getMissingApproveRequirements,
} from '../../types/assessor-onboarding';
import type { AssessorOnboardingReviewResponse } from '../../types/assessor-onboarding';

interface AssessorOnboardingDetailViewProps {
  detail: AssessorOnboardingReviewResponse;
  isAdmin: boolean;
  createdAt?: string | null;
  submittedAt?: string | null;
  variant?: 'page' | 'modal';
  onRefreshDetail: () => Promise<AssessorOnboardingReviewResponse | null>;
  onRefreshList?: () => void;
  onNotFound?: (message: string) => void;
  onToast: (message: string) => void;
}

export const AssessorOnboardingDetailView: React.FC<AssessorOnboardingDetailViewProps> = ({
  detail,
  isAdmin,
  createdAt,
  submittedAt,
  variant = 'page',
  onRefreshDetail,
  onRefreshList,
  onNotFound,
  onToast,
}) => {
  // Error banner for action results (409 ApprovalConflict, 409 ONBOARDING_CHANGED, 404, 503, etc.)
  const [actionError, setActionError] = useState<string | null>(null);

  // Mutation loading & cooldown states
  const [isApproving, setIsApproving] = useState(false);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const [isRefreshingAfterTimeout, setIsRefreshingAfterTimeout] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isResendingContract, setIsResendingContract] = useState(false);
  const [isResendingPassword, setIsResendingPassword] = useState(false);
  const [contractCooldown, setContractCooldown] = useState(0);
  const [passwordCooldown, setPasswordCooldown] = useState(0);

  // Confirm Approve modal
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [approveModalError, setApproveModalError] = useState<string | null>(null);

  // Reject modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Revoke modal
  const [isRevokeConfirmOpen, setIsRevokeConfirmOpen] = useState(false);

  // PDF Viewer modal
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    if (contractCooldown <= 0) return;
    const timer = setTimeout(() => setContractCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [contractCooldown]);

  useEffect(() => {
    if (passwordCooldown <= 0) return;
    const timer = setTimeout(() => setPasswordCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [passwordCooldown]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  const statusConfig = getAssessorOnboardingStatusConfig(detail.status);
  const isReviewBusy = isApproving || isSubmittingReject || isRefreshingAfterTimeout;
  const isAnyActionBusy = isReviewBusy || isRevoking;

  // Visibility & enablement rules per spec
  const canShowApprove = isAdmin && detail.status === AssessorOnboardingStatus.AwaitingApproval;
  const hasApprovePrerequisites = canEnableAssessorApprove(detail);
  const missingApproveFields = getMissingApproveRequirements(detail);

  const canShowReject =
    isAdmin &&
    (detail.status === AssessorOnboardingStatus.AwaitingApproval ||
      detail.status === AssessorOnboardingStatus.ApprovalConflict);

  const canRevoke =
    isAdmin &&
    (
      [
        AssessorOnboardingStatus.Invited,
        AssessorOnboardingStatus.ProfileSubmitted,
        AssessorOnboardingStatus.AwaitingSignature,
        AssessorOnboardingStatus.AwaitingApproval,
      ] as string[]
    ).includes(detail.status);

  const canResendContract = isAdmin && detail.status === AssessorOnboardingStatus.AwaitingSignature;
  const canResendPassword = isAdmin && detail.status === AssessorOnboardingStatus.AwaitingPassword;

  const canViewContract = (
    [
      AssessorOnboardingStatus.AwaitingSignature,
      AssessorOnboardingStatus.AwaitingApproval,
      AssessorOnboardingStatus.ApprovalConflict,
      AssessorOnboardingStatus.AwaitingPassword,
      AssessorOnboardingStatus.Activated,
    ] as string[]
  ).includes(detail.status);

  const handleOpenContractPdf = async () => {
    setIsPdfModalOpen(true);
    setIsLoadingPdf(true);
    setPdfError(null);

    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }

    try {
      const blob = await assessorOnboardingService.getContractPdf(detail.id);
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

  const handleOpenApproveModal = () => {
    if (!canShowApprove || !hasApprovePrerequisites || isAnyActionBusy) return;
    setApproveModalError(null);
    setActionError(null);
    setIsApproveConfirmOpen(true);
  };

  const handleApprove = async () => {
    if (!canShowApprove || !hasApprovePrerequisites || isAnyActionBusy) return;
    setIsApproving(true);
    setApproveModalError(null);
    setActionError(null);

    try {
      const result = await assessorOnboardingService.approve(detail.id);
      setIsApproveConfirmOpen(false);
      onToast(
        result.status === AssessorOnboardingStatus.Activated
          ? 'Hồ sơ đã được phê duyệt và kích hoạt trước đó.'
          : 'Phê duyệt hồ sơ thành công! Hệ thống đã đưa email thiết lập mật khẩu vào hàng đợi.'
      );
      onRefreshList?.();
      await onRefreshDetail();
    } catch (err) {
      const parsed = parseOnboardingActionError(err, 'Không thể phê duyệt hồ sơ onboarding.');

      if (parsed.kind === 'timeout') {
        setIsRefreshingAfterTimeout(true);
        const latest = await onRefreshDetail();
        onRefreshList?.();
        setIsRefreshingAfterTimeout(false);

        if (latest && latest.status !== AssessorOnboardingStatus.AwaitingApproval) {
          setIsApproveConfirmOpen(false);
          if (
            latest.status === AssessorOnboardingStatus.AwaitingPassword ||
            latest.status === AssessorOnboardingStatus.Activated
          ) {
            onToast('Yêu cầu bị timeout nhưng hồ sơ đã được phê duyệt trên hệ thống.');
          } else if (latest.status === AssessorOnboardingStatus.ApprovalConflict) {
            setActionError('Email đã được đăng ký. Hồ sơ chưa được phê duyệt.');
          } else {
            setActionError('Yêu cầu bị timeout. Trạng thái hồ sơ đã thay đổi và được đồng bộ lại.');
          }
        } else {
          setApproveModalError(
            'Kết nối quá thời gian chờ. Hệ thống đã đọc lại trạng thái hồ sơ mới nhất, bạn có thể thử gửi lại.'
          );
        }
        return;
      }

      if (parsed.kind === 'approval_conflict') {
        setIsApproveConfirmOpen(false);
        setActionError('Email đã được đăng ký. Hồ sơ chưa được phê duyệt.');
        onRefreshList?.();
        await onRefreshDetail();
        return;
      }

      if (parsed.kind === 'onboarding_changed') {
        setIsApproveConfirmOpen(false);
        setActionError(parsed.message);
        onRefreshList?.();
        await onRefreshDetail();
        return;
      }

      if (parsed.kind === 'not_found') {
        setIsApproveConfirmOpen(false);
        setActionError(parsed.message);
        onRefreshList?.();
        onNotFound?.(parsed.message);
        return;
      }

      setApproveModalError(parsed.message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleOpenRejectModal = () => {
    if (!canShowReject || isAnyActionBusy) return;
    setRejectReason('');
    setRejectError(null);
    setActionError(null);
    setIsRejectModalOpen(true);
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canShowReject || isAnyActionBusy) return;

    const cleanReason = rejectReason.trim();
    if (cleanReason.length < 1) {
      setRejectError('Vui lòng nhập lý do từ chối hồ sơ (từ 1 đến 2.000 ký tự).');
      return;
    }
    if (cleanReason.length > 2000) {
      setRejectError('Lý do từ chối không được vượt quá 2.000 ký tự sau khi loại bỏ khoảng trắng.');
      return;
    }

    setIsSubmittingReject(true);
    setRejectError(null);
    setActionError(null);

    try {
      await assessorOnboardingService.reject(detail.id, cleanReason);
      setIsRejectModalOpen(false);
      setRejectReason('');
      setRejectError(null);
      onToast('Đã từ chối hồ sơ onboarding và xếp email thông báo vào hàng đợi.');
      onRefreshList?.();
      await onRefreshDetail();
    } catch (err) {
      const parsed = parseOnboardingActionError(err, 'Không thể từ chối hồ sơ onboarding.');

      if (parsed.kind === 'invalid_reason') {
        setRejectError(parsed.message);
        return;
      }

      if (parsed.kind === 'timeout') {
        setIsRefreshingAfterTimeout(true);
        const latest = await onRefreshDetail();
        onRefreshList?.();
        setIsRefreshingAfterTimeout(false);

        const stillRejectable =
          latest &&
          (latest.status === AssessorOnboardingStatus.AwaitingApproval ||
            latest.status === AssessorOnboardingStatus.ApprovalConflict);

        if (latest && !stillRejectable) {
          setIsRejectModalOpen(false);
          if (latest.status === AssessorOnboardingStatus.Rejected) {
            onToast('Yêu cầu bị timeout nhưng hồ sơ đã chuyển sang trạng thái Đã từ chối.');
          } else {
            setActionError('Yêu cầu bị timeout. Trạng thái hồ sơ đã thay đổi và được đồng bộ lại.');
          }
        } else {
          setRejectError(
            'Kết nối quá thời gian chờ. Hệ thống đã đọc lại trạng thái mới nhất, bạn có thể thử gửi lại.'
          );
        }
        return;
      }

      if (parsed.kind === 'onboarding_changed') {
        setIsRejectModalOpen(false);
        setActionError(parsed.message);
        onRefreshList?.();
        await onRefreshDetail();
        return;
      }

      if (parsed.kind === 'not_found') {
        setIsRejectModalOpen(false);
        setActionError(parsed.message);
        onRefreshList?.();
        onNotFound?.(parsed.message);
        return;
      }

      // Recoverable error (503 CONTRACTS_DISABLED, 401/403, generic): keep reason in modal
      setRejectError(parsed.message);
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const handleRevoke = async () => {
    if (!canRevoke || isAnyActionBusy) return;
    setIsRevoking(true);
    setActionError(null);

    try {
      await assessorOnboardingService.revoke(detail.id);
      setIsRevokeConfirmOpen(false);
      onToast('Đã thu hồi lời mời onboarding thành công.');
      onRefreshList?.();
      await onRefreshDetail();
    } catch (err) {
      setIsRevokeConfirmOpen(false);
      const parsed = parseOnboardingActionError(err, 'Không thể thu hồi hồ sơ onboarding.');
      setActionError(parsed.message);
      if (parsed.kind === 'not_found' || parsed.kind === 'onboarding_changed') {
        onRefreshList?.();
        if (parsed.kind === 'onboarding_changed') await onRefreshDetail();
        if (parsed.kind === 'not_found') onNotFound?.(parsed.message);
      }
    } finally {
      setIsRevoking(false);
    }
  };

  const handleResendContract = async () => {
    if (!canResendContract || isResendingContract || contractCooldown > 0) return;
    setIsResendingContract(true);
    setActionError(null);

    try {
      await assessorOnboardingService.resendContract(detail.id);
      onToast('Đã gửi lại liên kết ký hợp đồng cho chuyên gia thẩm định.');
      setContractCooldown(60);
    } catch (err) {
      const parsed = parseOnboardingActionError(err, 'Không thể gửi lại liên kết hợp đồng.');
      setActionError(parsed.message);
    } finally {
      setIsResendingContract(false);
    }
  };

  const handleResendPassword = async () => {
    if (!canResendPassword || isResendingPassword || passwordCooldown > 0) return;
    setIsResendingPassword(true);
    setActionError(null);

    try {
      await assessorOnboardingService.resendPassword(detail.id);
      onToast('Đã gửi lại liên kết thiết lập mật khẩu cho chuyên gia.');
      setPasswordCooldown(60);
    } catch (err) {
      const parsed = parseOnboardingActionError(err, 'Không thể gửi lại liên kết mật khẩu.');
      setActionError(parsed.message);
    } finally {
      setIsResendingPassword(false);
    }
  };

  const trimmedReasonLength = rejectReason.trim().length;
  const isReasonOverLimit = trimmedReasonLength > 2000;

  return (
    <div className="space-y-5">
      {/* Inline Action Error Banner */}
      {actionError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-red-500 hover:text-red-700 shrink-0"
            aria-label="Đóng thông báo lỗi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Status Callout Banner */}
      <div className={`p-4 rounded-xl border flex items-start gap-3 ${statusConfig.bg} ${statusConfig.border}`}>
        <Info className={`w-5 h-5 shrink-0 mt-0.5 ${statusConfig.text}`} />
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border bg-white ${statusConfig.text} ${statusConfig.border}`}
            >
              {statusConfig.label}
            </span>
            {detail.autoApprove && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                Tự động phê duyệt: Bật
              </span>
            )}
          </div>
          <p className="text-slate-600 text-xs leading-relaxed">{statusConfig.desc}</p>

          {detail.status === AssessorOnboardingStatus.ApprovalConflict && (
            <p className="text-rose-700 text-xs font-medium pt-1">
              Email <span className="font-semibold">{detail.emailNormalized}</span> đã được đăng ký tài khoản trên hệ thống. Hồ sơ này không thể phê duyệt; bạn có thể từ chối hồ sơ bên dưới.
            </p>
          )}

          {detail.status === AssessorOnboardingStatus.Rejected && detail.reviewReason && (
            <div className="mt-2 p-2.5 rounded-lg bg-white/80 border border-red-200 text-xs text-red-800">
              <span className="font-semibold">Lý do từ chối: </span>
              <span className="whitespace-pre-wrap break-words">{detail.reviewReason}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Matrix */}
      {(canViewContract || canResendContract || canResendPassword || canShowApprove || canShowReject || canRevoke) && (
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
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
                disabled={isResendingContract || contractCooldown > 0 || isAnyActionBusy}
                className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={isResendingPassword || passwordCooldown > 0 || isAnyActionBusy}
                className="px-3.5 py-2 text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>
                  {passwordCooldown > 0
                    ? `Gửi lại mật khẩu (${passwordCooldown}s)`
                    : 'Gửi lại link thiết lập mật khẩu'}
                </span>
              </button>
            )}

            {canShowApprove && (
              <button
                type="button"
                onClick={handleOpenApproveModal}
                disabled={!hasApprovePrerequisites || isAnyActionBusy}
                title={
                  !hasApprovePrerequisites
                    ? `Chưa đủ điều kiện phê duyệt: thiếu ${missingApproveFields.join(', ')}`
                    : undefined
                }
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApproving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Phê duyệt</span>
              </button>
            )}

            {canShowReject && (
              <button
                type="button"
                onClick={handleOpenRejectModal}
                disabled={isAnyActionBusy}
                className="px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingReject ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>Từ chối</span>
              </button>
            )}

            {canRevoke && (
              <button
                type="button"
                onClick={() => setIsRevokeConfirmOpen(true)}
                disabled={isAnyActionBusy}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-lg transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Thu hồi</span>
              </button>
            )}
          </div>

          {canShowApprove && !hasApprovePrerequisites && (
            <div className="flex items-start gap-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Nút <strong>Phê duyệt</strong> đang bị khóa do hồ sơ chưa đủ thông tin bắt buộc:{' '}
                {missingApproveFields.join(', ')}.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Detail Cards Grid */}
      <div className={`grid grid-cols-1 ${variant === 'page' ? 'lg:grid-cols-2 gap-6' : 'md:grid-cols-2 gap-4'}`}>
        {/* Card 1: Thông tin hồ sơ */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <UserCheck className="w-4 h-4 text-blue-600" />
            Thông tin hồ sơ
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between gap-4 py-1 border-b border-slate-50">
              <span className="text-slate-500 shrink-0">Họ và tên chuyên gia:</span>
              <span className="font-semibold text-slate-900 text-right">
                {detail.fullName || <span className="text-slate-400 font-normal">Chưa cung cấp</span>}
              </span>
            </div>
            <div className="flex justify-between gap-4 py-1 border-b border-slate-50">
              <span className="text-slate-500 shrink-0">Email:</span>
              <span className="font-semibold text-slate-800 text-right break-all">{detail.emailNormalized}</span>
            </div>
            <div className="flex justify-between gap-4 py-1 border-b border-slate-50">
              <span className="text-slate-500 shrink-0">Trạng thái hồ sơ:</span>
              <span className="font-semibold text-slate-800 text-right">{statusConfig.label}</span>
            </div>
            {createdAt !== undefined && (
              <div className="flex justify-between gap-4 py-1 border-b border-slate-50">
                <span className="text-slate-500 shrink-0">Ngày tạo lời mời:</span>
                <span className="font-medium text-slate-700 text-right">{formatOnboardingDateTime(createdAt)}</span>
              </div>
            )}
            {submittedAt !== undefined && (
              <div className="flex justify-between gap-4 py-1 border-b border-slate-50">
                <span className="text-slate-500 shrink-0">Ngày nộp thông tin:</span>
                <span className="font-medium text-slate-700 text-right">{formatOnboardingDateTime(submittedAt)}</span>
              </div>
            )}
            <div className="flex justify-between gap-4 py-1 border-b border-slate-50">
              <span className="text-slate-500 shrink-0">Tài khoản thẩm định viên (ID):</span>
              <span className="font-mono text-[11px] text-slate-700 text-right break-all">
                {detail.accountId || '—'}
              </span>
            </div>
            <div className="flex justify-between gap-4 py-1">
              <span className="text-slate-500 shrink-0">Kích hoạt tài khoản:</span>
              <span className="font-medium text-right">
                {detail.activatedAt ? (
                  <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Đã kích hoạt lúc {formatOnboardingDateTime(detail.activatedAt)}
                  </span>
                ) : (
                  <span className="text-slate-400">Chưa kích hoạt</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Bằng chứng hợp đồng điện tử */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <FileSignature className="w-4 h-4 text-indigo-600" />
            Ký hợp đồng điện tử
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between gap-4 py-1 border-b border-slate-50">
              <span className="text-slate-500 shrink-0">Họ tên chữ ký số:</span>
              <span className="font-semibold text-slate-900 text-right">
                {detail.signedName || <span className="text-slate-400 font-normal">Chưa ký</span>}
              </span>
            </div>
            <div className="flex justify-between gap-4 py-1 border-b border-slate-50">
              <span className="text-slate-500 shrink-0">Thời điểm ký kết:</span>
              <span className="font-medium text-slate-700 text-right">
                {formatOnboardingDateTime(detail.signedAt)}
              </span>
            </div>
            <div className="flex justify-between gap-4 py-1 border-b border-slate-50">
              <span className="text-slate-500 shrink-0">Xác thực Email:</span>
              <span className="font-medium text-right">
                {detail.emailConfirmedAt ? (
                  <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Đã xác thực lúc {formatOnboardingDateTime(detail.emailConfirmedAt)}
                  </span>
                ) : (
                  <span className="text-slate-400">Chưa xác thực</span>
                )}
              </span>
            </div>
            <div className="flex justify-between gap-4 py-1 border-b border-slate-50">
              <span className="text-slate-500 shrink-0">Mở xem hợp đồng:</span>
              <span className="font-medium text-slate-700 text-right">
                {formatOnboardingDateTime(detail.contractViewedAt)}
              </span>
            </div>
            <div className="flex justify-between gap-4 py-1 border-b border-slate-50">
              <span className="text-slate-500 shrink-0">Phiên bản hợp đồng:</span>
              <span className="font-medium text-slate-700 text-right">{detail.templateVersion || '—'}</span>
            </div>
            <div className="py-1 space-y-1">
              <span className="text-slate-500 block">Mã băm hợp đồng (SHA-256):</span>
              <code className="block p-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 break-all">
                {detail.contractSha256 || 'Chưa có'}
              </code>
            </div>
          </div>
        </div>

        {/* Card 3: Phê duyệt & Xét duyệt */}
        <div
          className={`bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 ${
            variant === 'page' ? 'lg:col-span-2' : 'md:col-span-2'
          }`}
        >
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Shield className="w-4 h-4 text-purple-600" />
            Phê duyệt & Xét duyệt
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 block">Phương thức phê duyệt:</span>
              <span className="font-semibold text-slate-800 block">
                {detail.autoApprove ? 'Tự động duyệt qua hệ thống' : 'Quản trị viên phê duyệt thủ công'}
              </span>
              {detail.autoApproveAt && (
                <p className="text-[11px] text-slate-500">
                  Lịch tự duyệt dự kiến: {formatOnboardingDateTime(detail.autoApproveAt)}
                </p>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 block">Thời điểm xét duyệt:</span>
              <span className="font-semibold text-slate-800 block">
                {formatOnboardingDateTime(detail.reviewedAt)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 block">Người xét duyệt (Account ID):</span>
              <span className="font-mono text-[11px] text-slate-700 block break-all">
                {detail.reviewedByAccountId || '—'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 sm:col-span-2 lg:col-span-3">
              <span className="text-slate-500 block">Ghi chú / Lý do xét duyệt:</span>
              <p className="font-medium text-slate-800 whitespace-pre-wrap break-words">
                {detail.reviewReason === 'EMAIL_ALREADY_REGISTERED'
                  ? 'EMAIL_ALREADY_REGISTERED — Email đã được đăng ký tài khoản trên hệ thống.'
                  : detail.reviewReason || (
                      <span className="text-slate-400 italic font-normal">Không có ghi chú thêm</span>
                    )}
              </p>
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
                  Bản hợp đồng điện tử — {detail.fullName || detail.emailNormalized}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClosePdfModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
                aria-label="Đóng xem hợp đồng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center">
              {isLoadingPdf ? (
                <div className="text-center text-slate-500 space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  <p className="text-xs font-medium">Đang tải bản hợp đồng PDF...</p>
                </div>
              ) : pdfError ? (
                <div className="p-6 text-center space-y-3 bg-white rounded-2xl border border-red-200 max-w-md shadow-sm">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900">Không thể xem hợp đồng</h4>
                  <p className="text-xs text-slate-600">{pdfError}</p>
                  <button
                    type="button"
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
                type="button"
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
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isReviewBusy) {
              setIsApproveConfirmOpen(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900">
                Xác nhận phê duyệt hồ sơ thẩm định viên?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                UniNet sẽ tạo tài khoản thẩm định viên và đưa email thiết lập mật khẩu vào hàng đợi cho chuyên gia{' '}
                <strong className="text-slate-900">{detail.fullName || detail.emailNormalized}</strong>.
              </p>
            </div>

            {approveModalError && (
              <div
                role="alert"
                className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{approveModalError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsApproveConfirmOpen(false)}
                disabled={isReviewBusy}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isReviewBusy}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isReviewBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {isRefreshingAfterTimeout
                    ? 'Đang kiểm tra lại trạng thái...'
                    : isApproving
                    ? 'Đang phê duyệt...'
                    : 'Xác nhận phê duyệt'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reject with Reason */}
      {isRejectModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isReviewBusy) {
              setIsRejectModalOpen(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                Từ chối hồ sơ Onboarding
              </h3>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                disabled={isReviewBusy}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
                aria-label="Đóng modal từ chối"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReject} className="space-y-4 text-xs" noValidate>
              <div className="space-y-1.5">
                <label htmlFor="assessor-reject-reason" className="font-semibold text-slate-700 block">
                  Lý do từ chối hồ sơ <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="assessor-reject-reason"
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    if (rejectError) setRejectError(null);
                  }}
                  disabled={isReviewBusy}
                  placeholder="Nhập lý do chi tiết từ chối hồ sơ..."
                  rows={4}
                  aria-invalid={Boolean(rejectError || isReasonOverLimit)}
                  className={`w-full p-3 bg-slate-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 transition disabled:opacity-60 ${
                    rejectError || isReasonOverLimit
                      ? 'border-red-400 focus:ring-red-500/20 focus:border-red-600'
                      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-600'
                  }`}
                />
                {rejectError && (
                  <div
                    role="alert"
                    className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{rejectError}</span>
                  </div>
                )}
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Lý do này sẽ được gửi thông báo đến email chuyên gia.</span>
                  <span className={isReasonOverLimit ? 'text-red-600 font-semibold' : ''}>
                    {trimmedReasonLength}/2000
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  disabled={isReviewBusy}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isReviewBusy}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isReviewBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {isRefreshingAfterTimeout
                      ? 'Đang kiểm tra lại trạng thái...'
                      : isSubmittingReject
                      ? 'Đang gửi...'
                      : 'Xác nhận từ chối'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Revoke */}
      {isRevokeConfirmOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isRevoking) {
              setIsRevokeConfirmOpen(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
        >
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
                <strong className="text-slate-900">{detail.fullName || detail.emailNormalized}</strong>.
                Đường dẫn khai báo hoặc ký hợp đồng sẽ không còn sử dụng được.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRevokeConfirmOpen(false)}
                disabled={isRevoking}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition disabled:opacity-50"
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
    </div>
  );
};

