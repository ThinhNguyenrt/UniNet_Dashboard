import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  FolderKanban,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  ShieldAlert,
  User,
  Tag,
  Briefcase,
  FileText,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdminManagement } from '../../context/admin-management-context';
import { projectModerationService } from '../../services/project-moderation.service';
import type {
  PendingProjectModerationItem,
  PendingProjectModerationsResponse,
} from '../../types/project-moderation';
import {
  ModerationCheckResult,
  getModerationCheckResultLabel,
  getModerationCheckResultBadgeClass,
  sanitizeDisplayText,
} from '../../types/project-moderation';

export const ModeratorProjectsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const access = useAdminManagement();

  // Danh sách dữ liệu & Phân trang
  const [data, setData] = useState<PendingProjectModerationsResponse | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const pageSize = 10;
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState<boolean>(false);

  // Chi tiết dự án đang xem (bảng bên / drawer)
  const [selectedItem, setSelectedItem] = useState<PendingProjectModerationItem | null>(null);

  // Modal xác nhận quyết định (Approve / Reject)
  const [confirmModal, setConfirmModal] = useState<{
    action: 'approve' | 'reject';
    item: PendingProjectModerationItem;
  } | null>(null);
  const [reviewNote, setReviewNote] = useState<string>('');
  const [noteValidationError, setNoteValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Thông báo kết quả thao tác (Banner)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  // Ref lưu element kích hoạt để khôi phục focus khi đóng modal
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const modalTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const modalBoxRef = useRef<HTMLDivElement | null>(null);

  // Format thời gian tiếng Việt
  const formatDateTime = (dateStr?: string | null): string => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(date);
  };

  // Lấy tên người gửi an toàn (ưu tiên fullName, nếu không dùng nickname)
  const getSenderName = (creator?: { fullName?: string; nickname?: string } | null): string => {
    const raw = creator?.fullName?.trim() || creator?.nickname?.trim();
    return raw ? sanitizeDisplayText(raw) : 'Người dùng';
  };

  // Kiểm tra quyền project.review
  const isForbiddenByCapabilities =
    !access.loading &&
    access.capabilities !== null &&
    !access.has('project.review') &&
    currentUser?.role !== 'admin';

  const showForbidden = isForbidden || isForbiddenByCapabilities;

  // Tải danh sách hồ sơ chờ kiểm duyệt khi currentPage hoặc reloadKey thay đổi
  useEffect(() => {
    if (isForbiddenByCapabilities) {
      return;
    }

    let ignore = false;
    const controller = new AbortController();

    async function loadData() {
      try {
        const response = await projectModerationService.getPendingProjects(
          currentPage,
          pageSize,
          controller.signal
        );

        if (ignore) return;

        // Trường hợp trang hiện tại vượt quá tổng số trang mới
        if (response.totalPages > 0 && currentPage > response.totalPages) {
          setCurrentPage(response.totalPages);
          return;
        }

        // Trường hợp danh sách rỗng nhưng đang ở trang > 1
        if (response.totalItems === 0 && currentPage > 1) {
          setCurrentPage(1);
          return;
        }

        setData(response);
        setLoadError(null);
        setIsForbidden(false);
      } catch (err: unknown) {
        if (ignore || controller.signal.aborted) return;

        if (axios.isAxiosError(err)) {
          if (err.response?.status === 403) {
            setIsForbidden(true);
            setLoadError('Tài khoản không có quyền kiểm duyệt dự án (project.review).');
            return;
          }
          if (err.response?.status === 401) {
            setLoadError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            return;
          }
          if (err.code === 'ECONNABORTED' || !err.response) {
            setLoadError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
            return;
          }
        }
        setLoadError('Không thể tải danh sách dự án chờ kiểm duyệt. Vui lòng thử lại sau.');
      } finally {
        if (!ignore && !controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [currentPage, reloadKey, isForbiddenByCapabilities, pageSize]);

  // Kích hoạt làm mới danh sách
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  }, []);

  // Chuyển trang
  const handlePageChange = useCallback((newPage: number) => {
    setIsLoading(true);
    setCurrentPage(newPage);
  }, []);

  // Mở drawer xem chi tiết
  const handleOpenDetail = (item: PendingProjectModerationItem, triggerElement: HTMLElement) => {
    lastTriggerRef.current = triggerElement;
    setSelectedItem(item);
  };

  // Đóng drawer xem chi tiết
  const closeDetailDrawer = useCallback(() => {
    setSelectedItem(null);
    if (lastTriggerRef.current && !confirmModal) {
      lastTriggerRef.current.focus();
    }
  }, [confirmModal]);

  // Đóng modal xác nhận
  const closeConfirmModal = useCallback(() => {
    setConfirmModal(null);
    setNoteValidationError(null);
    if (lastTriggerRef.current) {
      lastTriggerRef.current.focus();
    }
  }, []);

  // Mở modal xác nhận Duyệt hoặc Từ chối
  const openConfirmModal = (
    action: 'approve' | 'reject',
    item: PendingProjectModerationItem,
    triggerElement: HTMLElement
  ) => {
    lastTriggerRef.current = triggerElement;
    setConfirmModal({ action, item });
    setNoteValidationError(null);
    // Giữ nguyên reviewNote nếu có thể thử lại, nếu đổi dự án thì làm mới
    if (!confirmModal || confirmModal.item.project.id !== item.project.id) {
      setReviewNote('');
    }
  };

  // Điều khiển phím Escape để đóng modal hoặc drawer
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (confirmModal && !isSubmitting) {
          closeConfirmModal();
        } else if (selectedItem && !confirmModal) {
          closeDetailDrawer();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmModal, isSubmitting, selectedItem, closeConfirmModal, closeDetailDrawer]);

  // Autofocus vào textarea khi mở modal
  useEffect(() => {
    if (confirmModal) {
      const timer = setTimeout(() => {
        modalTextareaRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [confirmModal]);

  // Xử lý gửi quyết định kiểm duyệt
  const handleSubmitDecision = async () => {
    if (!confirmModal) return;

    const { action, item } = confirmModal;
    const projectTitle = sanitizeDisplayText(item.project.title);
    const trimmedNote = reviewNote.trim();

    // Kiểm tra tính hợp lệ của lý do từ chối
    if (action === 'reject' && !trimmedNote) {
      setNoteValidationError('Vui lòng nhập lý do từ chối dự án.');
      modalTextareaRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setNoteValidationError(null);

    try {
      if (action === 'approve') {
        await projectModerationService.approveProject(item.project.id, trimmedNote || null);
      } else {
        await projectModerationService.rejectProject(item.project.id, trimmedNote);
      }

      // Xử lý thành công
      closeConfirmModal();
      setSelectedItem(null);
      setReviewNote('');
      setFeedback({
        type: 'success',
        message:
          action === 'approve'
            ? `Đã phê duyệt dự án "${projectTitle}" thành công.`
            : `Đã từ chối dự án "${projectTitle}" thành công.`,
      });

      // Kích hoạt tải lại hàng đợi
      handleRefresh();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;

        if (status === 401) {
          setFeedback({
            type: 'error',
            message: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
          });
          return;
        }

        if (status === 403) {
          setFeedback({
            type: 'error',
            message: 'Bạn không có quyền thực hiện thao tác kiểm duyệt dự án (project.review).',
          });
          return;
        }

        // Trường hợp 404 hoặc 409 (đã được người khác xử lý hoặc không còn ReviewRequired)
        if (status === 404 || status === 409) {
          closeConfirmModal();
          setSelectedItem(null);
          setFeedback({
            type: 'warning',
            message: `Hồ sơ kiểm duyệt của dự án "${projectTitle}" đã được người khác xử lý hoặc đã thay đổi trạng thái. Danh sách đã được làm mới.`,
          });
          handleRefresh();
          return;
        }

        // Lỗi mạng hoặc hết thời gian chờ
        if (err.code === 'ECONNABORTED' || !err.response) {
          setFeedback({
            type: 'warning',
            message:
              'Không thể kết nối đến máy chủ hoặc yêu cầu quá thời gian phản hồi. Quyết định có thể đã được tiếp nhận, vui lòng kiểm tra lại hàng đợi.',
          });
          return;
        }
      }

      // Lỗi chung khác: giữ nguyên ghi chú đã nhập để người dùng không bị mất nội dung
      setFeedback({
        type: 'error',
        message: 'Đã có lỗi xảy ra khi gửi quyết định kiểm duyệt. Vui lòng thử lại.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hiển thị nhãn kết quả kiểm tra tự động
  const renderCheckResultBadge = (
    label: string,
    result: unknown
  ) => {
    const text = getModerationCheckResultLabel(result);
    const badgeClass = getModerationCheckResultBadgeClass(result);

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}
      >
        {result === ModerationCheckResult.Passed && <CheckCircle2 className="w-3.5 h-3.5" />}
        {result === ModerationCheckResult.Failed && <XCircle className="w-3.5 h-3.5" />}
        {result === ModerationCheckResult.Error && <AlertTriangle className="w-3.5 h-3.5" />}
        {result === ModerationCheckResult.Pending && <Clock className="w-3.5 h-3.5" />}
        <span>{label}: {text}</span>
      </span>
    );
  };

  // Nếu người dùng không có quyền (403)
  if (showForbidden) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kiểm duyệt dự án</h1>
          <p className="text-sm text-slate-500 mt-1">
            Hàng đợi kiểm duyệt dự án mới đăng ký trên nền tảng UniNet.
          </p>
        </div>

        <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-xs">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Không có quyền truy cập</h2>
          <p className="text-sm text-slate-600 mt-2">
            Tài khoản của bạn không có quyền kiểm duyệt dự án (<code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">project.review</code>).
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Vui lòng liên hệ với Quản trị viên hệ thống để được phân quyền phù hợp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header trang */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kiểm duyệt dự án</h1>
          <p className="text-sm text-slate-500 mt-1">
            {data ? (
              <>
                Tổng số:{' '}
                <span className="font-semibold text-slate-800">{data.totalItems}</span> hồ sơ chờ kiểm duyệt
              </>
            ) : (
              'Đang tải thông tin hàng đợi...'
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200/90 shadow-2xs transition disabled:opacity-50"
            aria-label="Tải lại danh sách"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Tải lại</span>
          </button>
        </div>
      </div>

      {/* Thông báo kết quả thao tác (Feedback Banner) */}
      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 shadow-2xs transition ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : feedback.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            {feedback.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />}
            {feedback.type === 'warning' && <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />}
            {feedback.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Vùng nội dung chính */}
      {isLoading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-slate-600">Đang tải danh sách chờ kiểm duyệt...</p>
          </div>
        </div>
      ) : loadError ? (
        <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center shadow-xs">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-rose-800">{loadError}</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            Thử lại
          </button>
        </div>
      ) : !data || data.projects.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
            <FolderKanban className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Hiện không có dự án chờ kiểm duyệt</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Tất cả các dự án mới đã được thẩm định hoặc không có hồ sơ nào ở trạng thái cần kiểm duyệt thủ công.
          </p>
        </div>
      ) : (
        <>
          {/* 1. Giao diện Bảng trên màn hình máy tính (md:block) */}
          <div className="hidden md:block bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 text-slate-500 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th scope="col" className="p-4">Dự án</th>
                    <th scope="col" className="p-4">Người gửi</th>
                    <th scope="col" className="p-4">Lĩnh vực</th>
                    <th scope="col" className="p-4">Ngày gửi</th>
                    <th scope="col" className="p-4">Kết quả kiểm tra</th>
                    <th scope="col" className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {data.projects.map((item) => {
                    const projectTitle = sanitizeDisplayText(item.project.title);
                    const senderName = getSenderName(item.project.creator);
                    const projectField = sanitizeDisplayText(item.project.projectField) || 'Chưa phân loại';
                    const submittedDate = formatDateTime(item.submittedAt);

                    return (
                      <tr key={item.project.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            <FolderKanban className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span className="line-clamp-1">{projectTitle}</span>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-slate-800">
                          {senderName}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-lg text-xs bg-slate-100 text-slate-700">
                            {projectField}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 whitespace-nowrap">
                          {submittedDate}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1.5 items-start">
                            {renderCheckResultBadge('Nội dung', item.moderation.contentResult)}
                            {renderCheckResultBadge('Liên kết', item.moderation.linkResult)}
                          </div>
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => handleOpenDetail(item, e.currentTarget)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition"
                            aria-label={`Xem chi tiết dự án ${projectTitle}`}
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Giao diện Thẻ trên màn hình nhỏ (md:hidden) */}
          <div className="md:hidden space-y-3">
            {data.projects.map((item) => {
              const projectTitle = sanitizeDisplayText(item.project.title);
              const senderName = getSenderName(item.project.creator);
              const projectField = sanitizeDisplayText(item.project.projectField) || 'Chưa phân loại';
              const submittedDate = formatDateTime(item.submittedAt);

              return (
                <div
                  key={item.project.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span>{projectTitle}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 text-slate-700 flex-shrink-0">
                      {projectField}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div>
                      <span className="text-slate-400">Người gửi: </span>
                      <span className="font-medium text-slate-700">{senderName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Ngày gửi: </span>
                      <span className="font-medium text-slate-700">{submittedDate}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {renderCheckResultBadge('Nội dung', item.moderation.contentResult)}
                      {renderCheckResultBadge('Liên kết', item.moderation.linkResult)}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleOpenDetail(item, e.currentTarget)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition"
                      aria-label={`Xem chi tiết dự án ${projectTitle}`}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Phân trang phía máy chủ */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Hiển thị trang <span className="font-bold text-slate-900">{data.page}</span> /{' '}
              <span className="font-bold text-slate-900">{data.totalPages || 1}</span> (Tổng số{' '}
              <span className="font-bold text-slate-900">{data.totalItems}</span> hồ sơ)
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(Math.max(1, data.page - 1))}
                disabled={data.page <= 1 || isLoading}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                aria-label="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Trang trước</span>
              </button>

              <span className="px-3 py-1.5 bg-slate-100 text-slate-800 rounded-xl font-bold">
                {data.page}
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(Math.min(data.totalPages, data.page + 1))}
                disabled={data.page >= data.totalPages || isLoading}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                aria-label="Trang sau"
              >
                <span>Trang sau</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* 3. Bảng bên (Slide-over Drawer) xem chi tiết hồ sơ kiểm duyệt */}
      {selectedItem && (
        <div className="fixed inset-0 z-40 overflow-hidden" aria-labelledby="drawer-title" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={closeDetailDrawer}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {sanitizeDisplayText(selectedItem.project.projectField) || 'Chưa phân loại'}
                    </span>
                    <span className="text-xs text-slate-400">
                      Gửi lúc: {formatDateTime(selectedItem.submittedAt)}
                    </span>
                  </div>
                  <h2 id="drawer-title" className="text-xl font-bold text-slate-900 tracking-tight break-words">
                    {sanitizeDisplayText(selectedItem.project.title)}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeDetailDrawer}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                  aria-label="Đóng chi tiết"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-600">
                {/* Thông tin Người gửi */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                  <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Người gửi hồ sơ
                  </div>
                  <div className="font-semibold text-slate-900 text-sm">
                    {getSenderName(selectedItem.project.creator)}
                  </div>
                  {selectedItem.project.creator.nickname && (
                    <div className="text-slate-500">
                      Biệt danh: <span className="font-medium text-slate-700">{sanitizeDisplayText(selectedItem.project.creator.nickname)}</span>
                    </div>
                  )}
                  {selectedItem.project.memberTarget !== null && selectedItem.project.memberTarget !== undefined && (
                    <div className="text-slate-500">
                      Số lượng thành viên dự kiến: <span className="font-semibold text-slate-800">{selectedItem.project.memberTarget}</span>
                    </div>
                  )}
                </div>

                {/* Khu vực Kết quả kiểm tra tự động */}
                <div className="space-y-3">
                  <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Kết quả kiểm tra tự động
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                      <div className="text-[11px] text-slate-500 font-medium">Kiểm tra nội dung</div>
                      <div>{renderCheckResultBadge('Nội dung', selectedItem.moderation.contentResult)}</div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                      <div className="text-[11px] text-slate-500 font-medium">Kiểm tra liên kết</div>
                      <div>{renderCheckResultBadge('Liên kết', selectedItem.moderation.linkResult)}</div>
                    </div>
                  </div>

                  {selectedItem.moderation.confidence !== null && selectedItem.moderation.confidence !== undefined && (
                    <div className="text-slate-500 text-xs">
                      Độ tin cậy tự động: <span className="font-semibold text-slate-800">{Math.round(selectedItem.moderation.confidence * 100)}%</span>
                    </div>
                  )}

                  {selectedItem.moderation.violationReason && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-amber-800">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        Lý do cảnh báo / vi phạm:
                      </div>
                      <p className="whitespace-pre-line text-xs text-amber-950">
                        {sanitizeDisplayText(selectedItem.moderation.violationReason)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Mô tả dự án */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Mô tả dự án
                  </div>
                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 text-slate-800 whitespace-pre-line leading-relaxed text-xs">
                    {sanitizeDisplayText(selectedItem.project.description) || 'Không có mô tả chi tiết.'}
                  </div>
                </div>

                {/* Kỹ năng yêu cầu */}
                {selectedItem.project.skills && selectedItem.project.skills.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      Kỹ năng yêu cầu
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedItem.project.skills.map((skill) => (
                        <span
                          key={skill.skillName}
                          className="px-2.5 py-1 bg-white text-slate-700 text-xs font-medium rounded-lg border border-slate-200 shadow-2xs"
                        >
                          {sanitizeDisplayText(skill.skillName)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vị trí tuyển dụng */}
                {selectedItem.project.roleRequirements && selectedItem.project.roleRequirements.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      Vị trí cần tuyển ({selectedItem.project.roleRequirements.length})
                    </div>
                    <div className="space-y-2">
                      {selectedItem.project.roleRequirements.map((role) => (
                        <div
                          key={role.roleName}
                          className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{sanitizeDisplayText(role.roleName)}</span>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-md text-[11px]">
                              Số lượng: {role.quantity}
                            </span>
                          </div>
                          {role.requirements && (
                            <p className="text-slate-500 text-xs whitespace-pre-line">
                              {sanitizeDisplayText(role.requirements)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer: Nút Quyết định */}
              <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDetailDrawer}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={(e) => openConfirmModal('reject', selectedItem, e.currentTarget)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition inline-flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Từ chối</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => openConfirmModal('approve', selectedItem, e.currentTarget)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Duyệt dự án</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Hộp thoại Xác nhận Quyết định (Modal) */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby="confirm-modal-title"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => {
              if (!isSubmitting) closeConfirmModal();
            }}
            aria-hidden="true"
          />

          <div className="min-h-full flex items-center justify-center p-4">
            <div
              ref={modalBoxRef}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative z-10 border border-slate-200 space-y-4"
            >
              {/* Tiêu đề modal */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      confirmModal.action === 'approve'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}
                  >
                    {confirmModal.action === 'approve' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 id="confirm-modal-title" className="text-base font-bold text-slate-900">
                      {confirmModal.action === 'approve' ? 'Phê duyệt dự án' : 'Từ chối dự án'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Dự án: <span className="font-semibold text-slate-800">{sanitizeDisplayText(confirmModal.item.project.title)}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeConfirmModal}
                  disabled={isSubmitting}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition disabled:opacity-50"
                  aria-label="Đóng hộp thoại"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lời giải thích */}
              <p className="text-xs text-slate-600 leading-relaxed">
                {confirmModal.action === 'approve'
                  ? 'Khi được phê duyệt, dự án sẽ chuyển sang trạng thái Hoạt động (Active) và hiển thị trên toàn hệ thống UniNet.'
                  : 'Khi bị từ chối, dự án sẽ chuyển sang trạng thái Từ chối (Rejected). Người tạo dự án sẽ nhận được thông báo kèm lý do từ chối.'}
              </p>

              {/* Ô nhập ghi chú / lý do */}
              <div className="space-y-1.5">
                <label htmlFor="review-note-input" className="block text-xs font-semibold text-slate-700">
                  {confirmModal.action === 'approve' ? (
                    'Ghi chú phê duyệt (tùy chọn)'
                  ) : (
                    <span>
                      Lý do từ chối <span className="text-rose-500">* (bắt buộc)</span>
                    </span>
                  )}
                </label>
                <textarea
                  id="review-note-input"
                  ref={modalTextareaRef}
                  rows={4}
                  value={reviewNote}
                  onChange={(e) => {
                    setReviewNote(e.target.value);
                    if (noteValidationError) setNoteValidationError(null);
                  }}
                  disabled={isSubmitting}
                  placeholder={
                    confirmModal.action === 'approve'
                      ? 'Nhập ghi chú góp ý cho người tạo dự án nếu có...'
                      : 'Nhập rõ nguyên nhân vi phạm hoặc lý do từ chối để người gửi nắm thông tin...'
                  }
                  className={`w-full text-xs p-3 rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition ${
                    noteValidationError
                      ? 'border-rose-300 focus:ring-rose-500'
                      : 'border-slate-200 focus:ring-blue-500'
                  } disabled:opacity-50`}
                />
                {noteValidationError && (
                  <p role="alert" className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {noteValidationError}
                  </p>
                )}
              </div>

              {/* Nút hành động */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeConfirmModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmitDecision()}
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-white text-xs font-semibold rounded-xl shadow-xs transition inline-flex items-center gap-2 ${
                    confirmModal.action === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  } disabled:opacity-50`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang gửi quyết định...</span>
                    </>
                  ) : confirmModal.action === 'approve' ? (
                    <span>Xác nhận Duyệt</span>
                  ) : (
                    <span>Xác nhận Từ chối</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModeratorProjectsPage;
