export const AssessorOnboardingStatus = {
  Invited: 'Invited',
  ProfileSubmitted: 'ProfileSubmitted',
  AwaitingSignature: 'AwaitingSignature',
  AwaitingApproval: 'AwaitingApproval',
  ApprovalConflict: 'ApprovalConflict',
  AwaitingPassword: 'AwaitingPassword',
  Activated: 'Activated',
  Rejected: 'Rejected',
  Revoked: 'Revoked',
  Expired: 'Expired',
} as const;
export type AssessorOnboardingStatus =
  (typeof AssessorOnboardingStatus)[keyof typeof AssessorOnboardingStatus];

export const ASSESSOR_ONBOARDING_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  [AssessorOnboardingStatus.Invited]: {
    label: 'Đã gửi lời mời',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    desc: 'Hồ sơ vừa được khởi tạo, đang chờ chuyên gia thẩm định mở link điền thông tin.',
  },
  [AssessorOnboardingStatus.ProfileSubmitted]: {
    label: 'Đã nộp hồ sơ',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    desc: 'Chuyên gia đã nộp thông tin cá nhân. Hệ thống đang tạo bản thảo hợp đồng.',
  },
  [AssessorOnboardingStatus.AwaitingSignature]: {
    label: 'Chờ ký hợp đồng',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    desc: 'Hợp đồng đã sẵn sàng. Đang chờ chuyên gia thẩm định ký điện tử.',
  },
  [AssessorOnboardingStatus.AwaitingApproval]: {
    label: 'Chờ phê duyệt',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    desc: 'Hợp đồng đã được ký và email đã xác thực. Đang chờ Admin xem xét phê duyệt.',
  },
  [AssessorOnboardingStatus.ApprovalConflict]: {
    label: 'Xung đột phê duyệt',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    desc: 'Email đã được đăng ký tài khoản hoặc có xung đột hồ sơ mở khác. Không thể phê duyệt; cần từ chối hồ sơ hoặc xử lý tài khoản trùng trước.',
  },
  [AssessorOnboardingStatus.AwaitingPassword]: {
    label: 'Chờ thiết lập mật khẩu',
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    desc: 'Đã phê duyệt và cấp tài khoản. Đang chờ chuyên gia hoàn tất thiết lập mật khẩu để kích hoạt.',
  },
  [AssessorOnboardingStatus.Activated]: {
    label: 'Đã kích hoạt',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    desc: 'Quy trình onboarding hoàn tất thành công. Chuyên gia đã sẵn sàng nhận thẩm định.',
  },
  [AssessorOnboardingStatus.Rejected]: {
    label: 'Đã từ chối',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    desc: 'Hồ sơ đã bị từ chối bởi Admin kèm theo lý do cụ thể gửi qua email.',
  },
  [AssessorOnboardingStatus.Revoked]: {
    label: 'Đã thu hồi',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
    desc: 'Lời mời hoặc hồ sơ đã bị Admin chủ động thu hồi.',
  },
  [AssessorOnboardingStatus.Expired]: {
    label: 'Đã hết hạn',
    bg: 'bg-zinc-100',
    text: 'text-zinc-600',
    border: 'border-zinc-300',
    desc: 'Lời mời đã quá thời hạn hiệu lực 7 ngày mà chưa hoàn tất.',
  },
};

export function getAssessorOnboardingStatusConfig(status?: string | null): {
  label: string;
  bg: string;
  text: string;
  border: string;
  desc: string;
} {
  if (!status) {
    return {
      label: 'Chưa xác định',
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      desc: 'Trạng thái chưa được xác định.',
    };
  }
  return (
    ASSESSOR_ONBOARDING_STATUS_CONFIG[status] || {
      label: status,
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      desc: 'Trạng thái hồ sơ.',
    }
  );
}

export interface AssessorOnboardingListItem {
  id: string;
  emailNormalized: string;
  fullName: string | null;
  status: string;
  accountId: string | null;
  autoApprove: boolean;
  createdAt: string | null;
  submittedAt: string | null;
  signedAt: string | null;
  autoApproveAt: string | null;
  reviewedByAccountId: string | null;
  reviewedAt: string | null;
  reviewReason: string | null;
  activatedAt: string | null;
}

export interface AssessorOnboardingsListResponse {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onboardings: AssessorOnboardingListItem[];
}

export interface AssessorOnboardingFilter {
  keyword?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface AssessorOnboardingReviewResponse {
  id: string;
  emailNormalized: string;
  fullName: string | null;
  status: string;
  accountId: string | null;
  autoApprove: boolean;
  autoApproveAt: string | null;
  signedName: string | null;
  signedAt: string | null;
  emailConfirmedAt: string | null;
  contractViewedAt: string | null;
  templateVersion: string | null;
  contractSha256: string | null;
  reviewedByAccountId: string | null;
  reviewedAt: string | null;
  reviewReason: string | null;
  activatedAt: string | null;
}

export interface CreateAssessorInvitationRequest {
  email: string;
  autoApprove: boolean;
}

export interface AssessorInvitationResponse {
  id: string;
  email: string;
  expiresAt: string;
  profileLink: string;
}

export interface RejectAssessorRequest {
  reason: string;
}

export interface AssessorReviewResult {
  id: string;
  status: string;
  accountId: string | null;
  reviewedByAccountId: string | null;
  reviewedAt: string | null;
  reviewReason: string | null;
}

export interface SessionOnboardingItem {
  id: string;
  email: string;
  fullName: string | null;
  status: string;
  updatedAt: string;
}

export function getMissingApproveRequirements(
  detail: AssessorOnboardingReviewResponse | null | undefined
): string[] {
  if (!detail) return [];
  const missing: string[] = [];
  if (!detail.fullName?.trim()) missing.push('họ và tên (fullName)');
  if (!detail.signedName?.trim()) missing.push('tên chữ ký (signedName)');
  if (!detail.signedAt) missing.push('thời điểm ký (signedAt)');
  if (!detail.emailConfirmedAt) missing.push('xác thực email (emailConfirmedAt)');
  if (!detail.contractSha256?.trim()) missing.push('mã băm hợp đồng (contractSha256)');
  return missing;
}

export function canEnableAssessorApprove(
  detail: AssessorOnboardingReviewResponse | null | undefined
): boolean {
  if (!detail || detail.status !== AssessorOnboardingStatus.AwaitingApproval) {
    return false;
  }
  return getMissingApproveRequirements(detail).length === 0;
}

export function formatOnboardingDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date);
}
