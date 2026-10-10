import React from 'react';
import { FolderKanban, Plus, Search, Filter } from 'lucide-react';

export const AdminProjectsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quản trị Dự án Toàn hệ thống
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Giám sát toàn bộ các dự án học thuật, đồ án tốt nghiệp và dự án liên kết doanh nghiệp trên nền tảng UniNet.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Tạo dự án mẫu
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase">Tổng số dự án</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">342</div>
          <p className="text-xs text-slate-400 mt-1">Đang triển khai trên hệ thống</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase">Dự án doanh nghiệp tài trợ</div>
          <div className="text-2xl font-extrabold text-blue-600 mt-2">89</div>
          <p className="text-xs text-slate-400 mt-1">Hợp tác cùng 24 công ty</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase">Dự án hoàn thành</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">214</div>
          <p className="text-xs text-slate-400 mt-1">Tỷ lệ nghiệm thu 94%</p>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên dự án, đơn vị..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">
            <Filter className="w-3.5 h-3.5" />
            Bộ lọc nâng cao
          </button>
        </div>

        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="p-3.5">Tên Dự án</th>
                <th className="p-3.5">Đơn vị chủ trì</th>
                <th className="p-3.5">Loại hình</th>
                <th className="p-3.5">Tiến độ</th>
                <th className="p-3.5">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              <tr>
                <td className="p-3.5">
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-blue-600" />
                    Hệ thống AI Phân loại Rác thông minh
                  </div>
                </td>
                <td className="p-3.5">ĐH Bách Khoa HCM & FPT Software</td>
                <td className="p-3.5">Dự án Liên kết Doanh nghiệp</td>
                <td className="p-3.5">
                  <div className="w-24 bg-slate-200 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full w-3/4"></div>
                  </div>
                </td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                    Đang thực hiện
                  </span>
                </td>
              </tr>
              <tr>
                <td className="p-3.5">
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-blue-600" />
                    Nền tảng Quản lý Điểm danh Sinh viên IoT
                  </div>
                </td>
                <td className="p-3.5">ĐH Khoa học Tự nhiên</td>
                <td className="p-3.5">Đồ án Tốt nghiệp</td>
                <td className="p-3.5">
                  <div className="w-24 bg-slate-200 rounded-full h-1.5">
                    <div className="bg-emerald-600 h-1.5 rounded-full w-full"></div>
                  </div>
                </td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                    Đã hoàn thành
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProjectsPage;
