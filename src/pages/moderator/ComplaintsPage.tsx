import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  FileText,
  User,
  MessageSquareWarning,
  X,
} from 'lucide-react';

export type ComplaintStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected';
export type ComplaintPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface ComplaintItem {
  id: string;
  code: string;
  complainantName: string;
  complainantEmail: string;
  complainantRole: string;
  targetName: string;
  targetType: 'project' | 'user' | 'community_post' | 'job_posting' | 'transaction';
  category: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  description: string;
  evidenceFiles: { name: string; size: string; type: string }[];
  resolutionNotes?: string;
  assignedModerator?: string;
}

const INITIAL_COMPLAINTS: ComplaintItem[] = [
  {
    id: '1',
    code: 'KN-2026-0089',
    complainantName: 'Nguyễn Văn Hùng',
    complainantEmail: 'hung.nv@uninet.edu.vn',
    complainantRole: 'Sinh viên',
    targetName: 'Hệ thống Quản lý Thư viện Thông minh',
    targetType: 'project',
    category: 'Vi phạm bản quyền mã nguồn',
    priority: 'urgent',
    status: 'pending',
    createdAt: '27/10/2026 14:32',
    updatedAt: '27/10/2026 14:32',
    description: 'Dự án này đã sao chép toàn bộ mã nguồn bài tập lớn môn SWP391 của nhóm chúng tôi tại học kỳ Fall 2025 mà không có sự đồng ý hay trích dẫn nguồn.',
    evidenceFiles: [
      { name: 'repo_commit_history.pdf', size: '1.2 MB', type: 'PDF' },
      { name: 'screenshot_code_diff.png', size: '850 KB', type: 'PNG' },
    ],
  },
  {
    id: '2',
    code: 'KN-2026-0088',
    complainantName: 'Lê Thuỳ Dung',
    complainantEmail: 'dung.lt@uninet.edu.vn',
    complainantRole: 'Sinh viên',
    targetName: 'Trần Minh Đức',
    targetType: 'user',
    category: 'Ngôn từ xúc phạm, quấy rối',
    priority: 'high',
    status: 'in_progress',
    createdAt: '26/10/2026 16:15',
    updatedAt: '27/10/2026 09:20',
    description: 'Thành viên này liên tục để lại các bình luận công kích cá nhân và ngôn từ thiếu văn hóa trong các bài viết thảo luận của tôi trên diễn đàn cộng đồng.',
    evidenceFiles: [
      { name: 'screenshot_chat_log.jpg', size: '640 KB', type: 'JPG' },
    ],
    resolutionNotes: 'Đang liên hệ với cả hai bên để xác thực ngữ cảnh trao đổi.',
    assignedModerator: 'Nguyễn Kiểm Duyệt',
  },
  {
    id: '3',
    code: 'KN-2026-0087',
    complainantName: 'Công ty Cổ phần TechNova',
    complainantEmail: 'hr@technova.vn',
    complainantRole: 'Đối tác doanh nghiệp',
    targetName: 'Tuyển dụng Thực tập sinh AI - Mạo danh TechNova',
    targetType: 'job_posting',
    category: 'Mạo danh doanh nghiệp lừa đảo',
    priority: 'urgent',
    status: 'pending',
    createdAt: '25/10/2026 11:05',
    updatedAt: '25/10/2026 11:05',
    description: 'Có tài khoản đăng bài tuyển dụng mạo danh TechNova và yêu cầu ứng viên nộp phí hồ sơ 200.000 đ. Chúng tôi không bao giờ thu phí tuyển dụng.',
    evidenceFiles: [
      { name: 'giay_uy_quyen_phap_ly.pdf', size: '2.5 MB', type: 'PDF' },
      { name: 'anh_man_hinh_bai_dang.png', size: '420 KB', type: 'PNG' },
    ],
  },
  {
    id: '4',
    code: 'KN-2026-0086',
    complainantName: 'Hoàng Quốc Việt',
    complainantEmail: 'viet.hq@uninet.edu.vn',
    complainantRole: 'Sinh viên',
    targetName: 'Chia sẻ tài liệu thi chứng chỉ AWS',
    targetType: 'community_post',
    category: 'Phát tán link độc hại / spam',
    priority: 'medium',
    status: 'resolved',
    createdAt: '24/10/2026 09:40',
    updatedAt: '25/10/2026 15:30',
    description: 'Bài viết đính kèm link tải tài liệu nhưng khi bấm vào lại chuyển hướng tới trang web giả mạo yêu cầu đăng nhập tài khoản Google.',
    evidenceFiles: [
      { name: 'phishing_link_evidence.png', size: '320 KB', type: 'PNG' },
    ],
    resolutionNotes: 'Đã kiểm tra URL độc hại. Bài viết đã bị gỡ và tài khoản vi phạm bị cảnh cáo 7 ngày.',
    assignedModerator: 'Lê Văn Duyệt',
  },
  {
    id: '5',
    code: 'KN-2026-0085',
    complainantName: 'Phạm Hồng Nhung',
    complainantEmail: 'nhung.ph@uninet.edu.vn',
    complainantRole: 'Sinh viên',
    targetName: 'Dự án App Đặt Xe Nội Khu Campus',
    targetType: 'project',
    category: 'Tranh chấp thành viên đội thi',
    priority: 'low',
    status: 'rejected',
    createdAt: '22/10/2026 13:20',
    updatedAt: '23/10/2026 10:15',
    description: 'Trưởng nhóm tự ý loại tên tôi khỏi danh sách đóng góp sau khi dự án đạt giải Ba cấp trường.',
    evidenceFiles: [],
    resolutionNotes: 'Vấn đề phân bổ thành viên nội bộ do cố vấn đề tài quyết định theo quy chế. Đã hướng dẫn sinh viên liên hệ Giảng viên hướng dẫn.',
    assignedModerator: 'Trần Thị Thảo',
  },
];

