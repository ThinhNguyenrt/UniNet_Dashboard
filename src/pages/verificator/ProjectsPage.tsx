import React from 'react';
import { FolderKanban, Search, Clock } from 'lucide-react';

export const VerificatorProjectsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Thẩm định Hồ sơ Dự án
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Xác minh tính xác thực, giảng viên hướng dẫn và đối tác bảo trợ cho các đề tài/dự án đăng ký trên hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            8 dự án đang chờ thẩm định
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên dự án, giảng viên hướng dẫn..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600">
            <option>Tất cả trạng thái thẩm định</option>
            <option>Chờ thẩm định</option>
            <option>Đã thẩm định đạt chuẩn</option>
            <option>Yêu cầu bổ sung hồ sơ</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80">
            <tr>
              <th className="p-4">Dự án</th>
              <th className="p-4">Nhóm thực hiện</th>
              <th className="p-4">Giảng viên / Đơn vị bảo trợ</th>
              <th className="p-4">Hồ sơ thẩm định</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            <tr>
              <td className="p-4">
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-blue-600" />
                  Nền tảng Học trực tuyến EdTech UniConnect
                </div>
              </td>
              <td className="p-4 font-medium">Nhóm UniDev (4 thành viên)</td>
              <td className="p-4">TS. Trần Anh Tuấn (Trưởng khoa CNTT)</td>
              <td className="p-4">
                <span className="text-blue-600 hover:underline cursor-pointer font-medium">
                  DeCuong_ChiTiet.pdf
                </span>
              </td>
              <td className="p-4">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Chờ duyệt
                </span>
              </td>
              <td className="p-4 text-right space-x-2">
                <button className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs">
                  Đạt chuẩn
                </button>
                <button className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                  Xem xét
                </button>
              </td>
            </tr>

            <tr>
              <td className="p-4">
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-emerald-600" />
                  Hệ thống Giám sát Nông nghiệp Thông minh IoT
                </div>
              </td>
              <td className="p-4 font-medium">AgriTech Lab</td>
              <td className="p-4">Doanh nghiệp VNPT Technology</td>
              <td className="p-4">
                <span className="text-blue-600 hover:underline cursor-pointer font-medium">
                  HopDongBaoTro_Signed.pdf
                </span>
              </td>
              <td className="p-4">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Đã thẩm định
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

export default VerificatorProjectsPage;
