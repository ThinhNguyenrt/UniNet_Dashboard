import { Link } from 'react-router-dom';
import { UserCheck, ArrowRight, ShieldAlert } from 'lucide-react';
import { UsersPage } from './UsersPage';

const roles = [
  ['Student', 'Sinh viên', 'Người dùng', 'Cộng đồng, dự án, hồ sơ và ví cá nhân'],
  ['Partner', 'Đối tác', 'Người dùng', 'Tuyển dụng, quảng cáo, hồ sơ tổ chức và ví cá nhân'],
  ['Assessor', 'Chuyên gia thẩm định', 'Chuyên gia', 'Lịch chuyên gia, thẩm định dự án và báo cáo được phân công'],
  ['Verifier', 'Nhân viên xác minh', 'Nhân sự hệ thống', 'Xác minh sinh viên, đối tác và xem thông tin hồ sơ'],
  ['Moderator', 'Nhân viên kiểm duyệt', 'Nhân sự hệ thống', 'Kiểm duyệt nội dung, dự án, tuyển dụng và xử lý vi phạm'],
  ['Accountant', 'Kế toán', 'Nhân sự hệ thống', 'Thanh toán, thu nhập, hoàn tiền, rút tiền, lệnh chi và báo cáo'],
  ['Admin', 'Quản trị viên', 'Quản trị hệ thống', 'Toàn bộ chức năng và quản lý phân quyền'],
];

export function StaffPage() {
  return (
    <div className="space-y-6">
      {/* Assessor Onboarding Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-slate-50 border border-blue-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-600 text-white rounded-lg">
              <UserCheck className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold text-slate-900">
              Quy trình Onboarding chuyên gia thẩm định
            </h2>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Chuyên gia thẩm định (Assessor) tham gia hệ thống qua quy trình độc lập: tạo lời mời,
            chuyên gia tự điền thông tin, ký hợp đồng điện tử và quản trị viên phê duyệt. Không tạo
            trực tiếp bằng biểu mẫu cấp tài khoản nhân sự thông thường.
          </p>
        </div>

        <Link
          to="/admin/assessor-onboardings"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition shrink-0"
        >
          <span>Onboarding thẩm định viên</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Role scopes description */}
      <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <summary className="cursor-pointer font-semibold text-slate-900 text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-500" />
            Vai trò và phạm vi quyền nhân sự
          </span>
          <span className="text-xs text-blue-600 font-normal">Nhấn để xem chi tiết</span>
        </summary>
        <p className="mt-3 text-xs text-slate-500">
          Nhân viên chỉ sử dụng chức năng trong vai trò của mình. Admin có thể giới hạn từng quyền trong phạm vi đó.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                {['STT', 'Role', 'Tên hiển thị', 'Nhóm', 'Chức năng'].map((label) => (
                  <th key={label} className="p-2.5 font-semibold">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map((role, index) => (
                <tr key={role[0]} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-2.5 text-slate-400">{index + 1}</td>
                  {role.map((value, column) => (
                    <td key={column} className="p-2.5">
                      {column === 0 ? (
                        <code className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-700">
                          {value}
                        </code>
                      ) : (
                        value
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {/* Staff list */}
      <UsersPage staffOnly />
    </div>
  );
}
export default StaffPage;
