import React from 'react';
import { Package, Plus, Check } from 'lucide-react';

export const ServicePackagesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quản lý Gói dịch vụ
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Thiết lập mức phí, hạn mức sử dụng và tính năng cho các gói dịch vụ trường học và doanh nghiệp trên UniNet.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Tạo gói mới
        </button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Package 1 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Package className="w-5 h-5" />
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                Cơ bản
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Doanh nghiệp Standard</h2>
            <p className="text-xs text-slate-500 mt-1">Phù hợp cho các startup và doanh nghiệp vừa và nhỏ.</p>
            <div className="my-5">
              <span className="text-3xl font-extrabold text-slate-900">4.990.000 ₫</span>
              <span className="text-xs text-slate-400"> / năm</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Đăng tối đa 15 tin tuyển dụng / tháng
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Truy cập kho 500 CV sinh viên
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Hỗ trợ kỹ thuật tiêu chuẩn
              </li>
            </ul>
          </div>
          <button className="w-full mt-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition">
            Chỉnh sửa gói
          </button>
        </div>

        {/* Package 2 */}
        <div className="bg-white rounded-2xl border-2 border-blue-600 p-6 shadow-md shadow-blue-500/5 flex flex-col justify-between relative">
          <div className="absolute -top-3 right-5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
            Phổ biến nhất
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="p-2.5 bg-blue-600 text-white rounded-xl">
                <Package className="w-5 h-5" />
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                Nâng cao
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Doanh nghiệp Enterprise</h2>
            <p className="text-xs text-slate-500 mt-1">Dành cho tập đoàn công nghệ có nhu cầu tuyển dụng và hợp tác lớn.</p>
            <div className="my-5">
              <span className="text-3xl font-extrabold text-slate-900">12.500.000 ₫</span>
              <span className="text-xs text-slate-400"> / năm</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Không giới hạn tin tuyển dụng
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Toàn quyền kết nối mạng lưới sinh viên
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Tổ chức Hackathon & Project chuyên đề
              </li>
            </ul>
          </div>
          <button className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm">
            Chỉnh sửa gói
          </button>
        </div>

        {/* Package 3 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Package className="w-5 h-5" />
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                Đối tác giáo dục
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Trường Đại học Partner</h2>
            <p className="text-xs text-slate-500 mt-1">Gói liên kết dành riêng cho các trường đại học và khoa đào tạo.</p>
            <div className="my-5">
              <span className="text-3xl font-extrabold text-slate-900">18.000.000 ₫</span>
              <span className="text-xs text-slate-400"> / năm</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Cấp tài khoản chính thức cho toàn bộ sinh viên
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Hệ thống báo cáo thực tập & việc làm
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Ưu tiên kết nối doanh nghiệp tuyển dụng
              </li>
            </ul>
          </div>
          <button className="w-full mt-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition">
            Chỉnh sửa gói
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServicePackagesPage;
