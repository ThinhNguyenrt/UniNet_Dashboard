import React from 'react';
import { Briefcase, Search } from 'lucide-react';

export const JobPostingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Kiểm duyệt Bài đăng tuyển dụng
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kiểm tra tính chính xác của các vị trí tuyển dụng, tin thực tập và bảo vệ sinh viên khỏi các tin tuyển dụng lừa đảo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
            5 tin tuyển dụng chờ duyệt
          </span>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo vị trí, tên công ty..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600">
            <option>Tất cả trạng thái</option>
            <option>Chờ kiểm duyệt</option>
            <option>Đã công khai</option>
            <option>Từ chối hiển thị</option>
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80">
            <tr>
              <th className="p-4">Vị trí tuyển dụng</th>
              <th className="p-4">Doanh nghiệp</th>
              <th className="p-4">Mức lương & Loại hình</th>
              <th className="p-4">Ngày đăng</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            <tr>
              <td className="p-4">
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  Frontend Intern (React/Next.js)
                </div>
              </td>
              <td className="p-4 font-medium">Công ty Cổ phần Công nghệ CyberTech</td>
              <td className="p-4">
                <span className="font-semibold text-emerald-600">5.000.000 - 8.000.000 ₫</span>
                <div className="text-[11px] text-slate-400">Thực tập sinh • Full-time</div>
              </td>
              <td className="p-4 text-slate-400">10/10/2026</td>
              <td className="p-4">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Chờ duyệt
                </span>
              </td>
              <td className="p-4 text-right space-x-2">
                <button className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs">
                  Duyệt đăng
                </button>
                <button className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                  Xem chi tiết
                </button>
              </td>
            </tr>

            <tr>
              <td className="p-4">
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  Junior AI/Data Engineer
                </div>
              </td>
              <td className="p-4 font-medium">Viện Nghiên cứu Công nghệ AI Hub</td>
              <td className="p-4">
                <span className="font-semibold text-emerald-600">12.000.000 - 18.000.000 ₫</span>
                <div className="text-[11px] text-slate-400">Toàn thời gian</div>
              </td>
              <td className="p-4 text-slate-400">08/10/2026</td>
              <td className="p-4">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Đã công khai
                </span>
              </td>
              <td className="p-4 text-right">
                <span className="text-slate-400 text-xs">Đang nhận hồ sơ</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobPostingsPage;
