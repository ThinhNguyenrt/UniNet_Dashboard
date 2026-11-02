import { useState, useEffect } from 'react';
import {
  Percent,
  RotateCcw,
  Save,
  Info,
  User,
  Layers,
  Calculator,
  CheckCircle2,
} from 'lucide-react';

const STORAGE_KEY = 'uninet_financial_commission_settings';

export function AccountantSettingsPage() {
  const [assessorRate, setAssessorRate] = useState<number>(80);
  const [uninetRate, setUninetRate] = useState<number>(20);
  const [notice, setNotice] = useState<string>('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.assessorRate === 'number' && typeof parsed.uninetRate === 'number') {
          setAssessorRate(parsed.assessorRate);
          setUninetRate(parsed.uninetRate);
        }
      }
    } catch {
      // Dùng giá trị mặc định nếu không đọc được
    }
  }, []);

  const handleAssessorChange = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setAssessorRate(0);
      setUninetRate(100);
      return;
    }
    const clamped = Math.max(0, Math.min(100, num));
    setAssessorRate(clamped);
    setUninetRate(100 - clamped);
  };

  const handleUninetChange = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setUninetRate(0);
      setAssessorRate(100);
      return;
    }
    const clamped = Math.max(0, Math.min(100, num));
    setUninetRate(clamped);
    setAssessorRate(100 - clamped);
  };

  const handleReset = () => {
    setAssessorRate(80);
    setUninetRate(20);
    localStorage.removeItem(STORAGE_KEY);
    setNotice('Đã khôi phục cài đặt tỷ lệ mặc định (80% - 20%).');
    setTimeout(() => setNotice(''), 4000);
  };

  const handleSave = () => {
    const data = { assessorRate, uninetRate, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setNotice('Lưu thay đổi cài đặt tài chính thành công!');
    setTimeout(() => setNotice(''), 4000);
  };

  // Tính số tiền ví dụ cho mức phí 100.000 đ
  const baseFee = 100000;
  const assessorAmount = (baseFee * assessorRate) / 100;
  const uninetAmount = (baseFee * uninetRate) / 100;

  return (
    <div className="space-y-6">
      {/* Breadcrumb theo thiết kế */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
          <span>Tài chính</span>
          <span>&gt;</span>
          <span className="text-slate-600 font-medium">Cài đặt tài chính</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Cài đặt tài chính
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Thiết lập tỷ lệ hoa hồng cho dịch vụ thẩm định.
        </p>
      </div>

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Khung cấu hình 2 cột theo đúng hình mẫu */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cột trái: Tỷ lệ hoa hồng thẩm định */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <div className="flex items-start gap-4 mb-6">
            <div className="size-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">
              <Percent size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Tỷ lệ hoa hồng thẩm định
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập tỷ lệ chia doanh thu giữa UniNet và Assessor khi thẩm định hồ sơ/dự án.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Assessor nhận <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={assessorRate}
                  onChange={(e) => handleAssessorChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <span className="absolute right-3.5 text-sm font-medium text-slate-400">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                UniNet (hoa hồng nền tảng) <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={uninetRate}
                  onChange={(e) => handleUninetChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <span className="absolute right-3.5 text-sm font-medium text-slate-400">
                  %
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-blue-50/80 border border-blue-100 p-3 flex items-center gap-2 text-xs font-medium text-blue-700">
            <Info size={16} className="text-blue-500 shrink-0" />
            <span>Tổng tỷ lệ phải bằng 100%.</span>
          </div>
        </div>

        {/* Cột phải: Ví dụ phân chia doanh thu */}
        <div className="lg:col-span-5 rounded-2xl border border-blue-100 bg-blue-50/50 p-6 shadow-xs">
          <div className="flex items-start gap-3.5 mb-5">
            <div className="size-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Calculator size={19} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Ví dụ phân chia doanh thu
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Giả sử phí thẩm định là 100.000 đ, số tiền sẽ được chia như sau:
              </p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <User size={16} className="text-slate-400" />
                <span>Assessor nhận ({assessorRate}%)</span>
              </div>
              <span className="font-bold text-emerald-600 text-sm">
                {assessorAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <Layers size={16} className="text-slate-400" />
                <span>UniNet ({uninetRate}%)</span>
              </div>
              <span className="font-bold text-slate-900 text-sm">
                {uninetAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="border-t border-slate-200/90 pt-3 flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">
                Tổng phí thẩm định
              </span>
              <span className="font-extrabold text-slate-900 text-base">
                {baseFee.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nút hành động góc phải */}
      <div className="flex justify-end items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-colors shadow-xs"
        >
          <RotateCcw size={16} />
          <span>Khôi phục mặc định</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-colors"
        >
          <Save size={16} />
          <span>Lưu thay đổi</span>
        </button>
      </div>
    </div>
  );
}
