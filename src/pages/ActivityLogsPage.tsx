import { useState } from 'react';
import {
  Calendar,
  Search,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ManagementDialog, ManagementPagination } from '../components/management/ManagementUI';

interface ActivityLogItem {
  id: string;
  timestamp: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  actionType: 'create' | 'update' | 'review' | 'security' | 'financial';
  target: string;
  targetId: string;
  ipAddress: string;
  details: string;
  status: 'success' | 'warning' | 'failed';
}

export function ActivityLogsPage() {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);
  const [page, setPage] = useState(1);

  // Dữ liệu nhật ký hoạt động thực tế theo vai trò
  const roleLogs: Record<string, ActivityLogItem[]> = {
    accountant: [
      {
        id: 'LOG-20261102-001',
        timestamp: '02/11/2026 14:15',
        actorName: currentUser?.name || 'Kế toán viên',
        actorEmail: currentUser?.email || 'accountant@uninet.vn',
        actorRole: 'Accountant',
        action: 'Xác nhận chuyển khoản rút tiền',
        actionType: 'financial',
        target: 'Yêu cầu rút tiền WD-00241',
        targetId: 'WD-00241',
        ipAddress: '14.241.120.55',
        details: 'Xác nhận thành công khoản chi 1.000.000 đ qua Vietcombank. Mã GD: FT260102001.',
        status: 'success',
      },
      {
        id: 'LOG-20261102-002',
        timestamp: '02/11/2026 11:30',
        actorName: currentUser?.name || 'Kế toán viên',
        actorEmail: currentUser?.email || 'accountant@uninet.vn',
        actorRole: 'Accountant',
        action: 'Lập lệnh chi rút tiền',
        actionType: 'financial',
        target: 'Yêu cầu rút tiền WD-00240',
        targetId: 'WD-00240',
        ipAddress: '14.241.120.55',
        details: 'Khởi tạo lệnh chi cho Assessor Trần Thị B số tiền 500.000 đ.',
        status: 'success',
      },
      {
        id: 'LOG-20261101-003',
        timestamp: '01/11/2026 16:45',
        actorName: currentUser?.name || 'Kế toán viên',
        actorEmail: currentUser?.email || 'accountant@uninet.vn',
        actorRole: 'Accountant',
        action: 'Ghi nhận thu nhập ví',
        actionType: 'financial',
        target: 'Ví Assessor #AS-8902',
        targetId: 'AS-8902',
        ipAddress: '14.241.120.55',
        details: 'Ghi có thu nhập 500.000 đ theo chứng từ INCOME-2026-001.',
        status: 'success',
      },
      {
        id: 'LOG-20261101-004',
        timestamp: '01/11/2026 09:12',
        actorName: currentUser?.name || 'Kế toán viên',
        actorEmail: currentUser?.email || 'accountant@uninet.vn',
        actorRole: 'Accountant',
        action: 'Đăng nhập hệ thống',
        actionType: 'security',
        target: 'Phiên làm việc Dashboard',
        targetId: 'SESSION-0912',
        ipAddress: '14.241.120.55',
        details: 'Đăng nhập thành công qua trình duyệt Chrome trên Windows.',
        status: 'success',
      },
    ],
    admin: [
      {
        id: 'LOG-20261102-101',
        timestamp: '02/11/2026 14:10',
        actorName: currentUser?.name || 'Quản trị viên',
        actorEmail: currentUser?.email || 'admin@uninet.vn',
        actorRole: 'Admin',
        action: 'Phân quyền nhân viên',
        actionType: 'security',
        target: 'Tài khoản nhân viên staff.01@uninet.vn',
        targetId: 'STAFF-01',
        ipAddress: '113.190.23.44',
        details: 'Cấp quyền kiểm duyệt bài viết cộng đồng và quản lý kỹ năng.',
        status: 'success',
      },
      {
        id: 'LOG-20261102-102',
        timestamp: '02/11/2026 10:25',
        actorName: currentUser?.name || 'Quản trị viên',
        actorEmail: currentUser?.email || 'admin@uninet.vn',
        actorRole: 'Admin',
        action: 'Khóa tài khoản vi phạm',
        actionType: 'security',
        target: 'Người dùng student.bad@fixture.test',
        targetId: 'USR-8902',
        ipAddress: '113.190.23.44',
        details: 'Khóa tài khoản do vi phạm điều khoản cung cấp thông tin sai lệch.',
        status: 'warning',
      },
      {
        id: 'LOG-20261101-103',
        timestamp: '01/11/2026 15:30',
        actorName: currentUser?.name || 'Quản trị viên',
        actorEmail: currentUser?.email || 'admin@uninet.vn',
        actorRole: 'Admin',
        action: 'Cập nhật danh mục kỹ năng',
        actionType: 'update',
        target: 'Kỹ năng Machine Learning',
        targetId: 'SKILL-441',
        ipAddress: '113.190.23.44',
        details: 'Thêm biểu tượng kỹ năng và kích hoạt hiển thị trong hồ sơ nghề nghiệp.',
        status: 'success',
      },
      {
        id: 'LOG-20261101-104',
        timestamp: '01/11/2026 08:30',
        actorName: currentUser?.name || 'Quản trị viên',
        actorEmail: currentUser?.email || 'admin@uninet.vn',
        actorRole: 'Admin',
        action: 'Đăng nhập hệ thống',
        actionType: 'security',
        target: 'Phiên làm việc Admin',
        targetId: 'SESSION-0830',
        ipAddress: '113.190.23.44',
        details: 'Đăng nhập xác thực 2 bước thành công.',
        status: 'success',
      },
    ],
    moderator: [
      {
        id: 'LOG-20261102-201',
        timestamp: '02/11/2026 13:45',
        actorName: currentUser?.name || 'Kiểm duyệt viên',
        actorEmail: currentUser?.email || 'moderator@uninet.vn',
        actorRole: 'Moderator',
        action: 'Phê duyệt dự án',
        actionType: 'review',
        target: 'Dự án AI Agent Automation #PRJ-102',
        targetId: 'PRJ-102',
        ipAddress: '27.72.100.12',
        details: 'Hồ sơ dự án đầy đủ tiêu chuẩn và điều khoản bảo mật.',
        status: 'success',
      },
      {
        id: 'LOG-20261102-202',
        timestamp: '02/11/2026 11:20',
        actorName: currentUser?.name || 'Kiểm duyệt viên',
        actorEmail: currentUser?.email || 'moderator@uninet.vn',
        actorRole: 'Moderator',
        action: 'Ẩn bài viết cộng đồng',
        actionType: 'review',
        target: 'Bài đăng thảo luận #POST-881',
        targetId: 'POST-881',
        ipAddress: '27.72.100.12',
        details: 'Nội dung bài viết chứa từ khóa spam quảng cáo trái phép.',
        status: 'warning',
      },
      {
        id: 'LOG-20261101-203',
        timestamp: '01/11/2026 14:15',
        actorName: currentUser?.name || 'Kiểm duyệt viên',
        actorEmail: currentUser?.email || 'moderator@uninet.vn',
        actorRole: 'Moderator',
        action: 'Giải quyết khiếu nại',
        actionType: 'review',
        target: 'Khiếu nại bản quyền #CMP-012',
        targetId: 'CMP-012',
        ipAddress: '27.72.100.12',
        details: 'Đã liên hệ hai bên và làm rõ quyền sở hữu trí tuệ.',
        status: 'success',
      },
    ],
    verifier: [
      {
        id: 'LOG-20261102-301',
        timestamp: '02/11/2026 14:00',
        actorName: currentUser?.name || 'Chuyên viên xác minh',
        actorEmail: currentUser?.email || 'verifier@uninet.vn',
        actorRole: 'Verifier',
        action: 'Duyệt xác minh sinh viên',
        actionType: 'review',
        target: 'Hồ sơ sinh viên Nguyễn Hoàng Nam (SE160234)',
        targetId: 'VR-STUDENT-501',
        ipAddress: '118.70.180.99',
        details: 'Thẻ sinh viên và bảng điểm hợp lệ từ Đại học FPT.',
        status: 'success',
      },
      {
        id: 'LOG-20261102-302',
        timestamp: '02/11/2026 10:15',
        actorName: currentUser?.name || 'Chuyên viên xác minh',
        actorEmail: currentUser?.email || 'verifier@uninet.vn',
        actorRole: 'Verifier',
        action: 'Từ chối xác minh đối tác',
        actionType: 'review',
        target: 'Công ty TNHH Giải pháp Đổi Mới',
        targetId: 'VR-PARTNER-502',
        ipAddress: '118.70.180.99',
        details: 'Giấy phép đăng ký kinh doanh mờ, yêu cầu nộp lại bản sao công chứng.',
        status: 'failed',
      },
      {
        id: 'LOG-20261101-303',
        timestamp: '01/11/2026 16:30',
        actorName: currentUser?.name || 'Chuyên viên xác minh',
        actorEmail: currentUser?.email || 'verifier@uninet.vn',
        actorRole: 'Verifier',
        action: 'Đăng nhập hệ thống',
        actionType: 'security',
        target: 'Phiên làm việc Verifier',
        targetId: 'SESSION-1630',
        ipAddress: '118.70.180.99',
        details: 'Đăng nhập qua mạng nội bộ tổ chức.',
        status: 'success',
      },
    ],
  };

  const logs = roleLogs[currentUser?.role || 'accountant'] || roleLogs.accountant;

  const filteredLogs = logs.filter((log) => {
    if (typeFilter !== 'all' && log.actionType !== typeFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        log.id.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q) ||
        log.actorName.toLowerCase().includes(q) ||
        log.ipAddress.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <span>Hệ thống</span>
            <span>&gt;</span>
            <span className="text-slate-600 font-medium">Nhật kí hoạt động</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Nhật kí hoạt động
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Lịch sử ghi nhận các thao tác, sự kiện và biến động dữ liệu trên hệ thống theo vai trò.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 shadow-xs cursor-pointer hover:bg-slate-50">
            <Calendar size={16} className="text-slate-400" />
            <span>30 ngày qua</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
        </div>
      </div>

      {/* Bộ lọc và Tìm kiếm */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'all', label: 'Tất cả hoạt động' },
            { key: 'review', label: 'Kiểm duyệt & Thẩm định' },
            { key: 'financial', label: 'Tài chính & Thu chi' },
            { key: 'security', label: 'Bảo mật & Phiên' },
            { key: 'update', label: 'Cập nhật hệ thống' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTypeFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === tab.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[280px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo hành động, đối tượng, IP..."
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
        </div>
      </div>

      {/* Bảng Nhật kí hoạt động */}
      <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] border-b border-slate-100">
              <tr>
                <th className="p-3.5">Thời gian</th>
                <th className="p-3.5">Người thực hiện</th>
                <th className="p-3.5">Hành động</th>
                <th className="p-3.5">Đối tượng tác động</th>
                <th className="p-3.5">IP & Thiết bị</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5 text-slate-500 whitespace-nowrap font-mono text-xs">
                    {log.timestamp}
                  </td>

                  <td className="p-3.5">
                    <p className="font-semibold text-slate-900 leading-tight">
                      {log.actorName}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {log.actorEmail}
                    </p>
                  </td>

                  <td className="p-3.5">
                    <span className="font-bold text-slate-800">{log.action}</span>
                  </td>

                  <td className="p-3.5 text-slate-700 max-w-xs break-words">
                    {log.target}
                  </td>

                  <td className="p-3.5 text-slate-500 font-mono text-xs">
                    {log.ipAddress}
                  </td>

                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        log.status === 'success'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : log.status === 'warning'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}
                    >
                      {log.status === 'success' && <CheckCircle2 size={12} />}
                      {log.status === 'warning' && <AlertTriangle size={12} />}
                      {log.status === 'failed' && <Info size={12} />}
                      <span>
                        {log.status === 'success'
                          ? 'Thành công'
                          : log.status === 'warning'
                          ? 'Cảnh báo'
                          : 'Thất bại'}
                      </span>
                    </span>
                  </td>

                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      aria-label="Xem chi tiết sự kiện"
                      title="Xem chi tiết"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                    >
                      <Eye size={17} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400">
                    Không tìm thấy nhật ký hoạt động phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Hiển thị {filteredLogs.length} bản ghi sự kiện</span>
          <ManagementPagination
            page={page}
            pageSize={20}
            total={filteredLogs.length}
            disabled={false}
            onPage={setPage}
          />
        </div>
      </div>

      {/* Modal chi tiết nhật ký */}
      {selectedLog && (
        <ManagementDialog
          title="Chi tiết sự kiện nhật ký"
          onClose={() => setSelectedLog(null)}
        >
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Mã sự kiện:</span>
                <span className="font-mono font-bold text-slate-900">{selectedLog.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Thời gian ghi nhận:</span>
                <span className="font-medium text-slate-800">{selectedLog.timestamp}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Người thực hiện:</span>
                <span className="font-semibold text-slate-900">{selectedLog.actorName} ({selectedLog.actorRole})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Hành động:</span>
                <span className="font-bold text-blue-700">{selectedLog.action}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Đối tượng tác động:</span>
                <span className="font-medium text-slate-800">{selectedLog.target}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Địa chỉ IP:</span>
                <span className="font-mono text-slate-700">{selectedLog.ipAddress}</span>
              </div>
              <div className="border-t border-slate-200/80 pt-2">
                <span className="text-slate-500 block mb-1">Nội dung chi tiết:</span>
                <p className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800 text-xs font-mono leading-relaxed">
                  {selectedLog.details}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </ManagementDialog>
      )}
    </div>
  );
}
