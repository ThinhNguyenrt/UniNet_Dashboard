import React from 'react';
import { FileText, Search, UserCheck } from 'lucide-react';

export const CareerProfilesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Kiểm duyệt Hồ sơ nghề nghiệp (CV & Portfolio)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kiểm tra tính chuẩn mực, ngôn từ và thông tin hồ sơ nghề nghiệp của sinh viên trước khi công khai trong kho CV.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên ứng viên, chuyên môn..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600">
            <option>Tất cả lĩnh vực</option>
            <option>Công nghệ Thông tin</option>
            <option>Thiết kế Đồ họa</option>
            <option>Kinh doanh & Marketing</option>
          </select>
        </div>
      </div>

      {/* Profiles Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80">
            <tr>
              <th className="p-4">Ứng viên</th>
              <th className="p-4">Định hướng nghề nghiệp</th>
              <th className="p-4">Tài liệu hồ sơ</th>
              <th className="p-4">Trạng thái duyệt</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            <tr>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Lê Minh Khang</div>
                    <div className="text-[11px] text-slate-400">Sinh viên năm cuối • ĐH FPT</div>
                  </div>
                </div>
              </td>
              <td className="p-4 font-medium text-slate-800">Fullstack Web Developer</td>
              <td className="p-4">
                <span className="inline-flex items-center gap-1 text-blue-600 hover:underline cursor-pointer font-medium">
                  <FileText className="w-3.5 h-3.5" /> CV_LeMinhKhang_2026.pdf
                </span>
              </td>
              <td className="p-4">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Chờ kiểm tra
                </span>
              </td>
              <td className="p-4 text-right space-x-2">
                <button className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs">
                  Phê duyệt
                </button>
                <button className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                  Xem CV
                </button>
              </td>
            </tr>

            <tr>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 font-bold flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Hoàng Thùy Dương</div>
                    <div className="text-[11px] text-slate-400">Sinh viên năm 3 • ĐH Mỹ thuật</div>
                  </div>
                </div>
              </td>
              <td className="p-4 font-medium text-slate-800">UI/UX Product Designer</td>
              <td className="p-4">
                <span className="inline-flex items-center gap-1 text-blue-600 hover:underline cursor-pointer font-medium">
                  <FileText className="w-3.5 h-3.5" /> Portfolio_Behance_Link
                </span>
              </td>
              <td className="p-4">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Đã công khai
                </span>
              </td>
              <td className="p-4 text-right">
                <span className="text-slate-400 text-xs">Đạt tiêu chuẩn</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CareerProfilesPage;
