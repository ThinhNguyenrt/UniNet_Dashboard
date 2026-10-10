import React from 'react';
import { Search, Image as ImageIcon } from 'lucide-react';

export const AdvertisementsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Kiểm duyệt Banner & Quảng cáo
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kiểm tra nội dung hình ảnh, liên kết đích và thời hạn của các chiến dịch truyền thông hiển thị trên UniNet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
            2 banner đang chờ phê duyệt
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên chiến dịch, đối tác..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600">
            <option>Tất cả vị trí hiển thị</option>
            <option>Banner Trang chủ</option>
            <option>Sidebar Diễn đàn</option>
            <option>Góc Bản tin Tuyển dụng</option>
          </select>
        </div>
      </div>

      {/* Ads Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80">
            <tr>
              <th className="p-4">Chiến dịch quảng cáo</th>
              <th className="p-4">Đối tác đăng ký</th>
              <th className="p-4">Vị trí & Thời hạn</th>
              <th className="p-4">Trạng thái duyệt</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            <tr>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Cuộc thi Hackathon Sinh viên FPT 2026</div>
                    <div className="text-[11px] text-blue-600 hover:underline cursor-pointer">
                      https://fpt-hackathon.vn
                    </div>
                  </div>
                </div>
              </td>
              <td className="p-4 font-medium text-slate-800">FPT Software Academy</td>
              <td className="p-4">
                <div className="font-semibold text-slate-700">Top Banner Trang chủ</div>
                <div className="text-slate-400 text-[11px]">15/10/2026 - 30/11/2026</div>
              </td>
              <td className="p-4">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Chờ duyệt hiển thị
                </span>
              </td>
              <td className="p-4 text-right space-x-2">
                <button className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs">
                  Phê duyệt
                </button>
                <button className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                  Xem trước banner
                </button>
              </td>
            </tr>

            <tr>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Khóa học AWS Cloud Practitioner Ưu đãi 50%</div>
                    <div className="text-[11px] text-blue-600 hover:underline cursor-pointer">
                      https://cloudhub.edu.vn/promo
                    </div>
                  </div>
                </div>
              </td>
              <td className="p-4 font-medium text-slate-800">Trung tâm Đào tạo CloudHub</td>
              <td className="p-4">
                <div className="font-semibold text-slate-700">Sidebar Blog</div>
                <div className="text-slate-400 text-[11px]">01/10/2026 - 31/10/2026</div>
              </td>
              <td className="p-4">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Đang hoạt động
                </span>
              </td>
              <td className="p-4 text-right">
                <button className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-lg text-xs font-semibold transition">
                  Tạm ngưng
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdvertisementsPage;
