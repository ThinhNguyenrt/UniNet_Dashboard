import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  RefreshCw,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
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

export const ComplaintsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const access = useAdminManagement();

  // Filter & Pagination states
  // Mặc định hiển thị báo cáo Chờ xử lý (status = 0)
  const [selectedStatus, setSelectedStatus] = useState<number | undefined>(ContentReportStatus.Open);
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Data states from real API
  const [reports, setReports] = useState<ContentReportResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Permission check: Admin and Moderator with community.review
  const isAllowedRole = currentUser?.role === 'admin' || currentUser?.role === 'moderator';
  const hasPermission =
    access.has('community.review') ||
    (currentUser?.role === 'admin' && access.capabilities === null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await communityReportService.getReports({
        status: selectedStatus,
        page,
        pageSize,
      });
      setReports(data || []);
    } catch (err: unknown) {
      const businessErr = communityReportService.extractBusinessError(err);
      if (businessErr.status === 403) {
        setErrorMessage('Tài khoản không có quyền kiểm duyệt báo cáo khiếu nại (community.review).');
      } else if (businessErr.status === 404) {
        setErrorMessage('Không tìm thấy danh sách báo cáo vi phạm hoặc API chưa được triển khai.');
      } else {
        setErrorMessage(businessErr.message || 'Không thể tải danh sách báo cáo khiếu nại.');
      }
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, page, pageSize]);

  useEffect(() => {
    if (isAllowedRole && hasPermission) {
      fetchReports();
    }
  }, [fetchReports, isAllowedRole, hasPermission]);

  // Client-side search filtering across authorName, reporterName, reason, description
  const filteredReports = useMemo(() => {
    if (!searchTerm.trim()) return reports;
    const q = searchTerm.toLowerCase();
    return reports.filter(r =>
      (r.authorName && r.authorName.toLowerCase().includes(q)) ||
      (r.reporterName && r.reporterName.toLowerCase().includes(q)) ||
      (r.reason && r.reason.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
  }, [reports, searchTerm]);

  // Formatter for date
  const formatDate = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'Asia/Ho_Chi_Minh',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  // Render badge for report status
  const renderReportStatusBadge = (status: ContentReportStatus) => {
    switch (status) {
      case ContentReportStatus.Open:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            {contentReportStatusLabels[ContentReportStatus.Open]}
          </span>
        );
      case ContentReportStatus.Resolved:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {contentReportStatusLabels[ContentReportStatus.Resolved]}
          </span>
        );
      case ContentReportStatus.Dismissed:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            {contentReportStatusLabels[ContentReportStatus.Dismissed]}
          </span>
        );
      default:
        return null;
    }
  };

  // Render badge for post status & deleted flag
  const renderPostStatusBadge = (postStatus: PostStatus, isDeleted: boolean) => {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {isDeleted ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
            Bài đã xóa
          </span>
        ) : (
          (() => {
            switch (postStatus) {
              case PostStatus.Published:
                return (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {postStatusLabels[PostStatus.Published]}
                  </span>
                );
              case PostStatus.Hidden:
                return (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    {postStatusLabels[PostStatus.Hidden]}
                  </span>
                );
              case PostStatus.Blocked:
                return (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                    {postStatusLabels[PostStatus.Blocked]}
                  </span>
                );
              case PostStatus.PendingReview:
              default:
                return (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    {postStatusLabels[PostStatus.PendingReview]}
                  </span>
                );
            }
          })()
        )}
      </div>
    );
  };

  // Check access permission block
  if (!isAllowedRole) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Không có quyền truy cập</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Chức năng xử lý khiếu nại và báo cáo vi phạm chỉ dành cho Quản trị viên và Kiểm duyệt viên.
        </p>
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
          Tài khoản của bạn không có quyền kiểm duyệt báo cáo vi phạm (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-700 font-mono">community.review</code>).
        </p>
      </div>
    );
  }

  const rolePrefix = currentUser?.role === 'admin' ? '/admin' : '/moderator';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="text-xs text-slate-400 mb-1">
            <span>Kiểm duyệt</span>
            <span className="mx-2">&gt;</span>
            <span className="text-slate-700 font-medium">Xử lý khiếu nại</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-blue-600" />
            Xử lý khiếu nại &amp; Báo cáo vi phạm
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tiếp nhận, kiểm tra bằng chứng bài viết bị báo cáo và đưa ra quyết định xử lý vi phạm công bằng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchReports}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Filter Tabs by Report Status */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => {
            setSelectedStatus(undefined);
            setPage(1);
          }}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            selectedStatus === undefined
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          Tất cả khiếu nại
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedStatus(ContentReportStatus.Open);
            setPage(1);
          }}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            selectedStatus === ContentReportStatus.Open
              ? 'border-amber-600 text-amber-700 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Chờ xử lý
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedStatus(ContentReportStatus.Resolved);
            setPage(1);
          }}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            selectedStatus === ContentReportStatus.Resolved
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Không vi phạm
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedStatus(ContentReportStatus.Dismissed);
            setPage(1);
          }}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            selectedStatus === ContentReportStatus.Dismissed
              ? 'border-rose-600 text-rose-700 bg-rose-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Xác nhận vi phạm
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tác giả, người khiếu nại, lý do, nội dung..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
          {filteredReports.length} khiếu nại trong trang
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={fetchReports}
            className="underline font-semibold hover:text-rose-950 flex-shrink-0"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Complaints Table - STRICTLY ONLY ONE BUTTON 'Xem chi tiết' PER ROW */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80">
              <tr>
                <th className="p-3.5 pl-4">Tác giả bài đăng</th>
                <th className="p-3.5">Trích đoạn bài viết</th>
                <th className="p-3.5">Lý do báo cáo</th>
                <th className="p-3.5">Người gửi khiếu nại</th>
                <th className="p-3.5 whitespace-nowrap">Thời điểm gửi</th>
                <th className="p-3.5 whitespace-nowrap">Trạng thái báo cáo</th>
                <th className="p-3.5 whitespace-nowrap">Trạng thái bài</th>
                <th className="p-3.5 pr-4 text-center whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Đang tải danh sách khiếu nại vi phạm...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldAlert className="w-8 h-8 text-slate-300" />
                      <span className="text-sm font-medium text-slate-500">
                        Không tìm thấy khiếu nại nào phù hợp.
                      </span>
                      <span className="text-xs text-slate-400">
                        {selectedStatus === ContentReportStatus.Open
                          ? 'Hiện tại không có khiếu nại nào đang chờ xử lý.'
                          : 'Hãy thử chọn bộ lọc trạng thái khác.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReports.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Author */}
                    <td className="p-3.5 pl-4 max-w-[180px]">
                      <div className="font-semibold text-slate-900 truncate">
                        {item.authorName?.trim() || 'Người dùng ẩn danh'}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate" title={item.authorUserId}>
                        {item.authorUserId}
                      </div>
                    </td>

                    {/* Description snippet */}
                    <td className="p-3.5 max-w-xs">
                      <p className="line-clamp-2 text-slate-700 leading-relaxed font-normal">
                        {item.description?.trim() || (
                          <span className="italic text-slate-400">
                            (Bài viết không có nội dung văn bản)
                          </span>
                        )}
                      </p>
                      {item.mediaUrls && item.mediaUrls.length > 0 && (
                        <div className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          <ImageIcon className="w-3 h-3" />
                          <span>{item.mediaUrls.length} hình ảnh</span>
                        </div>
                      )}
                    </td>

                    {/* Reason */}
                    <td className="p-3.5 max-w-[200px]">
                      <div className="text-rose-700 font-medium line-clamp-2 bg-rose-50/60 border border-rose-100 rounded-lg p-1.5 text-[11px]">
                        {item.reason}
                      </div>
                    </td>

                    {/* Reporter */}
                    <td className="p-3.5 max-w-[140px]">
                      <div className="font-medium text-slate-800 truncate">
                        {item.reporterName?.trim() || 'Người dùng ẩn danh'}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate" title={item.reporterUserId}>
                        {item.reporterUserId}
                      </div>
                    </td>

                    {/* CreatedAt */}
                    <td className="p-3.5 whitespace-nowrap text-slate-500">
                      {formatDate(item.createdAt)}
                    </td>

                    {/* Report Status */}
                    <td className="p-3.5 whitespace-nowrap">
                      {renderReportStatusBadge(item.status)}
                    </td>

                    {/* Post Status */}
                    <td className="p-3.5 whitespace-nowrap">
                      {renderPostStatusBadge(item.postStatus, item.isPostDeleted)}
                    </td>

                    {/* ONLY ONE ACTION BUTTON: Xem chi tiết */}
                    <td className="p-3.5 pr-4 text-center whitespace-nowrap">
                      <Link
                        to={`${rolePrefix}/complaints/${item.id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
                        title="Xem chi tiết khiếu nại"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>Xem chi tiết</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Trang <span className="font-semibold text-slate-800">{page}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Trước</span>
            </button>
            <button
              type="button"
              disabled={reports.length < pageSize || isLoading}
              onClick={() => setPage(p => p + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span>Sau</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintsPage;
