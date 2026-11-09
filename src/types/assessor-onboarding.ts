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
    label: 'Đã tạo lời mời',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    desc: 'Hồ sơ vừa được khởi tạo, đang chờ chuyên gia thẩm định mở link điền thông tin.',
  },
  [AssessorOnboardingStatus.ProfileSubmitted]: {
    label: 'Đã nộp, chờ hợp đồng',
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
    label: 'Chờ duyệt',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    desc: 'Hợp đồng đã được ký và email đã xác thực. Đang chờ Admin xem xét phê duyệt.',
  },
  [AssessorOnboardingStatus.ApprovalConflict]: {
    label: 'Xung đột cấp tài khoản',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    desc: 'Email đã tồn tại tài khoản hoặc hồ sơ khác. Cần từ chối hoặc xử lý hồ sơ cũ trước.',
  },
  [AssessorOnboardingStatus.AwaitingPassword]: {
    label: 'Chờ đặt mật khẩu',
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    desc: 'Đã phê duyệt và cấp tài khoản. Đang chờ chuyên gia hoàn tất kích hoạt mật khẩu.',
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
