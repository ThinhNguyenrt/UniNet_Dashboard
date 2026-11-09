/**
 * DTO và Type definitions cho module Admin Quản lý Thẩm định Dự án (Project Verifications)
 * Khớp 100% với hợp đồng backend UniNet.Application và UniNet.Domain.Enums
 */

// 1. Enums và Constants

export const ProjectVerificationStatus = {
  Pending: 0,
  Verified: 1,
  Failed: 2,
  Cancelled: 3,
  InsufficientEvidence: 4,
} as const;
export type ProjectVerificationStatus =
  (typeof ProjectVerificationStatus)[keyof typeof ProjectVerificationStatus];

export const projectVerificationStatusLabels: Record<ProjectVerificationStatus, string> = {
  [ProjectVerificationStatus.Pending]: 'Chờ thẩm định',
  [ProjectVerificationStatus.Verified]: 'Đạt chuẩn (Verified)',
  [ProjectVerificationStatus.Failed]: 'Không đạt (Failed)',
  [ProjectVerificationStatus.Cancelled]: 'Đã hủy',
  [ProjectVerificationStatus.InsufficientEvidence]: 'Chưa đủ cơ sở đánh giá',
};

export const projectVerificationStatusStyles: Record<
  ProjectVerificationStatus,
  { bg: string; text: string; border: string }
> = {
  [ProjectVerificationStatus.Pending]: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  [ProjectVerificationStatus.Verified]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  [ProjectVerificationStatus.Failed]: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  [ProjectVerificationStatus.Cancelled]: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
  },
  [ProjectVerificationStatus.InsufficientEvidence]: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
};

export const VerificationAssignmentStatus = {
  Assigned: 0,
  Completed: 1,
  Overdue: 2,
  Cancelled: 3,
} as const;
export type VerificationAssignmentStatus =
  (typeof VerificationAssignmentStatus)[keyof typeof VerificationAssignmentStatus];

export const verificationAssignmentStatusLabels: Record<VerificationAssignmentStatus, string> = {
  [VerificationAssignmentStatus.Assigned]: 'Đang phân công',
  [VerificationAssignmentStatus.Completed]: 'Đã hoàn thành',
  [VerificationAssignmentStatus.Overdue]: 'Quá hạn',
  [VerificationAssignmentStatus.Cancelled]: 'Đã hủy',
};

export const verificationAssignmentStatusStyles: Record<
  VerificationAssignmentStatus,
  { bg: string; text: string; border: string }
> = {
  [VerificationAssignmentStatus.Assigned]: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  [VerificationAssignmentStatus.Completed]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  [VerificationAssignmentStatus.Overdue]: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  [VerificationAssignmentStatus.Cancelled]: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
  },
};

export const VerificationBookingStatus = {
  None: 0,
  Held: 1,
  Confirmed: 2,
  Expired: 3,
  Cancelled: 4,
  Legacy: 5,
} as const;
export type VerificationBookingStatus =
  (typeof VerificationBookingStatus)[keyof typeof VerificationBookingStatus];

export const verificationBookingStatusLabels: Record<VerificationBookingStatus, string> = {
  [VerificationBookingStatus.None]: 'Chưa đặt',
  [VerificationBookingStatus.Held]: 'Đang giữ chỗ',
  [VerificationBookingStatus.Confirmed]: 'Đã xác nhận',
  [VerificationBookingStatus.Expired]: 'Hết hạn',
  [VerificationBookingStatus.Cancelled]: 'Đã hủy',
  [VerificationBookingStatus.Legacy]: 'Dữ liệu cũ',
};

export const verificationBookingStatusStyles: Record<
  VerificationBookingStatus,
  { bg: string; text: string; border: string }
> = {
  [VerificationBookingStatus.None]: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
  },
  [VerificationBookingStatus.Held]: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  [VerificationBookingStatus.Confirmed]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  [VerificationBookingStatus.Expired]: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  [VerificationBookingStatus.Cancelled]: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
  },
  [VerificationBookingStatus.Legacy]: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
  },
};

export const BackendProjectStatus = {
  Pending: 0,
  Active: 1,
  Completed: 2,
  Rejected: 3,
} as const;
export type BackendProjectStatus =
  (typeof BackendProjectStatus)[keyof typeof BackendProjectStatus];

export const backendProjectStatusLabels: Record<BackendProjectStatus, string> = {
  [BackendProjectStatus.Pending]: 'Chờ duyệt',
  [BackendProjectStatus.Active]: 'Đang hoạt động',
  [BackendProjectStatus.Completed]: 'Đã hoàn thành',
  [BackendProjectStatus.Rejected]: 'Từ chối',
};

