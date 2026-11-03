import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCcw,
  Calendar,
  AlertTriangle,
  FolderKanban,
  CreditCard,
  FileCheck2,
  Users,
  Shield,
  Loader2,
} from 'lucide-react';
import { adminProjectVerificationsService } from '../../services/admin-project-verifications.service';
import type {
  ProjectVerificationDetailResponse,
  VerificationAssignmentResponse,
} from '../../types/admin-project-verifications';
import {
  ProjectVerificationStatus,
  projectVerificationStatusLabels,
  projectVerificationStatusStyles,
  VerificationBookingStatus,
  verificationBookingStatusLabels,
  verificationBookingStatusStyles,
  BackendProjectStatus,
  backendProjectStatusLabels,
  backendProjectStatusStyles,
  VerificationAssignmentStatus,
} from '../../types/admin-project-verifications';
import { getApiErrorMessage } from '../../services/api';
import { AssignVerificatorDialog } from '../../components/project-verifications/AssignVerificatorDialog';
import { ReplaceVerificatorDialog } from '../../components/project-verifications/ReplaceVerificatorDialog';
import { AssignmentHistoryPanel } from '../../components/project-verifications/AssignmentHistoryPanel';
import { VerificationReportView } from '../../components/project-verifications/VerificationReportView';
import { EvidenceModerationPanel } from '../../components/project-verifications/EvidenceModerationPanel';

type DetailTab = 'overview' | 'assignments' | 'evidence' | 'report' | 'payments';

