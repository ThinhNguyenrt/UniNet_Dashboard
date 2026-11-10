import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCcw,
  Calendar,
  AlertTriangle,
  FolderKanban,
  CreditCard,
  FileCheck2,
  Users,
  Loader2,
  Sparkles,
  ExternalLink,
  Globe,
  GitBranch,
  Info,
} from 'lucide-react';
import { adminProjectVerificationsService } from '../../services/admin-project-verifications.service';
import { adminAssignmentsService } from '../../services/admin-assignments.service';
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

type DetailTab = 'overview' | 'assignments' | 'report' | 'payments';

export const ProjectVerificationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Validate initial tab from URL params (smoothly map legacy 'evidence' or invalid tabs to 'overview')
  const rawTab = searchParams.get('tab');
  const validTabs: DetailTab[] = ['overview', 'assignments', 'report', 'payments'];
  const initialTab: DetailTab = validTabs.includes(rawTab as DetailTab)
    ? (rawTab as DetailTab)
    : 'overview';

  const [detail, setDetail] = useState<ProjectVerificationDetailResponse | null>(null);
  const [packageName, setPackageName] = useState<string>('');
  const [verificatorNameMap, setVerificatorNameMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>(initialTab);
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

  const handleTabChange = (tab: DetailTab) => {
    setActiveTab(tab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === 'overview') {
          next.delete('tab');
        } else {
          next.set('tab', tab);
        }
        return next;
      },
      { replace: true }
    );
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

          // Populate verificatorNameMap from existing assignments with names
          if (result.assignments && result.assignments.length > 0) {
            setVerificatorNameMap((prev) => {
              const next = { ...prev };
              result.assignments.forEach((a) => {
                if (a.assignedToUserId && a.assignedToFullName) {
                  next[a.assignedToUserId] = a.assignedToFullName;
                }
              });
              return next;
            });
          }

          // Fetch package info by packageId
          if (result.packageId) {
            adminProjectVerificationsService
              .getPackage(result.packageId, controller.signal)
              .then((pkg) => {
                if (!ignore && pkg) {
                  setPackageName(pkg.name);
                } else if (!ignore) {
                  setPackageName('Chưa có thông tin');
                }
              })
              .catch(() => {
                if (!ignore) setPackageName('Chưa có thông tin');
              });
          } else {
            setPackageName('Chưa có thông tin');
          }

          // Fetch suitable candidates to enrich verificator name map
          adminAssignmentsService
            .getCandidates(targetId, undefined, controller.signal)
            .then((candidates) => {
              if (!ignore && Array.isArray(candidates)) {
                setVerificatorNameMap((prev) => {
                  const next = { ...prev };
                  candidates.forEach((c) => {
                    if (c.userId && c.fullName) {
                      next[c.userId] = c.fullName;
                    }
                  });
                  return next;
                });
              }
            })
            .catch(() => {
              // Non-blocking: candidates endpoint may return empty or error on historical cases
            });
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

  const isDifferentProject = Boolean(detail && id && detail.verification.id !== id);

  if (isLoading || isDifferentProject) {
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

  const { verification, project, assignments, payments, finalResult } = detail;

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

  // Xây dựng danh sách thành viên hoàn chỉnh bao gồm cả trưởng nhóm
  const combinedMembers = (() => {
    const list: Array<{
      id: string;
      fullName: string;
      nickname?: string | null;
      avatarUrl?: string | null;
      role: string;
      isLeader: boolean;
      joinedAt?: string | null;
    }> = [];

    const existingNames = new Set<string>();
    const existingUserIds = new Set<string>();

    // 1. Thêm trưởng nhóm trước nếu có
    const leader = project.leader;
    const externalLeaderName = project.externalDetails?.leaderName;

    if (leader && leader.fullName) {
      list.push({
        id: leader.userId || 'leader-user',
        fullName: leader.fullName,
        nickname: leader.nickname,
        avatarUrl: leader.avatarUrl,
        role:
          leader.role && leader.role !== 'Creator' && leader.role !== 'Leader'
            ? leader.role
            : 'Trưởng nhóm',
        isLeader: true,
        joinedAt: leader.joinedAt,
      });
      if (leader.userId) existingUserIds.add(leader.userId);
      existingNames.add(leader.fullName.toLowerCase().trim());
    } else if (externalLeaderName) {
      list.push({
        id: 'external-leader',
        fullName: externalLeaderName,
        nickname: null,
        avatarUrl: null,
        role: 'Trưởng nhóm',
        isLeader: true,
        joinedAt: null,
      });
      existingNames.add(externalLeaderName.toLowerCase().trim());
    }

    // 2. Thêm các thành viên có tài khoản hệ thống (loại trừ nếu trùng trưởng nhóm)
    if (project.members && project.members.length > 0) {
      project.members.forEach((m) => {
        const isDuplicate =
          (m.userId && existingUserIds.has(m.userId)) ||
          existingNames.has(m.fullName.toLowerCase().trim());

        if (isDuplicate) {
          const idx = list.findIndex(
            (item) =>
              (m.userId && item.id === m.userId) ||
              item.fullName.toLowerCase().trim() === m.fullName.toLowerCase().trim()
          );
          if (idx !== -1) {
            list[idx].isLeader = true;
            if (m.avatarUrl && !list[idx].avatarUrl) list[idx].avatarUrl = m.avatarUrl;
            if (m.nickname && !list[idx].nickname) list[idx].nickname = m.nickname;
            if (m.joinedAt && !list[idx].joinedAt) list[idx].joinedAt = m.joinedAt;
          }
        } else {
          const isLeaderRole = Boolean(
            m.role?.toLowerCase().includes('leader') || m.role?.toLowerCase().includes('trưởng')
          );
          list.push({
            id: m.userId,
            fullName: m.fullName,
            nickname: m.nickname,
            avatarUrl: m.avatarUrl,
            role: m.role || 'Thành viên',
            isLeader: isLeaderRole,
            joinedAt: m.joinedAt,
          });
          if (m.userId) existingUserIds.add(m.userId);
          existingNames.add(m.fullName.toLowerCase().trim());
        }
      });
    }

    // 3. Thêm các thành viên tự khai báo từ hồ sơ ngoài (nếu chưa có trong danh sách)
    if (project.externalDetails?.members && project.externalDetails.members.length > 0) {
      project.externalDetails.members.forEach((dm, idx) => {
        if (!existingNames.has(dm.name.toLowerCase().trim())) {
          const isLeaderRole = Boolean(
            dm.role?.toLowerCase().includes('leader') || dm.role?.toLowerCase().includes('trưởng')
          );
          list.push({
            id: `declared-${idx}`,
            fullName: dm.name,
            nickname: null,
            avatarUrl: null,
            role: dm.role || 'Thành viên',
            isLeader: isLeaderRole,
            joinedAt: null,
          });
          existingNames.add(dm.name.toLowerCase().trim());
        }
      });
    }

    return list;
  })();

  // Báo cáo thẩm định count
  const reportCount =
    finalResult?.reports?.length || (assignments.some((a) => a.report) ? 1 : 0);

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
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-100 text-slate-700">
                Hồ sơ thẩm định dự án
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
              <span className="font-medium text-slate-700">
                {project.projectField || 'Chưa phân loại'}
              </span>{' '}
              {project.specialization && (
                <>
                  | Chuyên ngành:{' '}
                  <span className="font-medium text-slate-700">
                    {project.specialization.name}
                  </span>{' '}
                </>
              )}
              | Trạng thái dự án:{' '}
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
                ? formatDate(verification.scheduledStartAt)
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
            <span className="text-slate-400 block mb-0.5">Gói dịch vụ đăng ký:</span>
            <span className="font-medium text-slate-800">
              {packageName || 'Đang tải thông tin gói...'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 gap-1 bg-white px-4 pt-2 rounded-t-xl border-t border-x overflow-x-auto">
        <button
          onClick={() => handleTabChange('overview')}
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
          onClick={() => handleTabChange('assignments')}
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
          onClick={() => handleTabChange('report')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'report'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-blue-500" />
          Báo cáo thẩm định ({reportCount})
        </button>

        <button
          onClick={() => handleTabChange('payments')}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Tên dự án:</span>
                  <p className="font-semibold text-slate-800 text-sm">{project.title}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Lĩnh vực chuyên môn:</span>
                  <p className="font-medium text-slate-700">
                    {project.projectField || 'Chưa phân loại'}
                    {project.specialization && (
                      <span className="text-xs text-slate-500 block mt-0.5">
                        Chuyên ngành: {project.specialization.name}
                      </span>
                    )}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Loại hình hồ sơ:</span>
                  <p>
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {project.origin === 1
                        ? 'Dự án nhập từ tài liệu'
                        : 'Dự án trên nền tảng UniNet'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <span className="text-slate-400 font-medium text-xs">Mô tả dự án:</span>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100 whitespace-pre-wrap">
                  {project.description || 'Không có mô tả bổ sung.'}
                </p>
              </div>
            </div>

            {/* Project Skills Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Kỹ năng & Công nghệ dự án
                </h3>
                {project.skills && project.skills.length > 0 && (
                  <span className="text-xs text-slate-500 font-medium">
                    {project.skills.length} kỹ năng
                  </span>
                )}
              </div>

              {project.skills && project.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {project.skills.map((skill) => (
                    <span
                      key={skill.skillId}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {skill.iconUrl && (
                        <img
                          src={skill.iconUrl}
                          alt=""
                          className="w-3.5 h-3.5 object-contain rounded"
                        />
                      )}
                      <span>{skill.skillName}</span>
                      {skill.category && (
                        <span className="text-[10px] text-blue-500/80 bg-blue-100/60 px-1.5 py-0.2 rounded font-normal">
                          {skill.category}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-2">
                  Dự án chưa gắn danh mục kỹ năng hoặc công nghệ.
                </p>
              )}
            </div>

            {/* Team Members Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Danh sách thành viên tham gia ({combinedMembers.length})
                </h3>
              </div>

              {combinedMembers.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-3 text-center">
                  Chưa có thông tin danh sách thành viên cho dự án này.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {combinedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 flex items-start gap-3"
                    >
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 mt-0.5"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {member.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 text-xs truncate">
                            {member.fullName}
                          </span>
                          {member.nickname && (
                            <span className="text-[11px] text-slate-400">
                              @{member.nickname}
                            </span>
                          )}
                          {member.isLeader && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Trưởng nhóm
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                          <span>
                            Vai trò: <strong className="text-slate-700">{member.role}</strong>
                          </span>
                        </div>

                        {member.joinedAt && (
                          <p className="text-[11px] text-slate-400">
                            Tham gia: {formatDate(member.joinedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Submitter contribution info if external project */}
              {project.externalDetails &&
                (project.externalDetails.submitterRole ||
                  project.externalDetails.submitterContribution) && (
                  <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs space-y-1.5">
                    <span className="font-bold text-blue-900 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      Thông tin tự khai báo của người nộp hồ sơ:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                      {project.externalDetails.submitterRole && (
                        <p>
                          • Vai trò đảm nhiệm:{' '}
                          <span className="font-semibold text-slate-900">
                            {project.externalDetails.submitterRole}
                          </span>
                        </p>
                      )}
                      {project.externalDetails.submitterIsLeader !== undefined &&
                        project.externalDetails.submitterIsLeader !== null && (
                          <p>
                            • Vị trí nhóm:{' '}
                            <span className="font-semibold text-slate-900">
                              {project.externalDetails.submitterIsLeader
                                ? 'Trưởng nhóm'
                                : 'Thành viên'}
                            </span>
                          </p>
                        )}
                      {project.externalDetails.submitterContribution && (
                        <p className="sm:col-span-2">
                          • Đóng góp trong đề tài:{' '}
                          <span className="font-medium text-slate-800">
                            {project.externalDetails.submitterContribution}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* External Links & Draft Details (for imported projects) */}
            {project.externalDetails &&
              (project.externalDetails.repositoryUrl ||
                project.externalDetails.demoUrl ||
                project.externalDetails.startDate ||
                project.externalDetails.endDate ||
                (project.externalDetails.features &&
                  project.externalDetails.features.length > 0)) && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    Liên kết & Thông tin triển khai bổ sung
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {project.externalDetails.repositoryUrl && (
                      <div className="space-y-1">
                        <span className="text-slate-400 font-medium">Mã nguồn (Repository):</span>
                        <a
                          href={project.externalDetails.repositoryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 truncate"
                        >
                          <GitBranch className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{project.externalDetails.repositoryUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )}

                    {project.externalDetails.demoUrl && (
                      <div className="space-y-1">
                        <span className="text-slate-400 font-medium">Bản trình diễn (Demo):</span>
                        <a
                          href={project.externalDetails.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 truncate"
                        >
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{project.externalDetails.demoUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )}

                    {(project.externalDetails.startDate || project.externalDetails.endDate) && (
                      <div className="space-y-1">
                        <span className="text-slate-400 font-medium">Thời gian thực hiện:</span>
                        <p className="font-medium text-slate-700">
                          {project.externalDetails.startDate || '—'} đến{' '}
                          {project.externalDetails.endDate || 'Hiện tại'}
                        </p>
                      </div>
                    )}
                  </div>

                  {project.externalDetails.features &&
                    project.externalDetails.features.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <span className="text-slate-400 font-medium text-xs">
                          Tính năng chính đã hoàn thành:
                        </span>
                        <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
                          {project.externalDetails.features.map((feature, fIdx) => (
                            <li key={fIdx}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              )}

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
                  <span className="text-slate-400 font-medium">Tình trạng giữ chỗ lịch hẹn:</span>
                  <p className="font-medium text-slate-700">
                    {verification.reservationId
                      ? 'Đã cấp giữ chỗ lịch hẹn'
                      : 'Không có giữ chỗ'}
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
            verificatorNameMap={verificatorNameMap}
          />
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
                        <span className="font-semibold text-slate-800">
                          {packageName ? `Thanh toán gói: ${packageName}` : 'Thanh toán phí thẩm định'}
                        </span>
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
                              <p className="text-slate-500 text-[11px]">
                                Lý do: {ref.reason}
                              </p>
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
        projectId={project.id}
        projectTitle={project.title}
        scheduledStartAt={verification.scheduledStartAt}
        scheduledEndAt={verification.scheduledEndAt}
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
