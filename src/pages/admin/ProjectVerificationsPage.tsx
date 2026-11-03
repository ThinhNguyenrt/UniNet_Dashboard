import React, { useState, useEffect, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Filter,
  RotateCcw,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  FileText,
} from 'lucide-react';
import { adminProjectVerificationsService } from '../../services/admin-project-verifications.service';
import type {
  ProjectVerificationsResponse,
  ProjectVerificationFilter,
} from '../../types/admin-project-verifications';
import {
  ProjectVerificationStatus,
  projectVerificationStatusLabels,
  projectVerificationStatusStyles,
  VerificationBookingStatus,
  verificationBookingStatusLabels,
  verificationBookingStatusStyles,
} from '../../types/admin-project-verifications';
import { getApiErrorMessage } from '../../services/api';

type TabMode = 'all' | 'pending' | 'overdue';

export const ProjectVerificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<TabMode>('all');
  const [data, setData] = useState<ProjectVerificationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Filters state for "all" tab
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

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

  const formatSchedule = (start?: string | null, end?: string | null) => {
    if (!start) return 'Chưa xếp lịch';
    return `${formatDate(start)} - ${end ? formatDate(end).split(' ')[0] === formatDate(start).split(' ')[0] ? formatDate(end).split(' ')[1] : formatDate(end) : '—'}`;
  };

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    async function loadData() {
      try {
        let result: ProjectVerificationsResponse;
        if (activeTab === 'pending') {
          result = await adminProjectVerificationsService.getPendingAssignment(
            currentPage,
            pageSize,
            controller.signal
          );
        } else if (activeTab === 'overdue') {
          result = await adminProjectVerificationsService.getOverdue(
            currentPage,
            pageSize,
            controller.signal
          );
        } else {
          const filter: ProjectVerificationFilter = {
            page: currentPage,
            pageSize,
          };
          if (statusFilter !== 'all') {
            filter.status = Number(statusFilter) as ProjectVerificationStatus;
          }
          if (fromDate) {
            filter.from = new Date(fromDate).toISOString();
          }
          if (toDate) {
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);
            filter.to = to.toISOString();
          }
          result = await adminProjectVerificationsService.list(filter, controller.signal);
        }

        if (!ignore) {
          setData(result);
          setErrorMessage(null);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore && !controller.signal.aborted) {
          setErrorMessage(
            getApiErrorMessage(
              err,
              'Không thể tải danh sách hồ sơ thẩm định. Vui lòng thử lại.'
            )
          );
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [activeTab, currentPage, pageSize, statusFilter, fromDate, toDate, reloadKey]);

  const handleTabChange = (newTab: TabMode) => {
    if (newTab === activeTab) return;
    setIsLoading(true);
    startTransition(() => {
      setActiveTab(newTab);
      setCurrentPage(1);
    });
  };

  const handleResetFilter = () => {
    setIsLoading(true);
    setStatusFilter('all');
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Quản lý Thẩm định Dự án
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi hồ sơ thẩm định, điều phối chuyên viên đánh giá và xem kết quả báo cáo
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="self-start sm:self-auto px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors flex items-center gap-2"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1 bg-white px-4 pt-2 rounded-t-xl border-t border-x">
        <button
          onClick={() => handleTabChange('all')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Tất cả hồ sơ
        </button>
        <button
          onClick={() => handleTabChange('pending')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          Chờ phân công
        </button>
        <button
          onClick={() => handleTabChange('overdue')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'overdue'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          Quá hạn xử lý
        </button>
      </div>

      {/* Filter Bar (chỉ cho tab "Tất cả") */}
      {activeTab === 'all' && (
        <div className="bg-white p-4 border border-slate-200 shadow-sm rounded-b-xl flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Bộ lọc:</span>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setIsLoading(true);
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              {Object.entries(projectVerificationStatusLabels).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* From date */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Từ ngày:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setIsLoading(true);
                setFromDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* To date */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Đến ngày:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setIsLoading(true);
                setToDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {(statusFilter !== 'all' || fromDate || toDate) && (
            <button
              onClick={handleResetFilter}
              className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              Đặt lại lọc
            </button>
          )}
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {errorMessage ? (
          <div className="p-8 text-center space-y-3">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-700 font-medium">{errorMessage}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Đang tải danh sách hồ sơ thẩm định...</p>
          </div>
        ) : !data || data.verifications.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-700">
              {activeTab === 'pending'
                ? 'Không có hồ sơ nào đang chờ phân công'
                : activeTab === 'overdue'
                ? 'Không có hồ sơ nào bị quá hạn xử lý'
                : 'Không tìm thấy hồ sơ thẩm định phù hợp'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === 'all' && (statusFilter !== 'all' || fromDate || toDate)
                ? 'Hãy thử điều chỉnh lại bộ lọc trạng thái hoặc ngày gửi.'
                : 'Tất cả các hồ sơ hiện tại đã được xử lý đúng tiến độ.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold">
                                    <th className="py-3.5 px-4">Dự án</th>
                  <th className="py-3.5 px-3">Trạng thái thẩm định</th>
                  <th className="py-3.5 px-3">Trạng thái đặt lịch</th>
                  <th className="py-3.5 px-4">Lịch hẹn dự kiến</th>
                  <th className="py-3.5 px-4">Ngày gửi hồ sơ</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.verifications.map((item) => {
                  const statusStyle =
                    projectVerificationStatusStyles[item.status] ||
                    projectVerificationStatusStyles[ProjectVerificationStatus.Pending];
                  const bookingStyle =
                    verificationBookingStatusStyles[item.bookingStatus] ||
                    verificationBookingStatusStyles[VerificationBookingStatus.None];

                  return (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/admin/project-verifications/${item.id}`)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >

                      {/* Project Title */}
                      <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs truncate">
                        {item.projectTitle}
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          {projectVerificationStatusLabels[item.status]}
                        </span>
                      </td>

                      {/* Booking Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${bookingStyle.bg} ${bookingStyle.text} ${bookingStyle.border}`}
                        >
                          {verificationBookingStatusLabels[item.bookingStatus]}
                        </span>
                      </td>

                      {/* Schedule */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {formatSchedule(item.scheduledStartAt, item.scheduledEndAt)}
                      </td>

                      {/* Submitted At */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(item.submittedAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/project-verifications/${item.id}`);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          Chi tiết
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {data && data.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div>
              Hiển thị trang <span className="font-semibold text-slate-800">{data.page}</span> /{' '}
              <span className="font-semibold text-slate-800">{data.totalPages}</span> (Tổng số{' '}
              <span className="font-semibold text-slate-800">{data.totalItems}</span> hồ sơ)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsLoading(true);
                  setCurrentPage((p) => Math.max(1, p - 1));
                }}
                disabled={currentPage <= 1 || isLoading}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsLoading(true);
                  setCurrentPage((p) => Math.min(data.totalPages, p + 1));
                }}
                disabled={currentPage >= data.totalPages || isLoading}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
