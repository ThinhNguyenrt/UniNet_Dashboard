import React from 'react';
import { MessageSquare, Search, AlertCircle, EyeOff } from 'lucide-react';

export const CommunityPostsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Kiểm duyệt Bài đăng Cộng đồng
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý bài viết diễn đàn, thảo luận học thuật và xử lý các bài đăng bị người dùng báo cáo vi phạm tiêu chuẩn.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full border border-red-200 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            4 bài viết bị báo cáo vi phạm
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, tác giả..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600">
            <option>Tất cả bài viết</option>
            <option>Bị báo cáo nhiều lần</option>
            <option>Nội dung nhạy cảm</option>
            <option>Spam quảng cáo</option>
          </select>
        </div>
      </div>

      {/* Posts List / Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80">
            <tr>
              <th className="p-4">Tiêu đề bài đăng</th>
              <th className="p-4">Tác giả</th>
              <th className="p-4">Chuyên mục</th>
              <th className="p-4">Lý do báo cáo</th>
              <th className="p-4 text-right">Hành động xử lý</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            <tr>
              <td className="p-4">
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-red-500" />
                  Nhận làm thuê đồ án tốt nghiệp cam kết điểm A...
                </div>
              </td>
              <td className="p-4">Tài khoản ẩn danh (SV-991)</td>
              <td className="p-4 font-medium">Góc Học tập & Thảo luận</td>
              <td className="p-4">
                <span className="text-red-600 font-semibold">Vi phạm tính trung thực học thuật (7 lượt report)</span>
              </td>
              <td className="p-4 text-right space-x-2">
                <button className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs flex-inline items-center gap-1">
                  <EyeOff className="w-3 h-3 inline mr-1" />
                  Gỡ bài viết
                </button>
              </td>
            </tr>

            <tr>
              <td className="p-4">
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  Chia sẻ lộ trình tự học AI Roadmap 2026 cho tân sinh viên
                </div>
              </td>
              <td className="p-4">Đặng Đức Huy (Mentor Lab)</td>
              <td className="p-4 font-medium">Kinh nghiệm & Chia sẻ</td>
              <td className="p-4">
                <span className="text-emerald-600 font-semibold">Bài viết hữu ích, kiểm duyệt tăng tương tác</span>
              </td>
              <td className="p-4 text-right">
                <button className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs">
                  Ghim bài
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommunityPostsPage;
