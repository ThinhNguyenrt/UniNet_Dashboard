import React, { useState } from 'react';
import {
  Users,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Loader2,
} from 'lucide-react';
import type {
  VerificationAssignmentResponse,
  AssignmentDetailResponse,
} from '../../types/admin-project-verifications';
import {
  VerificationAssignmentStatus,
  verificationAssignmentStatusLabels,
  verificationAssignmentStatusStyles,
} from '../../types/admin-project-verifications';
import { adminAssignmentsService } from '../../services/admin-assignments.service';

interface AssignmentHistoryPanelProps {
  assignments: VerificationAssignmentResponse[];
  canAssign: boolean;
  canReassign: boolean;
  onOpenAssignDialog: () => void;
  onOpenReplaceDialog: (assignment: VerificationAssignmentResponse) => void;
}

export const AssignmentHistoryPanel: React.FC<AssignmentHistoryPanelProps> = ({
  assignments,
  canAssign,
  canReassign,
  onOpenAssignDialog,
  onOpenReplaceDialog,
}) => {
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);
  const [assignmentDetails, setAssignmentDetails] = useState<Record<string, AssignmentDetailResponse>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);

  const formatDate = (dateStr?: string | null) => {
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

  const handleToggleExpand = async (assignmentId: string) => {
    if (expandedAssignmentId === assignmentId) {
      setExpandedAssignmentId(null);
      return;
    }

    setExpandedAssignmentId(assignmentId);
    if (!assignmentDetails[assignmentId]) {
      setLoadingDetailId(assignmentId);
      try {
        const detail = await adminAssignmentsService.getAssignmentDetail(assignmentId);
        setAssignmentDetails((prev) => ({ ...prev, [assignmentId]: detail }));
      } catch {
        // Lỗi khi tải chi tiết assignment riêng biệt không làm crash UI
      } finally {
        setLoadingDetailId(null);
      }
    }
  };

  const hasActiveAssignment = assignments.some(
    (a) =>
      a.status === VerificationAssignmentStatus.Assigned ||
      a.status === VerificationAssignmentStatus.Overdue
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              Phân công & Lịch sử thẩm định
            </h3>
            <p className="text-xs text-slate-500">
              Quản lý phân công thẩm định viên dự án và theo dõi quá trình thay người
            </p>
          </div>
        </div>

        {canAssign && !hasActiveAssignment && (
          <button
            onClick={onOpenAssignDialog}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            Phân công thẩm định viên
          </button>
        )}
      </div>

      {/* Body */}
      {assignments.length === 0 ? (
        <div className="p-10 text-center text-slate-500">
          <Clock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-medium text-slate-700">Hồ sơ chưa được phân công</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Hồ sơ đang ở hàng đợi chờ phân công. Bấm nút "Phân công thẩm định viên" ở trên để chỉ định thẩm định viên cho hồ sơ này.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {assignments.map((assignment, index) => {
            const statusStyle =
              verificationAssignmentStatusStyles[assignment.status] ||
              verificationAssignmentStatusStyles[VerificationAssignmentStatus.Assigned];
            const isExpanded = expandedAssignmentId === assignment.id;
            const detail = assignmentDetails[assignment.id];
            const isDetailLoading = loadingDetailId === assignment.id;

            const isReplaceable =
              canReassign &&
              (assignment.status === VerificationAssignmentStatus.Assigned ||
                assignment.status === VerificationAssignmentStatus.Overdue) &&
              !assignment.report;

            return (
              <div key={assignment.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        Lần {assignments.length - index}
                      </span>
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                      >
                        {verificationAssignmentStatusLabels[assignment.status]}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ID: {assignment.id}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-500 text-xs">Thẩm định viên:</span>
                        <span className="font-medium text-slate-800">
                          {assignment.assignedToFullName || assignment.assignedToUserId}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-500 text-xs">Phân công lúc:</span>
                        <span className="text-slate-700 text-xs">
                          {formatDate(assignment.assignedAt)}
                        </span>
                      </div>
                      {assignment.report && (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          Đã nộp báo cáo
                        </div>
                      )}
                    </div>

                    {/* Replacement note */}
                    {assignment.status === VerificationAssignmentStatus.Cancelled &&
                      assignment.replacementReason && (
                        <div className="mt-2 p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-semibold">Lý do thay thế:</span>{' '}
                            <span>{assignment.replacementReason}</span>
                            {assignment.replacedAt && (
                              <p className="text-[11px] text-amber-700/80">
                                Thời điểm thay:{' '}
                                {formatDate(assignment.replacedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {isReplaceable && (
                      <button
                        onClick={() => onOpenReplaceDialog(assignment)}
                        className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Thay người
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleExpand(assignment.id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      {isDetailLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                      {isExpanded ? 'Thu gọn' : 'Chi tiết'}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/70 p-4 rounded-lg space-y-3 animate-fade-in text-xs">
                    {isDetailLoading ? (
                      <div className="py-4 text-center text-slate-500 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        Đang tải thông tin chi tiết phân công...
                      </div>
                    ) : detail ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <p className="font-semibold text-slate-700">Mốc thời gian phân công:</p>
                          <div className="space-y-1 text-slate-600">
                            <p>
                              • Hạn phân công (AssignmentDueAt):{' '}
                              <span className="font-medium text-slate-800">
                                {formatDate(detail.assignment.assignmentDueAt)}
                              </span>
                            </p>
                            <p>
                              • Hạn nộp báo cáo (ReportDueAt):{' '}
                              <span className="font-medium text-slate-800">
                                {formatDate(detail.assignment.reportDueAt)}
                              </span>
                            </p>
                            <p>
                              • Thời gian họp thực tế:{' '}
                              <span className="font-medium text-slate-800">
                                {detail.assignment.meetingStartAt
                                  ? `${formatDate(detail.assignment.meetingStartAt)} - ${formatDate(detail.assignment.meetingEndAt)}`
                                  : 'Chưa diễn ra'}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <p className="font-semibold text-slate-700">Người thực hiện:</p>
                          <div className="space-y-1 text-slate-600">
                            <p>
                              • Admin chỉ định ID:{' '}
                              <span className="font-mono text-slate-800">
                                {detail.assignment.adminId}
                              </span>
                            </p>
                            <p>
                              • Thẩm định viên ID:{' '}
                              <span className="font-mono text-slate-800">
                                {detail.assignment.assignedToUserId}
                              </span>
                            </p>
                            {detail.assignment.completedAt && (
                              <p className="text-emerald-700 font-medium">
                                • Đã hoàn thành lúc: {formatDate(detail.assignment.completedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500">
                        Không thể tải thêm chi tiết kỹ thuật cho phân công này.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
