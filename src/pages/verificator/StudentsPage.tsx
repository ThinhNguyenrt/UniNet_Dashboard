import React from 'react';
import { GraduationCap, Search, Clock, FileCheck } from 'lucide-react';

export const StudentsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Xác thực Sinh viên
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kiểm tra hồ sơ, thẻ sinh viên và phê duyệt chứng nhận sinh viên chính quy trên UniNet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            14 hồ sơ chờ duyệt
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo MSSV, họ tên, trường..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600">
            <option>Tất cả trường đại học</option>
            <option>Đại học FPT</option>
            <option>ĐH Bách Khoa</option>
            <option>ĐH Công nghệ Thông tin</option>
          </select>
          <select className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600">
            <option>Tất cả trạng thái</option>
            <option>Chờ xác thực</option>
            <option>Đã phê duyệt</option>
            <option>Từ chối</option>
          </select>
        </div>
      </div>

      {/* Verification Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80">
            <tr>
              <th className="p-4">Sinh viên</th>
              <th className="p-4">MSSV & Trường</th>
              <th className="p-4">Tài liệu nộp</th>
              <th className="p-4">Ngày gửi</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            <tr>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Nguyễn Văn An</div>
                    <div className="text-[11px] text-slate-400 font-mono">an.nv@fpt.edu.vn</div>
                  </div>
                </div>
              </td>
              <td className="p-4">
                <div className="font-medium text-slate-800">SE160248</div>
                <div className="text-slate-400 text-[11px]">Đại học FPT Cần Thơ</div>
              </td>
              <td className="p-4">
                <span className="inline-flex items-center gap-1 text-blue-600 hover:underline cursor-pointer font-medium">
                  <FileCheck className="w-3.5 h-3.5" /> Thẻ sinh viên (Mặt trước/sau)
                </span>
              </td>
              <td className="p-4 text-slate-400">10/10/2026 09:15</td>
              <td className="p-4">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Chờ duyệt
                </span>
              </td>
              <td className="p-4 text-right space-x-2">
                <button className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs">
                  Duyệt
                </button>
                <button className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold border border-red-200">
                  Từ chối
                </button>
              </td>
            </tr>

            <tr>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Trần Thị Bích</div>
                    <div className="text-[11px] text-slate-400 font-mono">bich.tt@hcmut.edu.vn</div>
                  </div>
                </div>
              </td>
              <td className="p-4">
                <div className="font-medium text-slate-800">2010892</div>
                <div className="text-slate-400 text-[11px]">Đại học Bách Khoa HCM</div>
              </td>
              <td className="p-4">
                <span className="inline-flex items-center gap-1 text-blue-600 hover:underline cursor-pointer font-medium">
                  <FileCheck className="w-3.5 h-3.5" /> Giấy xác nhận sinh viên
                </span>
              </td>
              <td className="p-4 text-slate-400">09/10/2026 14:30</td>
              <td className="p-4">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Đã xác thực
                </span>
              </td>
              <td className="p-4 text-right">
                <span className="text-slate-400 text-xs">Đã hoàn thành</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentsPage;
