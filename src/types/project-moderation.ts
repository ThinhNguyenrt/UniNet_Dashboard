/**
 * Types & Constants for Project Moderation
 * Khớp với hợp đồng backend UniNet.Application và UniNet.Domain.Enums
 */

export const ModerationCheckResult = {
  Pending: 0,
  Passed: 1,
  Failed: 2,
  Error: 3,
} as const;
export type ModerationCheckResult =
  (typeof ModerationCheckResult)[keyof typeof ModerationCheckResult];

export const moderationCheckResultLabels: Record<ModerationCheckResult, string> = {
  [ModerationCheckResult.Pending]: 'Chờ kiểm tra',
  [ModerationCheckResult.Passed]: 'Đạt',
  [ModerationCheckResult.Failed]: 'Không đạt',
  [ModerationCheckResult.Error]: 'Lỗi kiểm tra',
};

export const getModerationCheckResultLabel = (result: unknown): string => {
  if (result === null || result === undefined) {
    return 'Chưa có';
  }
  if (typeof result === 'number' && result in moderationCheckResultLabels) {
    return moderationCheckResultLabels[result as ModerationCheckResult];
  }
  return 'Chưa rõ';
};

export const getModerationCheckResultBadgeClass = (result: unknown): string => {
  switch (result) {
    case ModerationCheckResult.Passed:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case ModerationCheckResult.Failed:
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case ModerationCheckResult.Error:
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case ModerationCheckResult.Pending:
      return 'bg-sky-50 text-sky-700 border-sky-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export const ProjectModerationStatus = {
  Pending: 0,
  Processing: 1,
  ReviewRequired: 2,
  Approved: 3,
  Rejected: 4,
  Error: 5,
  Passed: 6,
  NeedsEvidence: 7,
} as const;
export type ProjectModerationStatus =
  (typeof ProjectModerationStatus)[keyof typeof ProjectModerationStatus];

export const projectModerationStatusLabels: Record<ProjectModerationStatus, string> = {
  [ProjectModerationStatus.Pending]: 'Đang chờ xử lý',
  [ProjectModerationStatus.Processing]: 'Đang xử lý',
  [ProjectModerationStatus.ReviewRequired]: 'Cần kiểm duyệt',
  [ProjectModerationStatus.Approved]: 'Đã duyệt',
  [ProjectModerationStatus.Rejected]: 'Đã từ chối',
  [ProjectModerationStatus.Error]: 'Lỗi kiểm tra',
  [ProjectModerationStatus.Passed]: 'Đã thông qua',
  [ProjectModerationStatus.NeedsEvidence]: 'Cần minh chứng',
};

export const ProjectHubStatus = {
  Pending: 0,
  Active: 1,
  Completed: 2,
  Rejected: 3,
} as const;
export type ProjectHubStatus =
  (typeof ProjectHubStatus)[keyof typeof ProjectHubStatus];

export const projectHubStatusLabels: Record<ProjectHubStatus, string> = {
  [ProjectHubStatus.Pending]: 'Chờ duyệt',
  [ProjectHubStatus.Active]: 'Đang hoạt động',
  [ProjectHubStatus.Completed]: 'Đã hoàn thành',
  [ProjectHubStatus.Rejected]: 'Đã từ chối',
};

export const getProjectHubStatusLabel = (status: unknown): string => {
  if (typeof status === 'number' && status in projectHubStatusLabels) {
    return projectHubStatusLabels[status as ProjectHubStatus];
  }
  return 'Chưa rõ';
};

export interface CreatorInfo {
  id: string;
  fullName: string;
  nickname?: string | null;
  avatarUrl?: string | null;
}

export interface RoleRequirementInfo {
  id: string;
  roleName: string;
  quantity: number;
  requirements?: string | null;
}

export interface ProjectSkillInfo {
  skillId: string;
  skillName: string;
  category?: string | null;
  iconUrl?: string | null;
  minLevel?: number | null;
}

export interface ProjectDetail {
  id: string;
  title: string;
  projectField?: string | null;
  description?: string | null;
  status?: ProjectHubStatus | number | null;
  memberTarget?: number | null;
  minimumQuantity?: number | null;
  currentMemberCount?: number;
  createdAt?: string;
  updatedAt?: string;
  creator: CreatorInfo;
  roleRequirements: RoleRequirementInfo[];
  skills: ProjectSkillInfo[];
}

export interface ProjectModerationRecord {
  id: string;
  attemptNumber: number;
  status: ProjectModerationStatus;
  contentResult?: ModerationCheckResult | null;
  linkResult?: ModerationCheckResult | null;
  confidence?: number | null;
  violationReason?: string | null;
  checkedAt?: string | null;
  reviewedAt?: string | null;
}

export interface PendingProjectModerationItem {
  project: ProjectDetail;
  moderation: ProjectModerationRecord;
  resultJson?: string | null;
  submittedAt: string;
}

export interface PendingProjectModerationsResponse {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  projects: PendingProjectModerationItem[];
}

export interface ReviewProjectRequest {
  reviewNote?: string | null;
}

export interface ProjectModerationApiError {
  status?: number;
  code?: string;
  message: string;
  isNetworkOrTimeout?: boolean;
}

/**
 * Biểu thức chính quy phát hiện UUID hệ thống để che giấu
 */
const UUID_REGEX = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;

/**
 * Loại bỏ / che UUID trong chuỗi văn bản trước khi render ra giao diện.
 */
export function sanitizeDisplayText(text?: string | null): string {
  if (!text) return '';
  return text.replace(UUID_REGEX, '***');
}
