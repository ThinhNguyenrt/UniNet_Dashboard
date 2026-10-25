import React from 'react';
import { Users, UserPlus, Shield, CheckCircle, Search } from 'lucide-react';

export const StaffPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quản lý Nhân viên
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý danh sách nhân sự vận hành hệ thống UniNet, phân quyền vai trò và trạng thái hoạt động.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Thêm nhân viên mới
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên, email hoặc vai trò..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 focus:outline-none">
            <option>Tất cả vai trò</option>
            <option>Admin</option>
            <option>Verificator</option>
            <option>Moderator</option>
          </select>
          <select className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 focus:outline-none">
            <option>Tất cả trạng thái</option>
            <option>Đang hoạt động</option>
            <option>Tạm khóa</option>
          </select>
        </div>
      </div>

      {/* Staff Table Container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80">
            <tr>
              <th className="p-4">Nhân viên</th>
              <th className="p-4">Email</th>
              <th className="p-4">Vai trò</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            <tr>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs">
                    A
                  </div>
                  <div className="font-semibold text-slate-900">Admin System</div>
                </div>
              </td>
              <td className="p-4 font-mono">admin@gmail.com</td>
              <td className="p-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-200">
                  <Shield className="w-2.5 h-2.5" /> Admin
                </span>
              </td>
              <td className="p-4">
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-xs">
                  <CheckCircle className="w-3.5 h-3.5" /> Hoạt động
                </span>
              </td>
              <td className="p-4 text-right">
                <button className="text-blue-600 hover:text-blue-800 font-semibold text-xs">
                  Chỉnh sửa
                </button>
              </td>
            </tr>
            <tr>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                    V
                  </div>
                  <div className="font-semibold text-slate-900">UniNet Verificator</div>
                </div>
              </td>
              <td className="p-4 font-mono">verificator@gmail.com</td>
              <td className="p-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                  <Users className="w-2.5 h-2.5" /> Verificator
                </span>
              </td>
              <td className="p-4">
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-xs">
                  <CheckCircle className="w-3.5 h-3.5" /> Hoạt động
                </span>
              </td>
              <td className="p-4 text-right">
                <button className="text-blue-600 hover:text-blue-800 font-semibold text-xs">
                  Chỉnh sửa
                </button>
              </td>
            </tr>
            <tr>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs">
                    M
                  </div>
                  <div className="font-semibold text-slate-900">Community Moderator</div>
                </div>
              </td>
              <td className="p-4 font-mono">moderator@gmail.com</td>
              <td className="p-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                  <Shield className="w-2.5 h-2.5" /> Moderator
                </span>
              </td>
              <td className="p-4">
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-xs">
                  <CheckCircle className="w-3.5 h-3.5" /> Hoạt động
                </span>
              </td>
              <td className="p-4 text-right">
                <button className="text-blue-600 hover:text-blue-800 font-semibold text-xs">
                  Chỉnh sửa
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffPage;