export const backendProjectStatusStyles: Record<
  BackendProjectStatus,
  { bg: string; text: string; border: string }
> = {
  [BackendProjectStatus.Pending]: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  [BackendProjectStatus.Active]: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  [BackendProjectStatus.Completed]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  [BackendProjectStatus.Rejected]: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
};

// 2. Evidence Moderation Snapshot Types (Bằng chứng cấp 1)

export interface EvidenceFileSnapshot {
  taskEvidenceId: string;
  fileUrl: string;
  publicId?: string | null;
  resourceType?: string | null;
  fileName?: string | null;
  format?: string | null;
}

export interface EvidenceReportSnapshot {
  taskReportId: string;
  version: number;
  submittedById: string;
  content: string;
  status: number;
  submittedAt: string;
  evidence: EvidenceFileSnapshot[];
  reportGroupId?: string | null;
  parentReportId?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedById?: string | null;
}

export interface EvidenceTaskSnapshot {
  projectTaskId: string;
  status: number;
  reports: EvidenceReportSnapshot[];
}

export interface EvidenceSourceSnapshot {
  projectId: string;
  tasks: EvidenceTaskSnapshot[];
}

export interface EvidencePolicySnapshot {
  version?: string | null;
  contentInstructions?: string | null;
  forbiddenTerms: string[];
  termMatchMode?: string | null;
  textNormalization?: string | null;
  caseSensitive?: boolean | null;
  geminiModel?: string | null;
  threatTypes: string[];
  platformTypes: string[];
  scope?: string;
}

export interface EvidenceCheckResult {
  projectTaskId: string;
  taskReportId: string;
  taskEvidenceId?: string | null;
  kind: string;
  url?: string | null;
  status: number;
  reason: string;
  provider: string;
  checkedAt: string;
  proof?: string | null;
  errorCode?: string | null;
  transient?: boolean;
}

export interface EvidenceAttemptResponse {
  number: number;
  startedAt: string;
  finishedAt?: string | null;
  errorCode?: string | null;
  error?: string | null;
  transient: boolean;
  results: EvidenceCheckResult[];
}

export interface EvidenceModerationResponse {
  id: string;
  projectId: string;
  version: number;
  sourceHash: string;
  policyHash: string;
  status: number;
  isCurrent: boolean;
  createdAt: string;
  completedAt?: string | null;
  summary?: string | null;
  lastErrorCode?: string | null;
  lastError?: string | null;
  source: EvidenceSourceSnapshot;
  policy: EvidencePolicySnapshot;
  attempts: EvidenceAttemptResponse[];
  scopeLimitation?: string;
}

// 3. Rubric & Assessment Types

export interface AssessmentCriterion {
  code: string;
  name: string;
  weight: number;
}

export interface AssessmentCondition {
  code: string;
  description: string;
}

export interface AssessmentRubric {
  code: string;
  version: string;
  passingScore: number;
  criteria: AssessmentCriterion[];
  conditions: AssessmentCondition[];
}

export interface CriterionScoreInput {
  code: string;
  score: number | null; // 0-100, null nghĩa là thiếu minh chứng
  reason: string;
  evidence?: string | null;
}

export interface ConditionCheckInput {
  code: string;
  passed: boolean | null; // true, false, null
  reason: string;
}

export interface ProjectAssessmentResult {
  rubric: AssessmentRubric;
  scores: CriterionScoreInput[];
  conditions: ConditionCheckInput[];
  totalScore: number | null;
  outcome: ProjectVerificationStatus;
}

// 4. Report Types

export interface VerificationReportResponse {
  id: string;
  assignmentId: string;
  summary: string;
  findings?: string | null;
  recommendations?: string | null;
  submittedAt: string;
  outcome?: ProjectVerificationStatus | null;
  assessment?: ProjectAssessmentResult | null;
}

// 5. Assignment Types

export interface VerificationAssignmentResponse {
  id: string;
  assignedToUserId: string;
  status: VerificationAssignmentStatus;
  assignedAt: string;
  report?: VerificationReportResponse | null;
  // Các trường bổ sung nếu có từ API chi tiết
  assignedToFullName?: string | null;
  assignmentDueAt?: string | null;
  reportDueAt?: string | null;
  replacedAt?: string | null;
  replacementReason?: string | null;
  replacedById?: string | null;
}

export interface AssignmentResponse {
  id: string;
  projectVerificationId: string;
  assignedToUserId: string;
  adminId: string;
  status: VerificationAssignmentStatus;
  assignedAt: string;
  assignmentDueAt?: string | null;
  reportDueAt?: string | null;
  replacedAt?: string | null;
  replacementReason?: string | null;
  replacedById?: string | null;
  createdAt: string;
  updatedAt: string;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  meetingStartAt?: string | null;
  meetingEndAt?: string | null;
  completedAt?: string | null;
}

