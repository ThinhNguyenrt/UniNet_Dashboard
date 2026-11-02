import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Video,
  ChevronRight,
  Calendar,
  AlertCircle,
  FileText,
  Filter,
} from 'lucide-react';
import {
  verificatorAssignmentsService,
  parseAssignmentErrorMessage,
} from '../../services/verificator-assignments.service';
import {
  type AssignmentResponse,
  type AssignmentsResponse,
  VerificationAssignmentStatus,
  assignmentStatusLabels,
  assignmentStatusStyles,
} from '../../types/verificator-assignments';
import { managementDate, managementInput } from '../../utils/management';

export const VerificatorProjectsPage: React.FC = () => {
  const navigate = useNavigate();

  // State quản lý danh sách và bộ lọc
  const [statusFilter, setStatusFilter] = useState<number | -1>(-1); // -1 là Tất cả
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Data fetching state
  const [data, setData] = useState<AssignmentsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Thống kê nhanh tổng quan
  const [allAssignments, setAllAssignments] = useState<AssignmentResponse[]>([]);

  // Tải danh sách phân công
  const loadAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await verificatorAssignmentsService.listMyAssignments({
        status: statusFilter === -1 ? undefined : statusFilter,
        page,
        pageSize,
      });
      setData(result);

      // Nếu đang ở tab Tất cả và trang 1 thì lưu trữ để tính stats
      if (statusFilter === -1 && page === 1) {
        setAllAssignments(result.assignments);
      }
    } catch (err) {
      setError(parseAssignmentErrorMessage(err, 'Không thể tải danh sách dự án được phân công.'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAssignments();
  }, [loadAssignments]);

  // Lọc dữ liệu client-side theo từ khóa tìm kiếm (mã phân công hoặc mã hồ sơ)
  const filteredAssignments = (data?.assignments || []).filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLowerCase();
    return (
      item.id.toLowerCase().includes(query) ||
      item.projectVerificationId.toLowerCase().includes(query)
    );
  });

  // Đếm số lượng theo trạng thái từ danh sách đã tải
  const counts = {
    total: data?.totalItems || 0,
    assigned: allAssignments.filter((a) => a.status === VerificationAssignmentStatus.Assigned).length,
    completed: allAssignments.filter((a) => a.status === VerificationAssignmentStatus.Completed).length,
    overdue: allAssignments.filter((a) => a.status === VerificationAssignmentStatus.Overdue).length,
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Nút làm mới */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-blue-600" />
            Dự án Thẩm định được Phân công
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý các hồ sơ dự án sinh viên và đề tài học thuật được giao cho vai trò Verificator thẩm định.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadAssignments()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng phân công</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1.5">{counts.total}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Toàn bộ hồ sơ được giao</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Cần thẩm định
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1.5">
            {statusFilter === VerificationAssignmentStatus.Assigned ? counts.total : counts.assigned}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Đang chờ xử lý & họp</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã hoàn thành
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1.5">
            {statusFilter === VerificationAssignmentStatus.Completed ? counts.total : counts.completed}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Đã nộp báo cáo kết luận</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Quá hạn
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1.5">
            {statusFilter === VerificationAssignmentStatus.Overdue ? counts.total : counts.overdue}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Vượt quá hạn nộp báo cáo</p>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold">Lỗi tải dữ liệu phân công</p>
            <p className="mt-0.5">{error}</p>
            <button
              type="button"
              onClick={() => void loadAssignments()}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Trạng thái:
          </span>
          {[
            { label: 'Tất cả', value: -1 },
            { label: 'Đang phân công', value: VerificationAssignmentStatus.Assigned },
            { label: 'Đã hoàn thành', value: VerificationAssignmentStatus.Completed },
            { label: 'Quá hạn', value: VerificationAssignmentStatus.Overdue },
            { label: 'Đã hủy', value: VerificationAssignmentStatus.Cancelled },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setStatusFilter(item.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === item.value
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search input & Page Size selector */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm phân công..."
              className={managementInput + ' pl-9 text-xs'}
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500">
            <span>Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 outline-blue-500"
            >
              <option value={10}>10 dòng</option>
              <option value={20}>20 dòng</option>
              <option value={50}>50 dòng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Table / Cards */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <FolderKanban className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Không tìm thấy phân công nào phù hợp</p>
            <p className="text-xs text-slate-400">
              {searchQuery
                ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc trạng thái.'
                : 'Bạn hiện chưa có phân công nào thuộc trạng thái này.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80">
                <tr>
                  <th className="p-4">Hồ sơ thẩm định</th>
                  <th className="p-4">Ngày giao / Hạn chót</th>
                  <th className="p-4">Lịch họp xác minh</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredAssignments.map((assignment, index) => {
                  const style = assignmentStatusStyles[assignment.status] || assignmentStatusStyles[VerificationAssignmentStatus.Assigned];
                  const hasMeeting = Boolean(assignment.scheduledStartAt);
                  const isMeetingCompleted = Boolean(assignment.meetingStartAt && assignment.meetingEndAt);

                  return (
                    <tr
                      key={assignment.id}
                      onClick={() => navigate(`/assessor/projects/${assignment.id}`)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      {/* Hồ sơ thẩm định */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs">
                            <FolderKanban className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>Hồ sơ thẩm định #{(page - 1) * pageSize + index + 1}</span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Tiếp nhận: {managementDate(assignment.createdAt)}
                          </p>
                        </div>
                      </td>

                      {/* Ngày giao / Hạn chót */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="flex items-center gap-1.5 text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Giao: {managementDate(assignment.assignedAt)}</span>
                          </p>
                          <p className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Hạn: {managementDate(assignment.reportDueAt)}</span>
                          </p>
                        </div>
                      </td>

                      {/* Lịch họp */}
                      <td className="p-4">
                        {hasMeeting ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-slate-800 font-medium">
                              <Video className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              {managementDate(assignment.scheduledStartAt)}
                            </span>
                            <div>
                              {isMeetingCompleted ? (
                                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                                  Đã kết thúc họp
                                </span>
                              ) : assignment.meetingStartAt ? (
                                <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded animate-pulse">
                                  Đang diễn ra
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">Chưa bắt đầu</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Chưa xếp lịch</span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${style.bg} ${style.text} ${style.border}`}
                        >
                          {assignmentStatusLabels[assignment.status] ?? 'Không xác định'}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => navigate(`/assessor/projects/${assignment.id}?tab=meeting`)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1 transition"
                            title="Truy cập phòng họp xác minh"
                          >
                            <Video className="w-3.5 h-3.5 text-blue-600" />
                            <span className="hidden md:inline">Phòng họp</span>
                          </button>
                          {assignment.status === VerificationAssignmentStatus.Completed && (
                            <button
                              type="button"
                              onClick={() => navigate(`/assessor/projects/${assignment.id}?tab=report`)}
                              className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1 transition"
                              title="Xem báo cáo thẩm định đã nộp"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">Báo cáo</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => navigate(`/assessor/projects/${assignment.id}`)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1 transition"
                          >
                            <span>Xem chi tiết</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang (Pagination) */}
        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Hiển thị trang <strong>{data.page}</strong> / <strong>{data.totalPages}</strong> ({data.totalItems} kết quả)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 font-medium"
              >
                Trang trước
              </button>
              <button
                type="button"
                disabled={page >= data.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 font-medium"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificatorProjectsPage;