export const ComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<ComplaintItem[]>(INITIAL_COMPLAINTS);
  const [selectedTab, setSelectedTab] = useState<ComplaintStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activeComplaint, setActiveComplaint] = useState<ComplaintItem | null>(null);
  const [moderatorNote, setModeratorNote] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: complaints.length,
      pending: complaints.filter(c => c.status === 'pending').length,
      in_progress: complaints.filter(c => c.status === 'in_progress').length,
      resolved: complaints.filter(c => c.status === 'resolved').length,
      rejected: complaints.filter(c => c.status === 'rejected').length,
    };
  }, [complaints]);

  // Filtered list
  const filteredList = useMemo(() => {
    return complaints.filter(item => {
      if (selectedTab !== 'all' && item.status !== selectedTab) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchCode = item.code.toLowerCase().includes(query);
        const matchComplainant = item.complainantName.toLowerCase().includes(query) || item.complainantEmail.toLowerCase().includes(query);
        const matchTarget = item.targetName.toLowerCase().includes(query);
        const matchCategory = item.category.toLowerCase().includes(query);
        if (!matchCode && !matchComplainant && !matchTarget && !matchCategory) return false;
      }
      return true;
    });
  }, [complaints, selectedTab, categoryFilter, priorityFilter, searchTerm]);

  const handleOpenDetail = (item: ComplaintItem) => {
    setActiveComplaint(item);
    setModeratorNote(item.resolutionNotes || '');
  };

  const handleUpdateStatus = (newStatus: ComplaintStatus) => {
    if (!activeComplaint) return;
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const updated = complaints.map(c => {
      if (c.id === activeComplaint.id) {
        return {
          ...c,
          status: newStatus,
          updatedAt: formattedDate,
          resolutionNotes: moderatorNote.trim() || c.resolutionNotes,
          assignedModerator: c.assignedModerator || 'Kiểm duyệt viên hiện tại',
        };
      }
      return c;
    });

    setComplaints(updated);
    const updatedItem = updated.find(c => c.id === activeComplaint.id) || null;
    setActiveComplaint(updatedItem);

    const statusLabel =
      newStatus === 'in_progress'
        ? 'đang giải quyết'
        : newStatus === 'resolved'
        ? 'đã giải quyết thành công'
        : newStatus === 'rejected'
        ? 'đã bác bỏ'
        : 'chờ xử lý';

    setFeedbackMsg({
      type: 'success',
      text: `Đã cập nhật khiếu nại ${activeComplaint.code} sang trạng thái "${statusLabel}".`,
    });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const renderStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            Chờ xử lý
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <MessageSquareWarning className="w-3 h-3" />
            Đang giải quyết
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Đã giải quyết
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <XCircle className="w-3 h-3" />
            Đã bác bỏ
          </span>
        );
    }
  };

  const renderPriorityBadge = (priority: ComplaintPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200">
            Khẩn cấp
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
            Cao
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
            Trung bình
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Thấp
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <nav className="text-xs text-slate-400 mb-1">
          <span>Kiểm duyệt</span>
          <span className="mx-2">&gt;</span>
          <span className="text-slate-700 font-medium">Xử lý khiếu nại</span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-blue-600" />
              Xử lý khiếu nại
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Tiếp nhận, kiểm tra bằng chứng và đưa ra quyết định xử lý khiếu nại công bằng cho cộng đồng UniNet.
            </p>
          </div>
          {counts.pending > 0 && (
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-xl border border-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                {counts.pending} khiếu nại đang chờ xử lý
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Feedback banner */}
      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2 shadow-xs transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setSelectedTab('all')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            selectedTab === 'all'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Tất cả
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200/80 text-slate-700">
            {counts.all}
          </span>
        </button>
        <button
          onClick={() => setSelectedTab('pending')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            selectedTab === 'pending'
              ? 'border-amber-600 text-amber-600 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Chờ xử lý
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
            {counts.pending}
          </span>
        </button>
        <button
          onClick={() => setSelectedTab('in_progress')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            selectedTab === 'in_progress'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Đang giải quyết
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
            {counts.in_progress}
          </span>
        </button>
        <button
          onClick={() => setSelectedTab('resolved')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            selectedTab === 'resolved'
              ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Đã giải quyết
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
            {counts.resolved}
          </span>
        </button>
        <button
          onClick={() => setSelectedTab('rejected')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
            selectedTab === 'rejected'
              ? 'border-slate-600 text-slate-800 bg-slate-100/70'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Đã bác bỏ
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
            {counts.rejected}
          </span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã, người khiếu nại, đối tượng..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả loại vi phạm</option>
            <option value="Vi phạm bản quyền mã nguồn">Bản quyền mã nguồn</option>
            <option value="Ngôn từ xúc phạm, quấy rối">Xúc phạm, quấy rối</option>
            <option value="Mạo danh doanh nghiệp lừa đảo">Mạo danh doanh nghiệp</option>
            <option value="Phát tán link độc hại / spam">Link độc hại / spam</option>
            <option value="Tranh chấp thành viên đội thi">Tranh chấp thành viên</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả mức độ</option>
            <option value="urgent">Khẩn cấp</option>
            <option value="high">Cao</option>
            <option value="medium">Trung bình</option>
            <option value="low">Thấp</option>
          </select>
        </div>
      </div>

      {/* Complaints Table: Stricly ONLY Eye button on rows */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80">
              <tr>
                <th className="p-3.5 pl-4">Mã khiếu nại</th>
                <th className="p-3.5">Người gửi</th>
                <th className="p-3.5">Đối tượng bị khiếu nại</th>
                <th className="p-3.5">Loại khiếu nại</th>
                <th className="p-3.5">Mức độ</th>
                <th className="p-3.5">Thời gian gửi</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5 pr-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Không tìm thấy khiếu nại nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredList.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 pl-4 font-mono font-semibold text-slate-900">
                      {item.code}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900">{item.complainantName}</div>
                      <div className="text-[11px] text-slate-400">{item.complainantRole}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-800 line-clamp-1 max-w-xs">{item.targetName}</div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        {item.targetType === 'project'
                          ? 'Dự án'
                          : item.targetType === 'user'
                          ? 'Người dùng'
                          : item.targetType === 'job_posting'
                          ? 'Tuyển dụng'
                          : 'Bài viết'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700">
                      {item.category}
                    </td>
                    <td className="p-3.5">
                      {renderPriorityBadge(item.priority)}
                    </td>
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">
                      {item.createdAt}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {renderStatusBadge(item.status)}
                    </td>
                    {/* ONLY EYE ICON AS SPECIFIED */}
                    <td className="p-3.5 pr-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(item)}
                        title="Xem chi tiết khiếu nại"
                        className="inline-flex items-center justify-center p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {activeComplaint && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto no-scrollbar"
          onClick={() => setActiveComplaint(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-6 my-8"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    {activeComplaint.code}
                  </span>
                  {renderStatusBadge(activeComplaint.status)}
                  {renderPriorityBadge(activeComplaint.priority)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Được gửi lúc: {activeComplaint.createdAt}
                  {activeComplaint.assignedModerator && ` • Phụ trách: ${activeComplaint.assignedModerator}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveComplaint(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Parties info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Người gửi khiếu nại
                </span>
                <p className="text-xs font-bold text-slate-900">{activeComplaint.complainantName}</p>
                <p className="text-[11px] text-slate-500">{activeComplaint.complainantEmail}</p>
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-medium">
                  {activeComplaint.complainantRole}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  Đối tượng bị khiếu nại
                </span>
                <p className="text-xs font-bold text-slate-900">{activeComplaint.targetName}</p>
                <p className="text-[11px] text-slate-500">Phân loại: {activeComplaint.category}</p>
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-medium uppercase tracking-wider">
                  {activeComplaint.targetType}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-800">Nội dung khiếu nại chi tiết:</span>
              <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
                {activeComplaint.description}
              </div>
            </div>

            {/* Evidence Files */}
            {activeComplaint.evidenceFiles.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800">Tài liệu &amp; bằng chứng đính kèm:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeComplaint.evidenceFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="font-medium text-slate-700 truncate">{file.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 ml-2 whitespace-nowrap">{file.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Moderator Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">
                Ghi chú &amp; kết luận xử lý của Kiểm duyệt viên:
              </label>
              <textarea
                rows={3}
                value={moderatorNote}
                onChange={e => setModeratorNote(e.target.value)}
                placeholder="Nhập căn cứ xử lý, quyết định giải quyết hoặc lý do bác bỏ khiếu nại..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveComplaint(null)}
                className="w-full sm:w-auto px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold"
              >
                Đóng
              </button>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                {activeComplaint.status !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('rejected')}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Bác bỏ khiếu nại
                  </button>
                )}

                {activeComplaint.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('in_progress')}
                    className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold"
                  >
                    Tiếp nhận xử lý
                  </button>
                )}

                {activeComplaint.status !== 'resolved' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('resolved')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                  >
                    Giải quyết &amp; Đồng ý khiếu nại
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
