import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FolderKanban,
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  FileText,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  FileCheck,
  Info,
  Users,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  verificatorAssignmentsService,
  parseAssignmentErrorMessage,
} from '../../services/verificator-assignments.service';
import { VerificationMeetingPanel } from '../../components/verificator/VerificationMeetingPanel';
import { VerificationReportPanel } from '../../components/verificator/VerificationReportPanel';
import {
  type AssignmentDetailResponse,
  type MeetingResponse,
  VerificationAssignmentStatus,
  assignmentStatusLabels,
  assignmentStatusStyles,
  projectStatusLabels,
} from '../../types/verificator-assignments';
import { managementDate } from '../../utils/management';

export const VerificatorProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [detail, setDetail] = useState<AssignmentDetailResponse | null>(null);
  const [meeting, setMeeting] = useState<MeetingResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active section tab: 'overview' | 'meeting' | 'evidence' | 'report'
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'overview' | 'meeting' | 'evidence' | 'report'>(
    initialTab === 'meeting' ? 'meeting' : initialTab === 'report' ? 'report' : 'overview'
  );

  // Tải thông tin chi tiết phân công
  const loadDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await verificatorAssignmentsService.getAssignmentDetail(id);
      setDetail(data);

      // Thử tải thông tin phòng họp nếu có lịch
      try {
        const meetingData = await verificatorAssignmentsService.getMeeting(id);
        setMeeting(meetingData);
      } catch {
        // Nếu chưa có phòng họp hoặc chưa cấu hình thì không chặn load trang
      }
    } catch (err) {
      setError(parseAssignmentErrorMessage(err, 'Không thể tải chi tiết phân công thẩm định.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDetail();
  }, [loadDetail]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <Link to="/verificator/projects" className="inline-flex items-center gap-1.5 hover:text-slate-600">
            <ArrowLeft className="w-4 h-4" />
            Danh sách phân công
          </Link>
          <span>/</span>
          <span>Đang tải thông tin...</span>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-slate-200 animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-100 rounded w-1/2" />
          <div className="h-32 bg-slate-50 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <Link to="/verificator/projects" className="inline-flex items-center gap-1.5 hover:text-slate-600">
            <ArrowLeft className="w-4 h-4" />
            Danh sách phân công
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-semibold text-base">Lỗi truy xuất phân công</h3>
            <p className="text-sm">{error || 'Không tìm thấy dữ liệu phân công dự án yêu cầu.'}</p>
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => void loadDetail()}
                className="px-3.5 py-1.5 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Thử lại
              </button>
              <button
                type="button"
                onClick={() => navigate('/verificator/projects')}
                className="px-3.5 py-1.5 bg-white border border-red-200 text-red-700 rounded-xl text-xs font-semibold hover:bg-red-50"
              >
                Quay lại danh sách
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { assignment, project, evidenceModeration, report } = detail;
  const assignmentStyle = assignmentStatusStyles[assignment.status] || assignmentStatusStyles[VerificationAssignmentStatus.Assigned];

  // Kiểm tra trạng thái buổi họp
  const isMeetingStarted = Boolean(assignment.meetingStartAt || meeting?.meetingStartAt);
  const isMeetingEnded = Boolean(assignment.meetingEndAt || meeting?.meetingEndAt);

  // Kiểm tra điều kiện nộp báo cáo:
  // - Chưa có báo cáo
  // - Phân công chưa bị thay thế / hủy
  // - Buổi họp đã diễn ra và kết thúc
  const hasReport = Boolean(report);
  const isMeetingCompletedForReport = isMeetingStarted && isMeetingEnded;
  const canSubmitReport = !hasReport && assignment.status !== VerificationAssignmentStatus.Cancelled && !assignment.replacedAt;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link
            to="/verificator/projects"
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Danh sách phân công
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold truncate max-w-xs">{project.title}</span>
        </div>
        <button
          type="button"
          onClick={() => void loadDetail()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Làm mới
        </button>
      </div>

      {/* Replacement Banner (Nếu phân công đã bị thay thế) */}
      {assignment.replacedAt && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Phân công này đã được thay thế cho nhân sự khác</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Thời gian thay thế: {managementDate(assignment.replacedAt)}
              {assignment.replacementReason && ` · Lý do: "${assignment.replacementReason}"`}
            </p>
          </div>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${assignmentStyle.bg} ${assignmentStyle.text} ${assignmentStyle.border}`}>
                {assignmentStatusLabels[assignment.status] ?? 'Không xác định'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {project.projectField || 'Chưa phân loại lĩnh vực'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                Trạng thái dự án: {projectStatusLabels[project.status] ?? 'Không xác định'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight pt-1">
              {project.title}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Thời gian tiếp nhận: {managementDate(assignment.assignedAt)}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canSubmitReport && (
              <button
                type="button"
                onClick={() => setActiveTab('report')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-2 transition"
              >
                <FileCheck className="w-4 h-4" />
                Lập báo cáo thẩm định
              </button>
            )}
            {hasReport && (
              <button
                type="button"
                onClick={() => setActiveTab('report')}
                className="px-3.5 py-2 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition"
              >
                <FileText className="w-4 h-4" />
                Xem báo cáo đã nộp
              </button>
            )}
          </div>
        </div>

        {/* Milestone Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Ngày được phân công
            </span>
            <p className="font-semibold text-slate-800 mt-1">{managementDate(assignment.assignedAt)}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Hạn nộp báo cáo
            </span>
            <p className="font-semibold text-slate-800 mt-1">{managementDate(assignment.reportDueAt)}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Video className="w-3.5 h-3.5 text-blue-500" />
              Lịch họp dự kiến
            </span>
            <p className="font-semibold text-slate-800 mt-1">
              {assignment.scheduledStartAt ? managementDate(assignment.scheduledStartAt) : 'Chưa xếp lịch'}
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Hoàn thành
            </span>
            <p className="font-semibold text-slate-800 mt-1">
              {assignment.completedAt ? managementDate(assignment.completedAt) : 'Chưa hoàn thành'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="border-b border-slate-200">
        <div className="flex gap-2 sm:gap-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            Tổng quan Dự án
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('meeting')}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'meeting'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Video className="w-4 h-4" />
            Buổi họp Thẩm định
            {isMeetingStarted && !isMeetingEnded && (
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'evidence'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Kiểm tra Bằng chứng
            {evidenceModeration && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600">
                v{evidenceModeration.version}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'report'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Báo cáo Kết luận
            {hasReport && <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-700">Đã nộp</span>}
          </button>
        </div>
      </div>

      {/* TAB CONTENT 1: TỔNG QUAN DỰ ÁN */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-600" />
                Mô tả đề tài / Dự án
              </h2>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-28">
                {project.description || 'Chưa có thông tin mô tả chi tiết cho dự án này.'}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Thông tin chuyên môn & phân công
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <dt className="text-slate-500 font-medium">Lĩnh vực chuyên môn</dt>
                  <dd className="text-slate-800 font-semibold mt-1">
                    {project.projectField || 'Chưa phân loại'}
                  </dd>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <dt className="text-slate-500 font-medium">Trạng thái triển khai đề tài</dt>
                  <dd className="text-slate-800 font-semibold mt-1">
                    {projectStatusLabels[project.status] ?? 'Đang thực hiện'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Cột thông tin hỗ trợ */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                Quy trình thẩm định dự án
              </h3>
              <ol className="relative border-l border-blue-200 ml-2 space-y-4 text-xs text-slate-600">
                <li className="ml-4">
                  <div className="absolute -left-1.5 mt-1 size-3 rounded-full bg-blue-600 border-2 border-white" />
                  <span className="font-semibold text-slate-800">1. Tiếp nhận phân công</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Kiểm tra thông tin hồ sơ và xếp lịch rảnh.</p>
                </li>
                <li className="ml-4">
                  <div className={`absolute -left-1.5 mt-1 size-3 rounded-full border-2 border-white ${isMeetingStarted ? 'bg-blue-600' : 'bg-slate-300'}`} />
                  <span className="font-semibold text-slate-800">2. Họp xác minh trực tuyến</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Tạo phòng, bấm Bắt đầu khi họp và Kết thúc sau khi hoàn tất.</p>
                </li>
                <li className="ml-4">
                  <div className={`absolute -left-1.5 mt-1 size-3 rounded-full border-2 border-white ${evidenceModeration ? 'bg-blue-600' : 'bg-slate-300'}`} />
                  <span className="font-semibold text-slate-800">3. Rà soát bằng chứng</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Đối chiếu kết quả quét tự động và tài liệu nhóm đã tải lên.</p>
                </li>
                <li className="ml-4">
                  <div className={`absolute -left-1.5 mt-1 size-3 rounded-full border-2 border-white ${hasReport ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                  <span className="font-semibold text-slate-800">4. Nộp báo cáo kết luận</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Đánh giá Đạt chuẩn hoặc Không đạt. Lưu ý không thể sửa sau khi gửi.</p>
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: BUỔI HỌP THẨM ĐỊNH (MEETING) */}
      {activeTab === 'meeting' && (
        <VerificationMeetingPanel
          assignmentId={assignment.id}
          projectTitle={project.title}
          initialMeeting={meeting}
          onMeetingUpdated={(updatedMeeting) => {
            setMeeting(updatedMeeting);
            setDetail((prev) =>
              prev
                ? {
                    ...prev,
                    assignment: {
                      ...prev.assignment,
                      meetingStartAt: updatedMeeting.meetingStartAt,
                      meetingEndAt: updatedMeeting.meetingEndAt,
                    },
                  }
                : null
            );
          }}
          onNavigateToReport={() => setActiveTab('report')}
        />
      )}

      {/* TAB CONTENT 3: KIỂM TRA BẰNG CHỨNG (EVIDENCE MODERATION) */}
      {activeTab === 'evidence' && (
        <div className="space-y-6">
          {!evidenceModeration ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-500 shadow-xs space-y-2">
              <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-medium">Chưa có kết quả kiểm tra bằng chứng tự động</p>
              <p className="text-xs text-slate-400">
                Hồ sơ này chưa chạy quy trình quét tự động hoặc không có yêu cầu bằng chứng số.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary box */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-indigo-600" />
                      Kết quả rà soát tự động (AI Moderation)
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Phiên bản dữ liệu: v{evidenceModeration.version} · Hoàn thành: {managementDate(evidenceModeration.completedAt)}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
                    Mô hình: {evidenceModeration.policy?.geminiModel || 'Mặc định'}
                  </span>
                </div>

                {evidenceModeration.summary && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                    <p className="font-semibold text-slate-800 mb-1">Tóm tắt phân tích:</p>
                    {evidenceModeration.summary}
                  </div>
                )}

                <p className="text-[11px] text-slate-400 italic">
                  * {evidenceModeration.scopeLimitation || 'Chỉ kiểm tra nội dung text và độ tin cậy URL; không đọc nội dung bên trong file.'}
                </p>
              </div>

              {/* Tasks & Reports Evidence Details */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  Danh sách công việc & Báo cáo minh chứng ({evidenceModeration.source?.tasks?.length || 0} tasks)
                </h3>

                <div className="space-y-4">
                  {evidenceModeration.source?.tasks?.map((task, tIndex) => (
                    <div key={task.projectTaskId || tIndex} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                        <span>Nhiệm vụ #{tIndex + 1}</span>
                        <span className="text-slate-500 font-normal">{task.reports?.length || 0} báo cáo tiến độ</span>
                      </div>

                      {task.reports?.map((rep, rIndex) => (
                        <div key={rep.taskReportId || rIndex} className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-2">
                          <div className="flex items-center justify-between text-slate-500 text-[11px]">
                            <span>Bản báo cáo v{rep.version}</span>
                            <span>{managementDate(rep.submittedAt)}</span>
                          </div>
                          <p className="text-slate-700 whitespace-pre-wrap">{rep.content}</p>

                          {rep.evidence?.length > 0 && (
                            <div className="pt-2 border-t border-slate-100 space-y-1">
                              <span className="text-[11px] font-medium text-slate-500">Tệp minh chứng đính kèm:</span>
                              <div className="flex flex-wrap gap-2">
                                {rep.evidence.map((file, fIndex) => (
                                  <a
                                    key={file.taskEvidenceId || fIndex}
                                    href={file.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-medium inline-flex items-center gap-1 transition"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    {file.fileName || `Tệp đính kèm #${fIndex + 1}`}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}

                  {(!evidenceModeration.source?.tasks || evidenceModeration.source.tasks.length === 0) && (
                    <p className="text-xs text-slate-500 text-center py-4">Dự án không có snapshot nhiệm vụ.</p>
                  )}
                </div>
              </div>

              {/* Moderation Attempts & Detailed Results */}
              {evidenceModeration.attempts && evidenceModeration.attempts.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-emerald-600" />
                    Chi tiết các lượt kiểm tra tự động ({evidenceModeration.attempts.length} lượt)
                  </h3>

                  <div className="space-y-4">
                    {evidenceModeration.attempts.map((attempt) => (
                      <div key={attempt.number} className="border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">Lượt quét #{attempt.number}</span>
                          <span className="text-slate-500">{managementDate(attempt.startedAt)}</span>
                        </div>

                        {attempt.results && attempt.results.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                                <tr>
                                  <th className="p-2.5">Loại kiểm tra</th>
                                  <th className="p-2.5">Nguồn / URL</th>
                                  <th className="p-2.5">Trạng thái</th>
                                  <th className="p-2.5">Nhận định</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-600">
                                {attempt.results.map((res, idx) => (
                                  <tr key={idx}>
                                    <td className="p-2.5 font-medium text-slate-800">{res.kind}</td>
                                    <td className="p-2.5 font-mono text-[11px] truncate max-w-xs">{res.url || '—'}</td>
                                    <td className="p-2.5">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        res.status === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                      }`}>
                                        {res.status === 1 ? 'Hợp lệ' : 'Cảnh báo'}
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-slate-700">{res.reason}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">Không phát hiện vi phạm chính sách.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: BÁO CÁO KẾT LUẬN THẨM ĐỊNH */}
      {activeTab === 'report' && (
        <VerificationReportPanel
          assignmentId={assignment.id}
          projectTitle={project.title}
          initialReport={report}
          isMeetingCompleted={isMeetingCompletedForReport}
          isAssignmentActive={
            assignment.status !== VerificationAssignmentStatus.Cancelled && !assignment.replacedAt
          }
          onReportSubmitted={(newReport) => {
            setDetail((prev) =>
              prev
                ? {
                    ...prev,
                    report: newReport,
                    assignment: {
                      ...prev.assignment,
                      status: VerificationAssignmentStatus.Completed,
                      completedAt: newReport.submittedAt,
                    },
                  }
                : null
            );
            void loadDetail();
          }}
          onNavigateToMeeting={() => setActiveTab('meeting')}
        />
      )}
    </div>
  );
};

export default VerificatorProjectDetailPage;
