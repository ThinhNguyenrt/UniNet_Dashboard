import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  Play,
  Square,
  ExternalLink,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ShieldAlert,
  FileCheck,
  Info,
  Users,
  Send,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  verificatorAssignmentsService,
  parseAssignmentErrorMessage,
} from '../../services/verificator-assignments.service';
import {
  type AssignmentDetailResponse,
  type MeetingResponse,
  VerificationAssignmentStatus,
  ProjectVerificationStatus,
  assignmentStatusLabels,
  assignmentStatusStyles,
  projectStatusLabels,
} from '../../types/verificator-assignments';
import { managementDate, managementInput } from '../../utils/management';

export const VerificatorProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<AssignmentDetailResponse | null>(null);
  const [meeting, setMeeting] = useState<MeetingResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Active section tab: 'overview' | 'meeting' | 'evidence' | 'report'
  const [activeTab, setActiveTab] = useState<'overview' | 'meeting' | 'evidence' | 'report'>('overview');

  // Meeting actions loading state
  const [meetingActionLoading, setMeetingActionLoading] = useState<boolean>(false);
  const [meetingActionMessage, setMeetingActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Report submission state
  const [reportOutcome, setReportOutcome] = useState<
    typeof ProjectVerificationStatus.Verified | typeof ProjectVerificationStatus.Failed
  >(ProjectVerificationStatus.Verified);
  const [reportSummary, setReportSummary] = useState<string>('');
  const [reportFindings, setReportFindings] = useState<string>('');
  const [reportRecommendations, setReportRecommendations] = useState<string>('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [submittingReport, setSubmittingReport] = useState<boolean>(false);
  const [reportSubmitError, setReportSubmitError] = useState<string | null>(null);
  const [reportSubmitSuccess, setReportSubmitSuccess] = useState<string | null>(null);

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

  const copyToClipboard = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Thao tác với cuộc họp: Tạo / Lấy phòng
  const handleCreateMeeting = async () => {
    if (!id) return;
    setMeetingActionLoading(true);
    setMeetingActionMessage(null);
    try {
      const res = await verificatorAssignmentsService.createOrGetMeeting(id);
      setMeeting(res);
      setMeetingActionMessage({ type: 'success', text: 'Khởi tạo phòng họp xác minh thành công.' });
    } catch (err) {
      setMeetingActionMessage({
        type: 'error',
        text: parseAssignmentErrorMessage(err, 'Không thể khởi tạo phòng họp.'),
      });
    } finally {
      setMeetingActionLoading(false);
    }
  };

  // Thao tác: Tham gia họp (Join)
  const handleJoinMeeting = async () => {
    if (!id) return;
    setMeetingActionLoading(true);
    setMeetingActionMessage(null);
    try {
      const joinData = await verificatorAssignmentsService.joinMeeting(id);
      if (joinData.joinUrl) {
        window.open(joinData.joinUrl, '_blank', 'noopener,noreferrer');
        setMeetingActionMessage({
          type: 'success',
          text: 'Đã mở phòng họp trong tab mới. Hãy kiểm tra microphone và webcam.',
        });
      } else {
        throw new Error('Không nhận được đường dẫn tham gia phòng họp.');
      }
    } catch (err) {
      setMeetingActionMessage({
        type: 'error',
        text: parseAssignmentErrorMessage(err, 'Không thể lấy liên kết tham gia phòng họp.'),
      });
    } finally {
      setMeetingActionLoading(false);
    }
  };

  // Thao tác: Bắt đầu cuộc họp
  const handleStartMeeting = async () => {
    if (!id) return;
    setMeetingActionLoading(true);
    setMeetingActionMessage(null);
    try {
      const updated = await verificatorAssignmentsService.startMeeting(id);
      setMeeting(updated);
      setMeetingActionMessage({ type: 'success', text: 'Đã ghi nhận bắt đầu buổi họp xác minh.' });
      void loadDetail();
    } catch (err) {
      setMeetingActionMessage({
        type: 'error',
        text: parseAssignmentErrorMessage(err, 'Không thể ghi nhận bắt đầu cuộc họp.'),
      });
    } finally {
      setMeetingActionLoading(false);
    }
  };

  // Thao tác: Kết thúc cuộc họp
  const handleEndMeeting = async () => {
    if (!id) return;
    if (!window.confirm('Bạn có chắc chắn muốn kết thúc buổi họp thẩm định này? Sau khi kết thúc bạn có thể lập báo cáo thẩm định.')) {
      return;
    }
    setMeetingActionLoading(true);
    setMeetingActionMessage(null);
    try {
      const updated = await verificatorAssignmentsService.endMeeting(id);
      setMeeting(updated);
      setMeetingActionMessage({ type: 'success', text: 'Đã ghi nhận kết thúc buổi họp xác minh.' });
      void loadDetail();
    } catch (err) {
      setMeetingActionMessage({
        type: 'error',
        text: parseAssignmentErrorMessage(err, 'Không thể ghi nhận kết thúc cuộc họp.'),
      });
    } finally {
      setMeetingActionLoading(false);
    }
  };

  // Thao tác: Nộp báo cáo thẩm định
  const handleSubmitReport = async () => {
    if (!id) return;
    if (!reportSummary.trim() || !reportFindings.trim() || !reportRecommendations.trim()) {
      setReportSubmitError('Vui lòng điền đầy đủ Tóm tắt, Bằng chứng đối chiếu và Khuyến nghị.');
      return;
    }

    setSubmittingReport(true);
    setReportSubmitError(null);
    try {
      await verificatorAssignmentsService.submitReport({
        assignmentId: id,
        summary: reportSummary.trim(),
        findings: reportFindings.trim(),
        recommendations: reportRecommendations.trim(),
        outcome: reportOutcome,
      });

      setIsSubmitModalOpen(false);
      setReportSubmitSuccess('Nộp báo cáo thẩm định thành công! Phân công đã hoàn tất.');
      void loadDetail();
      setActiveTab('report');
    } catch (err) {
      setReportSubmitError(parseAssignmentErrorMessage(err, 'Không thể nộp báo cáo thẩm định. Vui lòng thử lại.'));
    } finally {
      setSubmittingReport(false);
    }
  };

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
  const canStartMeeting = !isMeetingStarted && assignment.status !== VerificationAssignmentStatus.Cancelled;
  const canEndMeeting = isMeetingStarted && !isMeetingEnded && assignment.status !== VerificationAssignmentStatus.Cancelled;

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
                onClick={() => {
                  setActiveTab('report');
                  setIsSubmitModalOpen(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-2 transition"
              >
                <FileCheck className="w-4 h-4" />
                Nộp báo cáo thẩm định
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
        <div className="space-y-6">
          {meetingActionMessage && (
            <div
              className={`p-4 rounded-xl border text-xs sm:text-sm flex items-start gap-3 ${
                meetingActionMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {meetingActionMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{meetingActionMessage.text}</span>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Video className="w-5 h-5 text-blue-600" />
                  Phòng họp thẩm định trực tuyến (Jitsi Meet)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Verificator và Trưởng nhóm dự án sẽ tham gia phòng họp để phỏng vấn và đối chiếu sản phẩm.
                </p>
              </div>

              {/* Status Badge */}
              <div>
                {isMeetingEnded ? (
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full border border-slate-200 inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                    Buổi họp đã kết thúc
                  </span>
                ) : isMeetingStarted ? (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
                    Đang trong buổi họp
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200 inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Chưa bắt đầu
                  </span>
                )}
              </div>
            </div>

            {/* Thông tin phòng họp & Thời gian */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Lịch họp dự kiến:</span>
                <p className="font-semibold text-slate-800 mt-1">
                  {assignment.scheduledStartAt ? managementDate(assignment.scheduledStartAt) : 'Chưa xếp lịch'}
                  {assignment.scheduledEndAt && ` — ${managementDate(assignment.scheduledEndAt)}`}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Thời điểm bắt đầu thực tế:</span>
                <p className="font-semibold text-slate-800 mt-1">
                  {assignment.meetingStartAt || meeting?.meetingStartAt
                    ? managementDate(assignment.meetingStartAt || meeting?.meetingStartAt)
                    : 'Chưa bắt đầu'}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Thời điểm kết thúc thực tế:</span>
                <p className="font-semibold text-slate-800 mt-1">
                  {assignment.meetingEndAt || meeting?.meetingEndAt
                    ? managementDate(assignment.meetingEndAt || meeting?.meetingEndAt)
                    : 'Chưa kết thúc'}
                </p>
              </div>
            </div>

            {/* Room Info & Join link */}
            {meeting?.roomName && (
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-blue-900">
                    Tên phòng họp: <span className="font-mono font-bold text-blue-700">{meeting.roomName}</span>
                  </span>
                  {meeting.joinUrl && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(meeting.joinUrl || '', 'join-url')}
                      className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                    >
                      {copiedKey === 'join-url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      Sao chép liên kết phòng họp
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons for Meeting */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {!meeting?.roomName && (
                <button
                  type="button"
                  disabled={meetingActionLoading}
                  onClick={() => void handleCreateMeeting()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition disabled:opacity-50"
                >
                  <Video className="w-4 h-4" />
                  {meetingActionLoading ? 'Đang khởi tạo...' : 'Tạo phòng họp'}
                </button>
              )}

              <button
                type="button"
                disabled={meetingActionLoading}
                onClick={() => void handleJoinMeeting()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition disabled:opacity-50"
              >
                <ExternalLink className="w-4 h-4" />
                {meetingActionLoading ? 'Đang kết nối...' : 'Tham gia buổi họp (Mở tab mới)'}
              </button>

              {canStartMeeting && (
                <button
                  type="button"
                  disabled={meetingActionLoading}
                  onClick={() => void handleStartMeeting()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  Bắt đầu cuộc họp
                </button>
              )}

              {canEndMeeting && (
                <button
                  type="button"
                  disabled={meetingActionLoading}
                  onClick={() => void handleEndMeeting()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition disabled:opacity-50"
                >
                  <Square className="w-4 h-4" />
                  Kết thúc cuộc họp
                </button>
              )}
            </div>

            {/* Hướng dẫn & Lưu ý */}
            <div className="border-t border-slate-100 pt-4 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Lưu ý nghiệp vụ:</p>
              <p>• Nhấn <strong>Bắt đầu cuộc họp</strong> khi phiên xác minh chính thức diễn ra.</p>
              <p>• Nhấn <strong>Kết thúc cuộc họp</strong> sau khi phỏng vấn xong. Đây là điều kiện bắt buộc để hệ thống cho phép bạn nộp báo cáo kết luận thẩm định.</p>
            </div>
          </div>
        </div>
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
        <div className="space-y-6">
          {reportSubmitSuccess && (
            <div className="p-4 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{reportSubmitSuccess}</span>
            </div>
          )}

          {/* ĐÃ CÓ BÁO CÁO -> HIỂN THỊ CHI TIẾT BÁO CÁO */}
          {hasReport && report ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                    Báo cáo Kết luận Thẩm định đã nộp
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Ngày gửi báo cáo: {managementDate(report.submittedAt)}
                  </p>
                </div>

                <div>
                  {report.outcome === ProjectVerificationStatus.Verified ? (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Kết luận: ĐẠT CHUẨN (VERIFIED)
                    </span>
                  ) : report.outcome === ProjectVerificationStatus.Failed ? (
                    <span className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full border border-rose-200 inline-flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" />
                      Kết luận: KHÔNG ĐẠT (FAILED)
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full border border-slate-200">
                      Đã ghi nhận kết quả
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-5 text-xs sm:text-sm">
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-800">1. Tóm tắt buổi xác minh (Summary):</h3>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {report.summary}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-800">2. Bằng chứng và kết quả đối chiếu (Findings):</h3>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {report.findings || '—'}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-800">3. Khuyến nghị cho đề tài / dự án (Recommendations):</h3>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {report.recommendations || '—'}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                Lưu ý: Báo cáo kết luận thẩm định đã được ghi nhận trên hệ thống và chuyển trạng thái phân công thành <strong>Đã hoàn thành</strong>. Quy định nghiệp vụ không cho phép sửa đổi báo cáo sau khi nộp.
              </div>
            </div>
          ) : (
            /* CHƯA CÓ BÁO CÁO -> NÚT HOẶC FORM NỘP BÁO CÁO */
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Lập Báo cáo Kết luận Thẩm định
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Báo cáo kết luận cần tổng hợp kết quả đối chiếu tài liệu và buổi phỏng vấn xác minh trực tuyến.
                  </p>
                </div>
              </div>

              {/* Điều kiện tiên quyết */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <span className="font-semibold text-slate-800">Điều kiện để nộp báo cáo:</span>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Tài khoản Verificator có quyền phụ trách phân công</span>
                  </li>
                  <li className="flex items-center gap-2">
                    {isMeetingCompletedForReport ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    )}
                    <span>
                      Buổi họp xác minh trực tuyến đã bắt đầu và kết thúc (
                      {isMeetingCompletedForReport ? 'Đã hoàn thành' : 'Chưa họp xong'}
                      )
                    </span>
                  </li>
                </ul>
              </div>

              {!isMeetingCompletedForReport && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Chưa thể nộp báo cáo thẩm định</p>
                    <p className="mt-0.5">
                      Vui lòng chuyển sang tab <strong>Buổi họp Thẩm định</strong> để khởi động và kết thúc phiên họp trực tuyến trước khi hoàn tất báo cáo kết luận.
                    </p>
                  </div>
                </div>
              )}

              {/* Nút mở Form nộp */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!isMeetingCompletedForReport}
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-2 transition disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                  Điền và nộp Báo cáo thẩm định
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL NỘP BÁO CÁO THẨM ĐỊNH */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Nộp Báo cáo Kết luận Thẩm định</h3>
                <p className="text-xs text-slate-500 mt-0.5">Dự án: {project.title}</p>
              </div>
              <button
                type="button"
                onClick={() => !submittingReport && setIsSubmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {reportSubmitError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{reportSubmitError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSubmitReport();
              }}
              className="space-y-4 text-xs"
            >
              {/* Chọn Outcome */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800">
                  Kết luận thẩm định <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                      reportOutcome === ProjectVerificationStatus.Verified
                        ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="outcome"
                      value={ProjectVerificationStatus.Verified}
                      checked={reportOutcome === ProjectVerificationStatus.Verified}
                      onChange={() => setReportOutcome(ProjectVerificationStatus.Verified)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="font-bold text-slate-800">Đạt chuẩn (Verified)</p>
                      <p className="text-[11px] text-slate-500">Dự án đáp ứng đầy đủ yêu cầu xác thực</p>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                      reportOutcome === ProjectVerificationStatus.Failed
                        ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="outcome"
                      value={ProjectVerificationStatus.Failed}
                      checked={reportOutcome === ProjectVerificationStatus.Failed}
                      onChange={() => setReportOutcome(ProjectVerificationStatus.Failed)}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <p className="font-bold text-slate-800">Không đạt (Failed)</p>
                      <p className="text-[11px] text-slate-500">Hồ sơ hoặc buổi phỏng vấn không đạt tiêu chuẩn</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Tóm tắt */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800">
                    Tóm tắt buổi xác minh (Summary) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">{reportSummary.length}/10.000 ký tự</span>
                </div>
                <textarea
                  rows={3}
                  required
                  maxLength={10000}
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  placeholder="Khái quát quá trình làm việc với nhóm đề tài, diễn biến buổi họp..."
                  className={managementInput}
                />
              </div>

              {/* Bằng chứng đối chiếu */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800">
                    Bằng chứng và kết quả đối chiếu (Findings) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">{reportFindings.length}/30.000 ký tự</span>
                </div>
                <textarea
                  rows={4}
                  required
                  maxLength={30000}
                  value={reportFindings}
                  onChange={(e) => setReportFindings(e.target.value)}
                  placeholder="Chi tiết các sản phẩm, đường link repository, bằng chứng đối chất, kết quả demo thực tế..."
                  className={managementInput}
                />
              </div>

              {/* Khuyến nghị */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800">
                    Các khuyến nghị cho dự án (Recommendations) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">{reportRecommendations.length}/10.000 ký tự</span>
                </div>
                <textarea
                  rows={3}
                  required
                  maxLength={10000}
                  value={reportRecommendations}
                  onChange={(e) => setReportRecommendations(e.target.value)}
                  placeholder="Nhận xét hướng cải thiện, yêu cầu bảo mật, góp ý cho nhóm tác giả..."
                  className={managementInput}
                />
              </div>

              {/* Cảnh báo không thể sửa */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Lưu ý quan trọng:</strong> Báo cáo sau khi nộp sẽ tự động hoàn tất phân công và cập nhật kết quả thẩm định chính thức cho dự án. Bạn <strong>không thể chỉnh sửa hay hủy</strong> báo cáo sau khi gửi.
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={submittingReport}
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingReport ? 'Đang gửi báo cáo...' : 'Xác nhận Nộp báo cáo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificatorProjectDetailPage;
