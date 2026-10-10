import React from 'react';
import { DollarSign, ArrowUpRight, TrendingUp, Calendar, Download } from 'lucide-react';

export const RevenuePage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quản lý Doanh thu
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi dòng tiền, biến động doanh thu và các giao dịch thanh toán gói dịch vụ trên UniNet.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 shadow-xs transition"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Tháng này
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Tổng doanh thu</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">428.500.000 ₫</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+14.2% so với tháng trước</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Gói Doanh nghiệp</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">312.000.000 ₫</div>
            <div className="text-xs text-slate-400 mt-1">Chiếm 72.8% tổng tỷ trọng</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Gói Trường đại học</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">116.500.000 ₫</div>
            <div className="text-xs text-slate-400 mt-1">18 trường đại học đối tác</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Giao dịch thành công</span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">1.482</div>
            <div className="text-xs text-slate-400 mt-1">Tỷ lệ thanh toán 99.1%</div>
          </div>
        </div>
      </div>

      {/* Main Content Container / Placeholder Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Lịch sử giao dịch gần đây</h2>
          <span className="text-xs text-slate-400">Đang cập nhật thời gian thực</span>
        </div>

        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="p-3.5">Mã đơn</th>
                <th className="p-3.5">Đối tác / Đơn vị</th>
                <th className="p-3.5">Gói dịch vụ</th>
                <th className="p-3.5">Số tiền</th>
                <th className="p-3.5">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              <tr>
                <td className="p-3.5 font-mono font-medium text-slate-900">TXN-89402</td>
                <td className="p-3.5 font-medium">Tập đoàn Viettel High-Tech</td>
                <td className="p-3.5">Doanh nghiệp Pro 12 Tháng</td>
                <td className="p-3.5 font-bold text-slate-900">36.000.000 ₫</td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                    Thành công
                  </span>
                </td>
              </tr>
              <tr>
                <td className="p-3.5 font-mono font-medium text-slate-900">TXN-89401</td>
                <td className="p-3.5 font-medium">Đại học FPT Cần Thơ</td>
                <td className="p-3.5">Đại học Standard</td>
                <td className="p-3.5 font-bold text-slate-900">18.500.000 ₫</td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                    Thành công
                  </span>
                </td>
              </tr>
              <tr>
                <td className="p-3.5 font-mono font-medium text-slate-900">TXN-89400</td>
                <td className="p-3.5 font-medium">Công ty Cổ phần VNG</td>
                <td className="p-3.5">Gói Quảng bá Dự án</td>
                <td className="p-3.5 font-bold text-slate-900">8.000.000 ₫</td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                    Thành công
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

export default RevenuePage;
