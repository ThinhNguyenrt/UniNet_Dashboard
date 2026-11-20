import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  User,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdminManagement } from '../../context/admin-management-context';
import { communityReportService } from '../../services/community-report.service';
import {
  ContentReportStatus,
  PostStatus,
  contentReportStatusLabels,
  postStatusLabels,
  type ContentReportResponse,
} from '../../types/community-report';
import { ManagementSkeleton } from '../../components/management/ManagementUI';

export const ComplaintDetailPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const access = useAdminManagement();

  // Detail state
  const [report, setReport] = useState<ContentReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success / notification message
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  // Action popup states: 'no_violation' | 'violation' | null
  const [pendingDecision, setPendingDecision] = useState<'no_violation' | 'violation' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [popupError, setPopupError] = useState<string | null>(null);

  // Image preview modal state
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Permission check
  const isAllowedRole = currentUser?.role === 'admin' || currentUser?.role === 'moderator';
  const hasPermission =
    access.has('community.review') ||
    (currentUser?.role === 'admin' && access.capabilities === null);

  const rolePrefix = currentUser?.role === 'admin' ? '/admin' : '/moderator';

  // Load report detail
  const loadDetail = useCallback(async () => {
    if (!reportId) {
      setErrorMessage('Đường dẫn báo cáo không hợp lệ.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await communityReportService.getReportById(reportId);
      setReport(data);
    } catch (err: unknown) {
      const businessErr = communityReportService.extractBusinessError(err);
      if (businessErr.status === 404) {
        setErrorMessage('Không tìm thấy báo cáo vi phạm yêu cầu. Báo cáo có thể đã bị xóa hoặc chưa sẵn sàng.');
      } else if (businessErr.status === 403) {
        setErrorMessage('Tài khoản không có quyền kiểm duyệt báo cáo vi phạm.');
      } else {
        setErrorMessage(businessErr.message || 'Không thể tải thông tin chi tiết báo cáo.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    if (isAllowedRole && hasPermission) {
      loadDetail();
    }
  }, [loadDetail, isAllowedRole, hasPermission]);

  // Handle Review Decision submit (Called strictly after clicking confirm inside popup)
  const handleConfirmReview = async () => {
    if (!report || !pendingDecision) return;

    const isViolation = pendingDecision === 'violation';
    setIsSubmitting(true);
    setPopupError(null);

    try {
      const updated = await communityReportService.reviewReport(report.id, isViolation);
      setReport(updated);
      setPendingDecision(null);

      const decisionText = isViolation
        ? 'Đã xác nhận bài đăng vi phạm. Bài đăng đã được chuyển sang trạng thái ẩn khỏi cộng đồng.'
        : 'Đã xác nhận bài đăng không vi phạm. Trạng thái bài đăng được giữ nguyên.';
      setFeedback({
        type: 'success',
        text: decisionText,
      });
    } catch (err: unknown) {
      const businessErr = communityReportService.extractBusinessError(err);

      // Handle 409 REPORT_ALREADY_REVIEWED as required:
      // "Với 409, đóng popup và tải lại dữ liệu theo trạng thái mới nhất."
      if (businessErr.status === 409 || businessErr.code === 'REPORT_ALREADY_REVIEWED') {
        setPendingDecision(null);
        setFeedback({
          type: 'info',
          text: 'Báo cáo này đã được kiểm duyệt trước đó. Đang tải lại dữ liệu mới nhất...',
        });
        await loadDetail();
        return;
      }

      setPopupError(businessErr.message || 'Thao tác xử lý thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Date formatter
  const formatDate = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'medium',
        timeZone: 'Asia/Ho_Chi_Minh',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  // Render report status badge
  const renderReportStatusBadge = (status: ContentReportStatus) => {
    switch (status) {
      case ContentReportStatus.Open:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            {contentReportStatusLabels[ContentReportStatus.Open]}
          </span>
        );
      case ContentReportStatus.Resolved:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {contentReportStatusLabels[ContentReportStatus.Resolved]}
          </span>
        );
      case ContentReportStatus.Dismissed:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            {contentReportStatusLabels[ContentReportStatus.Dismissed]}
          </span>
        );
      default:
        return null;
    }
  };

  // Render post status badge
  const renderPostStatusBadge = (postStatus: PostStatus, isDeleted: boolean) => {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {isDeleted && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            Bài đã xóa
          </span>
        )}
        {(() => {
          switch (postStatus) {
            case PostStatus.Published:
              return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  {postStatusLabels[PostStatus.Published]}
                </span>
              );
            case PostStatus.Hidden:
              return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  {postStatusLabels[PostStatus.Hidden]}
                </span>
              );
            case PostStatus.Blocked:
              return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                  {postStatusLabels[PostStatus.Blocked]}
                </span>
              );
            case PostStatus.PendingReview:
            default:
              return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  {postStatusLabels[PostStatus.PendingReview]}
                </span>
              );
          }
        })()}
      </div>
    );
  };

  // Permission checks
  if (!isAllowedRole) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Không có quyền truy cập</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Chức năng xử lý báo cáo bài đăng cộng đồng chỉ dành cho Quản trị viên và Kiểm duyệt viên.
        </p>
        <Link
          to="/"
          className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
        >
          Trang chủ
        </Link>
      </div>
    );
  }

  if (access.loading) {
    return <ManagementSkeleton />;
  }

  if (!hasPermission) {
    return (
      <div className="p-8 bg-white border border-rose-200 rounded-2xl text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-rose-900">Thiếu quyền kiểm duyệt</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Tài khoản của bạn không có quyền kiểm duyệt cộng đồng (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-700 font-mono">community.review</code>).
        </p>
        <button
          type="button"
          onClick={() => navigate(`${rolePrefix}/complaints`)}
          className="inline-block mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div>
        <nav className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
          <Link
            to={`${rolePrefix}/complaints`}
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Quay lại danh sách khiếu nại</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-medium">Chi tiết báo cáo</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-7 h-7 text-blue-600" />
              Chi tiết báo cáo bài đăng
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Kiểm tra nội dung vi phạm và đưa ra quyết định xử lý
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadDetail}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-blue-600 flex-shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main loading & error states */}
      {isLoading ? (
        <div className="p-16 bg-white border border-slate-200 rounded-2xl text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-500">Đang tải thông tin chi tiết báo cáo...</p>
        </div>
      ) : errorMessage ? (
        <div className="p-8 bg-white border border-rose-200 rounded-2xl text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Không thể tải báo cáo</h2>
          <p className="text-xs text-rose-700 max-w-lg mx-auto">{errorMessage}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={loadDetail}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Thử lại
            </button>
            <Link
              to={`${rolePrefix}/complaints`}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Quay lại danh sách
            </Link>
          </div>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Soft-deleted post warning banner */}
          {report.isPostDeleted && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-bold">Bài đăng này đã bị xóa mềm</p>
                <p className="text-amber-700 mt-0.5">
                  Bài đăng đã bị xóa khỏi hệ thống. Thao tác xử lý báo cáo sẽ cập nhật trạng thái báo cáo và giữ nguyên trạng thái bài.
                </p>
              </div>
            </div>
          )}

          {/* Grid layout: Left is post content, Right is report metadata & actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 cols: Reported Post Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Post Content Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
                <div className="flex items-start justify-between border-b border-slate-100 pb-4 gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Nội dung bài đăng bị báo cáo
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs">
                        {(report.authorName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {report.authorName?.trim() || 'Người dùng ẩn danh'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Trạng thái bài
                    </span>
                    {renderPostStatusBadge(report.postStatus, report.isPostDeleted)}
                  </div>
                </div>

                {/* Text Description */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Nội dung văn bản:
                  </span>
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-normal min-h-[90px]">
                    {report.description?.trim() ? (
                      report.description
                    ) : (
                      <span className="italic text-slate-400">
                        (Bài viết này không có nội dung văn bản)
                      </span>
                    )}
                  </div>
                </div>

                {/* Media Images */}
                {report.mediaUrls && report.mediaUrls.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      Hình ảnh đính kèm ({report.mediaUrls.length}):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {report.mediaUrls.map((url, idx) => (
                        <div
                          key={idx}
                          onClick={() => setPreviewImageUrl(url)}
                          className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group cursor-pointer"
                        >
                          <img
                            src={url}
                            alt={`Đính kèm ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={e => {
                              (e.currentTarget as HTMLImageElement).src =
                                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23aaa" font-size="12">Lỗi tải ảnh</text></svg>';
                            }}
                          />
                          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-slate-900 text-[10px] font-semibold px-2 py-1 rounded-md shadow-xs transition-opacity">
                              Xem ảnh lớn
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 col: Report Metadata & Review Decision Panel */}
            <div className="space-y-6">
              {/* Report Info Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Thông tin báo cáo
                  </h3>
                  {renderReportStatusBadge(report.status)}
                </div>

                {/* Reporter */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    Người gửi báo cáo
                  </span>
                  <p className="text-xs font-bold text-slate-900">
                    {report.reporterName?.trim() || 'Người dùng ẩn danh'}
                  </p>
                </div>

                {/* CreatedAt */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Thời điểm gửi báo cáo
                  </span>
                  <p className="text-xs font-semibold text-slate-800">
                    {formatDate(report.createdAt)}
                  </p>
                </div>

                {/* Reason */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                    Lý do báo cáo vi phạm
                  </span>
                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs font-medium text-rose-800 leading-relaxed">
                    {report.reason}
                  </div>
                </div>
              </div>

              {/* Action Review Panel */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Quyết định xử lý
                  </h3>
                </div>

                {report.status === ContentReportStatus.Open ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">
                      Báo cáo này đang chờ bạn đưa ra quyết định xử lý. Vui lòng kiểm tra kỹ nội dung bài viết và lý do báo cáo trước khi xác nhận.
                    </p>

                    <div className="space-y-2 pt-1">
                      {/* Button: Không vi phạm */}
                      <button
                        type="button"
                        onClick={() => {
                          setPopupError(null);
                          setPendingDecision('no_violation');
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-xl border border-emerald-300 transition-colors shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Không vi phạm</span>
                      </button>

                      {/* Button: Xác nhận vi phạm */}
                      <button
                        type="button"
                        onClick={() => {
                          setPopupError(null);
                          setPendingDecision('violation');
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs"
                      >
                        <XCircle className="w-4 h-4 text-white" />
                        <span>Xác nhận vi phạm</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {report.status === ContentReportStatus.Resolved ? (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Đã xử lý: Không vi phạm
                        </div>
                        <p className="text-[11px] text-emerald-700">
                          Báo cáo đã được xác nhận không vi phạm quy chuẩn. Trạng thái bài đăng được giữ nguyên.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-rose-600" />
                          Đã xử lý: Xác nhận vi phạm
                        </div>
                        <p className="text-[11px] text-rose-700">
                          Báo cáo đã được chấp thuận vi phạm. Bài đăng đã bị chuyển sang trạng thái ẩn khỏi bảng tin cộng đồng.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* CONFIRMATION POPUP MODAL */}
      {pendingDecision !== null && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => {
            if (!isSubmitting) setPendingDecision(null);
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5 my-8"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {pendingDecision === 'no_violation' ? (
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {pendingDecision === 'no_violation'
                      ? 'Xác nhận bài đăng không vi phạm?'
                      : 'Xác nhận bài đăng vi phạm?'}
                  </h3>
                </div>
              </div>

              {!isSubmitting && (
                <button
                  type="button"
                  onClick={() => setPendingDecision(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="text-xs text-slate-600 leading-relaxed">
              {pendingDecision === 'no_violation' ? (
                <p>
                  Báo cáo sẽ được đánh dấu đã xử lý. Trạng thái hiển thị của bài được giữ như hiện tại.
                </p>
              ) : (
                <p>
                  Báo cáo sẽ được đánh dấu vi phạm. Nếu bài đang hiển thị, bài sẽ bị ẩn khỏi cộng đồng.
                </p>
              )}
            </div>

            {/* Popup Error */}
            {popupError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{popupError}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setPendingDecision(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmReview}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs disabled:opacity-50 transition-colors ${
                  pendingDecision === 'no_violation'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isSubmitting && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>
                  {pendingDecision === 'no_violation' ? 'Xác nhận' : 'Xác nhận vi phạm'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE PREVIEW LIGHTBOX */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImageUrl}
              alt="Xem trước ảnh bài đăng"
              className="max-h-[85vh] w-auto mx-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetailPage;

