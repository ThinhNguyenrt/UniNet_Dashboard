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
export function StaffPage() { return <div className="space-y-6"><details className="rounded-2xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer font-semibold text-slate-900">Vai trò và phạm vi quyền</summary><p className="mt-3 text-sm text-slate-500">Nhân viên chỉ sử dụng chức năng trong vai trò của mình. Admin có thể giới hạn từng quyền trong phạm vi đó.</p><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['STT', 'Role', 'Tên hiển thị', 'Nhóm', 'Chức năng'].map(label => <th key={label} className="p-3 text-slate-500">{label}</th>)}</tr></thead><tbody>{roles.map((role, index) => <tr key={role[0]} className="border-t border-slate-100"><td className="p-3">{index}</td>{role.map((value, column) => <td key={column} className="p-3">{column === 0 ? <code className="rounded bg-slate-100 px-2 py-1 text-xs">{value}</code> : value}</td>)}</tr>)}</tbody></table></div></details><UsersPage staffOnly /></div>; }
