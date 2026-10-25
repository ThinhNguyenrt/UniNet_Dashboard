import React from 'react';
import { FolderKanban, Search, AlertTriangle } from 'lucide-react';

export const ModeratorProjectsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Kiểm duyệt Nội dung Dự án
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kiểm duyệt bản quyền, nội dung mô tả dự án và xử lý các báo cáo vi phạm tiêu chuẩn cộng đồng UniNet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            3 báo cáo khiếu nại bản quyền
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên dự án, tác giả..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600">
            <option>Tất cả trạng thái kiểm duyệt</option>
            <option>Có báo cáo vi phạm</option>
            <option>Chờ kiểm duyệt nội dung</option>
            <option>Nội dung an toàn</option>
          </select>
        </div>
      </div>

      {/* Moderator Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80">
            <tr>
              <th className="p-4">Dự án</th>
              <th className="p-4">Tác giả / Đội ngũ</th>
              <th className="p-4">Lý do kiểm duyệt</th>
              <th className="p-4">Mức độ cảnh báo</th>
              <th className="p-4 text-right">Quyết định kiểm duyệt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            <tr>
              <td className="p-4">
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-amber-600" />
                  Clone Ứng dụng Quản lý Tài chính FinPro
                </div>
              </td>
              <td className="p-4">Trần Hoàng Long (SV ĐH Bách Khoa)</td>
              <td className="p-4 text-slate-600">Nghi vấn sao chép mã nguồn và thiết kế UI thương mại chưa xin phép</td>
              <td className="p-4">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Trung bình
                </span>
              </td>
              <td className="p-4 text-right space-x-2">
                <button className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs">
                  Xem chi tiết
                </button>
                <button className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold border border-red-200">
                  Ẩn dự án
                </button>
              </td>
            </tr>

            <tr>
              <td className="p-4">
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-blue-600" />
                  Trang thương mại điện tử Đồ thủ công mỹ nghệ
                </div>
              </td>
              <td className="p-4">Nhóm Sinh viên FPT SmartCraft</td>
              <td className="p-4 text-slate-600">Kiểm duyệt định kỳ trước khi đưa lên trang chủ dự án nổi bật</td>
              <td className="p-4">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  An toàn
                </span>
              </td>
              <td className="p-4 text-right">
                <button className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs">
                  Phê duyệt hiển thị
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ModeratorProjectsPage;
