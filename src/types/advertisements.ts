export const CampaignStatus = {
  Draft: 0,
  PendingModeration: 1,
  PendingPayment: 2,
  Active: 3,
  Completed: 4,
  Rejected: 5,
} as const;

export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

export interface CampaignStatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
}

export const CAMPAIGN_STATUS_CONFIG: Record<CampaignStatus, CampaignStatusConfig> = {
  [CampaignStatus.Draft]: {
    label: 'Bản nháp',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
  },
  [CampaignStatus.PendingModeration]: {
    label: 'Chờ kiểm duyệt',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  [CampaignStatus.PendingPayment]: {
    label: 'Chờ thanh toán',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  [CampaignStatus.Active]: {
    label: 'Đang chạy',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  [CampaignStatus.Completed]: {
    label: 'Đã kết thúc',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
  },
  [CampaignStatus.Rejected]: {
    label: 'Bị từ chối',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
};

export function getCampaignStatusConfig(status?: number | null): CampaignStatusConfig {
  if (status !== undefined && status !== null && status in CAMPAIGN_STATUS_CONFIG) {
    return CAMPAIGN_STATUS_CONFIG[status as CampaignStatus];
  }
  return {
    label: 'Không xác định',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
  };
}

export interface CampaignResponse {
  id: string;
  companyUserId: string;
  companyName: string;
  packageId: string | null;
  packageName: string | null;
  title: string;
  content: string;
  destinationUrl: string;
  mediaUrl: string | null;
  status: CampaignStatus;
  budgetCap: number;
  rejectionReason: string | null;
  impressionCount: number;
  clickCount: number;
  startedAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignsResponse {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  campaigns: CampaignResponse[];
}

export interface ModerateCampaignRequest {
  isApproved: boolean;
  reason: string | null;
}

/**
 * Kiểm tra an toàn liên kết đích: Chỉ chấp nhận giao thức http: hoặc https:
 */
export const isSafeHttpUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};
