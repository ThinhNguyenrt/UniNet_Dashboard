import React from 'react';
import { Building2, Search, FileText } from 'lucide-react';

export const CompaniesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Xác thực Doanh nghiệp
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Xác minh giấy phép kinh doanh, mã số thuế và hồ sơ năng lực của các doanh nghiệp đối tác tuyển dụng.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
            6 doanh nghiệp mới đăng ký
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên công ty, mã số thuế..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600">
            <option>Tất cả trạng thái</option>
            <option>Chờ xác thực GPKD</option>
            <option>Đã phê duyệt</option>
            <option>Yêu cầu bổ sung hồ sơ</option>
          </select>
        </div>
      </div>

      {/* Companies Verification Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80">
            <tr>
              <th className="p-4">Doanh nghiệp</th>
              <th className="p-4">Mã số thuế</th>
              <th className="p-4">Người đại diện</th>
              <th className="p-4">Tài liệu pháp lý</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            <tr>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Công ty TNHH Phần mềm TechX</div>
                    <div className="text-[11px] text-slate-400">Quận Cầu Giấy, Hà Nội</div>
                  </div>
                </div>
              </td>
              <td className="p-4 font-mono font-medium">0109845231</td>
              <td className="p-4">Trần Minh Hoàng (CEO)</td>
              <td className="p-4">
                <span className="inline-flex items-center gap-1 text-blue-600 hover:underline cursor-pointer font-medium">
                  <FileText className="w-3.5 h-3.5" /> GPKD_TechX.pdf
                </span>
              </td>
              <td className="p-4">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Chờ thẩm định
                </span>
              </td>
              <td className="p-4 text-right space-x-2">
                <button className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs">
                  Phê duyệt
                </button>
                <button className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                  Chi tiết
                </button>
              </td>
            </tr>

            <tr>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Tập đoàn Viễn thông & CNTT V-Global</div>
                    <div className="text-[11px] text-slate-400">Quận 1, TP. Hồ Chí Minh</div>
                  </div>
                </div>
              </td>
              <td className="p-4 font-mono font-medium">0301458921</td>
              <td className="p-4">Lê Thị Thanh Mai (HR Director)</td>
              <td className="p-4">
                <span className="inline-flex items-center gap-1 text-blue-600 hover:underline cursor-pointer font-medium">
                  <FileText className="w-3.5 h-3.5" /> GPKD_VGlobal_Verified.pdf
                </span>
              </td>
              <td className="p-4">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Đã duyệt tích xanh
                </span>
              </td>
              <td className="p-4 text-right">
                <span className="text-slate-400 text-xs">Đã xác minh</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompaniesPage;