export interface AssignmentDetailResponse {
  assignment: AssignmentResponse;
  project: VerificationProjectResponse;
  evidenceModeration?: EvidenceModerationResponse | null;
  report?: VerificationReportResponse | null;
  assessmentRubric?: AssessmentRubric | null;
  assignedToUser?: AssignmentAssigneeResponse | null;
}

export interface AssignmentsResponse {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  assignments: AssignmentResponse[];
}

export interface SuitableVerificatorResponse {
  userId: string;
  fullName: string;
}

export interface CreateAssignmentRequest {
  projectVerificationId: string;
  assignedToUserId: string;
}

export interface ReplaceVerificatorRequest {
  assignedToUserId: string;
  reason: string;
}

// 6. Payment & Refund Types

export interface VerificationRefundResponse {
  id: string;
  amount: number;
  status: number;
  reason: string;
  completedAt?: string | null;
  requestedByUserId?: string | null;
  requestedAt?: string | null;
  requestSource?: number;
}

export interface VerificationPaymentResponse {
  transactionId: string;
  packageId: string;
  status: number;
  amount: number;
  paidAt?: string | null;
  refunds: VerificationRefundResponse[];
  requiresManualReview?: boolean;
  failureReason?: string | null;
}

// 7. Project & Verification Responses

export const ProjectOrigin = {
  Internal: 0,
  External: 1,
} as const;
export type ProjectOrigin = (typeof ProjectOrigin)[keyof typeof ProjectOrigin];

export interface ProjectSkillInfo {
  skillId: string;
  skillName: string;
  category?: string | null;
  iconUrl?: string | null;
  minLevel?: number | null;
}

export interface ProjectMemberInfo {
  userId: string;
  fullName: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  role: string;
  status: number;
  joinedAt?: string | null;
}

export interface ProjectLeaderInfo {
  userId?: string | null;
  fullName: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
  status?: number | null;
  joinedAt?: string | null;
}

export interface DeclaredProjectMember {
  name: string;
  role?: string | null;
}

export interface ExternalProjectDraftData {
  title?: string | null;
  description?: string | null;
  projectField?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  repositoryUrl?: string | null;
  demoUrl?: string | null;
  submitterRole?: string | null;
  submitterContribution?: string | null;
  submitterIsLeader?: boolean | null;
  leaderName?: string | null;
  skillIds?: string[];
  evidenceFileIds?: string[];
  features?: string[];
  members?: DeclaredProjectMember[];
}

export interface AssignmentAssigneeResponse {
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
  nickname?: string | null;
}

export interface VerificationProjectResponse {
  id: string;
  title: string;
  projectField: string;
  description: string;
  status: BackendProjectStatus;
  leaderId?: string | null;
  origin?: ProjectOrigin;
  ownerUserId?: string | null;
  leader?: ProjectLeaderInfo | null;
  externalDetails?: ExternalProjectDraftData | null;
  skills?: ProjectSkillInfo[];
  members?: ProjectMemberInfo[];
}

export interface VerificationFinalResultResponse {
  status: ProjectVerificationStatus;
  finalizedAt?: string | null;
  finalizedByUserId?: string | null;
  reports: VerificationReportResponse[];
}

export interface ProjectVerificationResponse {
  id: string;
  projectId: string;
  projectTitle: string;
  status: ProjectVerificationStatus;
  submittedAt: string;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  createdAt: string;
  updatedAt: string;
  bookingStatus: VerificationBookingStatus;
  reservationId?: string | null;
  reservedUntil?: string | null;
  bookingConfirmedAt?: string | null;
  assignmentEligibleAt?: string | null;
}

export interface ProjectVerificationsResponse {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  verifications: ProjectVerificationResponse[];
}

export interface ProjectVerificationDetailResponse {
  verification: ProjectVerificationResponse;
  project: VerificationProjectResponse;
  packageId: string;
  evidenceModeration?: EvidenceModerationResponse | null;
  meetingStartAt?: string | null;
  meetingEndAt?: string | null;
  assignments: VerificationAssignmentResponse[];
  payments: VerificationPaymentResponse[];
  finalResult?: VerificationFinalResultResponse | null;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  assessmentRubric?: AssessmentRubric | null;
}

export interface AdminVerificationDetailResponse {
  detail: ProjectVerificationDetailResponse;
}

// 8. Filters & Query Types

export interface ProjectVerificationFilter {
  status?: ProjectVerificationStatus;
  from?: string; // ISO string
  to?: string;   // ISO string
  page?: number;
  pageSize?: number;
}

