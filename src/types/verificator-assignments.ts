/**
 * Định nghĩa kiểu dữ liệu cho phân công thẩm định dự án (Verificator Assignments)
 * Dựa trên tài liệu UniNet — Chức năng và API dành cho Verificator
 */

// Trạng thái phân công: 0 Assigned, 1 Completed, 2 Overdue, 3 Cancelled
export const VerificationAssignmentStatus = {
  Assigned: 0,
  Completed: 1,
  Overdue: 2,
  Cancelled: 3,
} as const;
export type VerificationAssignmentStatus =
  (typeof VerificationAssignmentStatus)[keyof typeof VerificationAssignmentStatus];

export const assignmentStatusLabels: Record<number, string> = {
  [VerificationAssignmentStatus.Assigned]: 'Đang phân công',
  [VerificationAssignmentStatus.Completed]: 'Đã hoàn thành',
  [VerificationAssignmentStatus.Overdue]: 'Quá hạn',
  [VerificationAssignmentStatus.Cancelled]: 'Đã hủy',
};

export const assignmentStatusStyles: Record<
  number,
  { bg: string; text: string; border: string }
> = {
  [VerificationAssignmentStatus.Assigned]: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
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

// Kết quả xác minh dự án: 0 Pending, 1 Verified, 2 Failed, 3 Cancelled
export const ProjectVerificationStatus = {
  Pending: 0,
  Verified: 1,
  Failed: 2,
  Cancelled: 3,
} as const;
export type ProjectVerificationStatus =
  (typeof ProjectVerificationStatus)[keyof typeof ProjectVerificationStatus];

export const projectVerificationStatusLabels: Record<number, string> = {
  [ProjectVerificationStatus.Pending]: 'Đang chờ thẩm định',
  [ProjectVerificationStatus.Verified]: 'Đạt chuẩn (Verified)',
  [ProjectVerificationStatus.Failed]: 'Không đạt (Failed)',
  [ProjectVerificationStatus.Cancelled]: 'Đã hủy',
};

export const projectVerificationStatusStyles: Record<
  number,
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
};

// Trạng thái dự án chung
export const ProjectStatus = {
  Planning: 0,
  Recruiting: 1,
  InProgress: 2,
  Completed: 3,
  Suspended: 4,
  Cancelled: 5,
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const projectStatusLabels: Record<number, string> = {
  [ProjectStatus.Planning]: 'Lập kế hoạch',
  [ProjectStatus.Recruiting]: 'Đang tuyển thành viên',
  [ProjectStatus.InProgress]: 'Đang thực hiện',
  [ProjectStatus.Completed]: 'Đã hoàn thành',
  [ProjectStatus.Suspended]: 'Tạm ngưng',
  [ProjectStatus.Cancelled]: 'Đã hủy',
};

// Chi tiết phân công cá nhân (AssignmentResponse)
export interface AssignmentResponse {
  id: string; // Guid phân công
  projectVerificationId: string; // Guid hồ sơ xác minh dự án
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

// Phân trang danh sách phân công
export interface AssignmentsResponse {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  assignments: AssignmentResponse[];
}

// Thông tin dự án gắn với hồ sơ thẩm định
export interface VerificationProjectResponse {
  id: string;
  title: string;
  projectField: string;
  description: string;
  status: ProjectStatus;
  leaderId: string;
}

// Báo cáo thẩm định thu gọn đi kèm AssignmentDetail
export interface VerificationReportResponse {
  id: string;
  assignmentId: string;
  summary: string;
  findings?: string | null;
  recommendations?: string | null;
  submittedAt: string;
  outcome?: ProjectVerificationStatus | null;
}

// Snapshots bằng chứng và kiểm tra tự động
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
  source: {
    projectId: string;
    tasks: EvidenceTaskSnapshot[];
  };
  policy: {
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
  };
  attempts: EvidenceAttemptResponse[];
  scopeLimitation: string;
}

// Chi tiết đầy đủ của một phân công
export interface AssignmentDetailResponse {
  assignment: AssignmentResponse;
  project: VerificationProjectResponse;
  evidenceModeration?: EvidenceModerationResponse | null;
  report?: VerificationReportResponse | null;
}

// Hợp đồng Buổi họp xác minh (Meeting)
export interface MeetingResponse {
  assignmentId: string;
  projectVerificationId: string;
  roomName?: string | null;
  joinUrl?: string | null;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  meetingStartAt?: string | null;
  meetingEndAt?: string | null;
}

export interface MeetingJoinResponse {
  assignmentId: string;
  projectVerificationId: string;
  joinUrl: string;
}

// Hợp đồng Báo cáo xác minh (Report)
export interface SubmitReportRequest {
  assignmentId: string;
  summary: string;
  findings: string;
  recommendations: string;
  outcome: typeof ProjectVerificationStatus.Verified | typeof ProjectVerificationStatus.Failed;
}

export interface ReportResponse {
  id: string;
  assignmentId: string;
  projectVerificationId: string;
  summary: string;
  findings?: string | null;
  recommendations?: string | null;
  outcome?: ProjectVerificationStatus | null;
  submittedByUserId: string;
  submittedAt: string;
}

// Tham số query danh sách phân công
export interface AssignmentQuery {
  status?: number;
  page?: number;
  pageSize?: number;
}