export const ProjectVerificationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<ProjectVerificationDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Dialog states
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState<boolean>(false);
  const [isReplaceDialogOpen, setIsReplaceDialogOpen] = useState<boolean>(false);
  const [selectedAssignmentToReplace, setSelectedAssignmentToReplace] =
    useState<VerificationAssignmentResponse | null>(null);

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

  useEffect(() => {
    const verificationId = id;
    if (!verificationId) return;
    let ignore = false;
    const controller = new AbortController();

    async function loadDetail(targetId: string) {
      try {
        const result = await adminProjectVerificationsService.getDetail(targetId, controller.signal);
        if (!ignore) {
          setDetail(result);
          setErrorMessage(null);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore && !controller.signal.aborted) {
          setErrorMessage(
            getApiErrorMessage(
              err,
              'Không thể tải chi tiết hồ sơ thẩm định. Hồ sơ không tồn tại hoặc bạn không có quyền.'
            )
          );
          setIsLoading(false);
        }
      }
    }

    loadDetail(verificationId);

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [id, reloadKey]);

  const handleRefresh = () => {
    setIsLoading(true);
    setReloadKey((k) => k + 1);
  };

  const handleOpenReplace = (assignment: VerificationAssignmentResponse) => {
    setSelectedAssignmentToReplace(assignment);
    setIsReplaceDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500 animate-fade-in">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium">Đang tải dữ liệu hồ sơ thẩm định...</p>
      </div>
    );
  }

  if (errorMessage || !detail) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4 animate-fade-in">
        <button
          onClick={() => navigate('/admin/project-verifications')}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách thẩm định
        </button>

        <div className="p-8 bg-white rounded-xl border border-slate-200 shadow-sm text-center space-y-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Không thể hiển thị hồ sơ</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">{errorMessage}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const { verification, project, evidenceModeration, assignments, payments, finalResult } =
    detail;

  const verificationStatusStyle =
    projectVerificationStatusStyles[verification.status] ||
    projectVerificationStatusStyles[ProjectVerificationStatus.Pending];
  const bookingStatusStyle =
    verificationBookingStatusStyles[verification.bookingStatus] ||
    verificationBookingStatusStyles[VerificationBookingStatus.None];
  const projectStatusStyle =
    backendProjectStatusStyles[project.status] ||
    backendProjectStatusStyles[BackendProjectStatus.Pending];

  // Logic điều kiện cho phép phân công hoặc thay người:
  const isCasePending =
    verification.status === ProjectVerificationStatus.Pending && !finalResult?.finalizedAt;
  const hasActiveAssignment = assignments.some(
    (a) =>
      a.status === VerificationAssignmentStatus.Assigned ||
      a.status === VerificationAssignmentStatus.Overdue
  );
  const canAssign = isCasePending && !hasActiveAssignment;
  const canReassign = isCasePending;

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/admin/project-verifications')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Danh sách thẩm định
        </button>

        <button
          onClick={handleRefresh}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Làm mới
        </button>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Hồ sơ #{verification.id}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${verificationStatusStyle.bg} ${verificationStatusStyle.text} ${verificationStatusStyle.border}`}
              >
                {projectVerificationStatusLabels[verification.status]}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded border ${bookingStatusStyle.bg} ${bookingStatusStyle.text} ${bookingStatusStyle.border}`}
              >
                Đặt lịch: {verificationBookingStatusLabels[verification.bookingStatus]}
              </span>
            </div>

            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {project.title}
            </h1>
            <p className="text-xs text-slate-500">
              Lĩnh vực:{' '}
              <span className="font-medium text-slate-700">{project.projectField}</span> | Trạng
              thái dự án:{' '}
              <span
                className={`inline-block px-2 py-0.2 rounded text-[11px] font-medium border ${projectStatusStyle.bg} ${projectStatusStyle.text} ${projectStatusStyle.border}`}
              >
                {backendProjectStatusLabels[project.status]}
              </span>
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 self-start lg:self-auto">
            {canAssign && (
              <button
                onClick={() => setIsAssignDialogOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Phân công người thẩm định
              </button>
            )}
          </div>
        </div>

        {/* Schedule & Quick Overview bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block mb-0.5">Thời gian gửi hồ sơ:</span>
            <span className="font-medium text-slate-800">
              {formatDate(verification.submittedAt)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Lịch hẹn dự kiến:</span>
            <span className="font-medium text-slate-800">
              {verification.scheduledStartAt
                ? `${formatDate(verification.scheduledStartAt)}`
                : 'Chưa đặt lịch'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Họp thực tế:</span>
            <span className="font-medium text-slate-800">
              {detail.meetingStartAt
                ? `${formatDate(detail.meetingStartAt)} - ${formatDate(detail.meetingEndAt)}`
                : 'Chưa bắt đầu họp'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Gói dịch vụ (Package):</span>
            <span className="font-mono text-slate-700">{detail.packageId}</span>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 gap-1 bg-white px-4 pt-2 rounded-t-xl border-t border-x overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          Tổng quan hồ sơ
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'assignments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-500" />
          Phân công ({assignments.length})
        </button>

        <button
          onClick={() => setActiveTab('evidence')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'evidence'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4 text-emerald-500" />
          Bằng chứng cấp 1
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'report'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-blue-500" />
          Báo cáo thẩm định ({finalResult?.reports?.length || (assignments.some(a => a.report) ? 1 : 0)})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'payments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4 text-amber-500" />
          Thanh toán & Giao dịch ({payments.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Project Details */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-600" />
                Thông tin dự án
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Tên dự án:</span>
                  <p className="font-semibold text-slate-800 text-sm">{project.title}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Lĩnh vực:</span>
                  <p className="font-medium text-slate-700">{project.projectField}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Trưởng dự án (Leader ID):</span>
                  <p className="font-mono text-slate-700">{project.leaderId}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Mã dự án (Project ID):</span>
                  <p className="font-mono text-slate-700">{project.id}</p>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <span className="text-slate-400 font-medium text-xs">Mô tả dự án:</span>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                  {project.description || 'Không có mô tả bổ sung.'}
                </p>
              </div>
            </div>

            {/* Booking & Meetings Info */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Thông tin đặt lịch & Phiên họp
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Trạng thái đặt lịch:</span>
                  <p>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold border ${bookingStatusStyle.bg} ${bookingStatusStyle.text} ${bookingStatusStyle.border}`}
                    >
                      {verificationBookingStatusLabels[verification.bookingStatus]}
                    </span>
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Xác nhận lịch lúc:</span>
                  <p className="font-medium text-slate-700">
                    {formatDate(verification.bookingConfirmedAt)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Đủ điều kiện phân công:</span>
                  <p className="font-medium text-slate-700">
                    {formatDate(verification.assignmentEligibleAt)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Lịch bắt đầu dự kiến:</span>
                  <p className="font-medium text-slate-700">
                    {formatDate(verification.scheduledStartAt)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Lịch kết thúc dự kiến:</span>
                  <p className="font-medium text-slate-700">
                    {formatDate(verification.scheduledEndAt)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Mã giữ chỗ (Reservation):</span>
                  <p className="font-mono text-slate-700">
                    {verification.reservationId || '—'}
                  </p>
                </div>
              </div>

              {/* Cancellation Note if any */}
              {detail.cancellationReason && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
                  <span className="font-bold">Lý do hủy hồ sơ:</span>
                  <p>{detail.cancellationReason}</p>
                  <p className="text-[11px] text-rose-600">
                    Hủy lúc: {formatDate(detail.cancelledAt)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <AssignmentHistoryPanel
            assignments={assignments}
            canAssign={canAssign}
            canReassign={canReassign}
            onOpenAssignDialog={() => setIsAssignDialogOpen(true)}
            onOpenReplaceDialog={handleOpenReplace}
          />
        )}

        {activeTab === 'evidence' && (
          <EvidenceModerationPanel evidenceModeration={evidenceModeration} />
        )}

        {activeTab === 'report' && (
          <VerificationReportView
            reports={
              finalResult?.reports ||
              assignments
                .map((a) => a.report)
                .filter((r): r is NonNullable<typeof r> => Boolean(r))
            }
            rubricSnapshot={detail.assessmentRubric}
          />
        )}

        {activeTab === 'payments' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-600" />
                Lịch sử thanh toán & Hoàn tiền
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {payments.length} giao dịch
              </span>
            </div>

            {payments.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center italic">
                Chưa có bản ghi thanh toán nào gắn liền với hồ sơ này.
              </p>
            ) : (
              <div className="space-y-4">
                {payments.map((p) => (
                  <div
                    key={p.transactionId}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                      <div className="space-y-0.5">
                        <span className="font-mono text-slate-600">Mã GD: {p.transactionId}</span>
                        <p className="text-slate-500 text-[11px]">
                          Thanh toán lúc: {formatDate(p.paidAt)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-bold text-slate-900 block">
                          {p.amount?.toLocaleString('vi-VN')} đ
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.status === 1
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.status === 1 ? 'Thành công' : 'Không thành công'}
                        </span>
                      </div>
                    </div>

                    {p.failureReason && (
                      <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg text-xs">
                        <span className="font-semibold">Lý do thất bại:</span> {p.failureReason}
                      </div>
                    )}

                    {/* Refunds */}
                    {p.refunds && p.refunds.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-200/60">
                        <span className="font-semibold text-slate-700 block">
                          Yêu cầu hoàn tiền ({p.refunds.length}):
                        </span>
                        {p.refunds.map((ref) => (
                          <div
                            key={ref.id}
                            className="p-2.5 bg-white rounded border border-slate-200 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-slate-800">
                                Số tiền: {ref.amount?.toLocaleString('vi-VN')} đ
                              </p>
                              <p className="text-slate-500 text-[11px]">Lý do: {ref.reason}</p>
                            </div>
                            <span className="text-[11px] font-medium text-slate-500">
                              {formatDate(ref.completedAt || ref.requestedAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AssignVerificatorDialog
        isOpen={isAssignDialogOpen}
        onClose={() => setIsAssignDialogOpen(false)}
        projectVerificationId={verification.id}
        onSuccess={handleRefresh}
      />

      <ReplaceVerificatorDialog
        isOpen={isReplaceDialogOpen}
        onClose={() => {
          setIsReplaceDialogOpen(false);
          setSelectedAssignmentToReplace(null);
        }}
        assignment={selectedAssignmentToReplace}
        projectVerificationId={verification.id}
        onSuccess={handleRefresh}
      />
    </div>
  );
};
