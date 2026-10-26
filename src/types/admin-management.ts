export const adminPermissions = {
  usersView: 'users.view', usersDetail: 'users.detail', usersLock: 'users.lock', usersUnlock: 'users.unlock',
  studentReview: 'verification.student.review', partnerReview: 'verification.partner.review',
  staffManage: 'staff.manage', permissionsManage: 'permissions.manage',
} as const;
export const permissionLabels: Record<string, string> = {
  'users.view': 'Xem người dùng', 'users.detail': 'Xem chi tiết người dùng', 'users.lock': 'Khóa tài khoản', 'users.unlock': 'Mở khóa tài khoản',
  'verification.student.review': 'Xem và xét duyệt sinh viên', 'verification.partner.review': 'Xem và xét duyệt đối tác',
  'project.review': 'Kiểm duyệt dự án', 'recruitment.review': 'Kiểm duyệt tuyển dụng', 'verification.evidence.review': 'Xác minh minh chứng',
  'community.review': 'Kiểm duyệt cộng đồng', 'notifications.manage': 'Quản lý thông báo hệ thống', 'staff.manage': 'Tạo nhân viên', 'permissions.manage': 'Quản lý phân quyền',
};
export interface AdminCapabilities { permissions: string[]; pendingStudents: number | null; pendingPartners: number | null }
export interface AdminPage<T> { items: T[]; page: number; pageSize: number; total: number }
export interface AdminUser { id: string; profileId: string | null; fullName: string; nickname: string; email: string; avatarUrl: string | null; role: number; status: number; createdAt: string; isVerified: boolean; verificationStatus: number | null }
export interface UserStats { total: number; active: number; locked: number; verified: number }
export interface PublicProfile { coverUrl: string | null; bio: string | null; phone: string | null; universityName: string | null; major: string | null; studentCode: string | null; organizationName: string | null; partnerType: number | null; industry: string | null; website: string | null; contactEmail: string | null; address: string | null }
export interface VerificationHistory { id: string; type: number; status: number; submittedAt: string; reviewedAt: string | null; reason: string | null; reviewedBy: string | null; reviewerName: string | null }
export interface StatusHistory { id: string; previousStatus: number; status: number; reason: string; actorAccountId: string; actorName: string; createdAt: string }
export interface UserDetail { account: AdminUser; profile: PublicProfile | null; verifications: VerificationHistory[]; statusHistory: StatusHistory[] }
export interface VerificationItem { id: string; userId: string; accountId: string; email: string; fullName: string; avatarUrl: string | null; phone: string | null; organizationName: string | null; partnerType: number | null; schoolName: string | null; studentCode: string | null; status: number; submittedAt: string; reviewedAt: string | null; reviewedBy: string | null; reviewerName: string | null }
export interface VerificationPage { items: VerificationItem[]; page: number; pageSize: number; totalItems: number }
export interface VerificationStats { total: number; pending: number; approved: number; rejected: number; cancelled: number }
export interface VerificationDocument { index: number; fileName: string; contentType: string | null; uploaded: boolean }
export interface VerificationDetail { application: VerificationItem; profile: PublicProfile; submittedData: Record<string, string | null>; documents: VerificationDocument[]; history: VerificationHistory[]; rejectReason: string | null; isVerified: boolean }
export interface PermissionEntry { permission: string; granted: boolean; override: boolean | null }
export type VerificationKind = 'student' | 'partner';
export const roleLabels = ['Sinh viên', 'Đối tác', 'Admin', 'Kiểm duyệt viên', 'Xác minh viên'];
export const accountStatusLabels = ['Chờ kích hoạt', 'Đang hoạt động', 'Đã khóa', 'Đã xóa'];
export const verificationStatusLabels = ['Chờ duyệt', 'Đã duyệt', 'Từ chối', 'Đã hủy'];
export const partnerTypeLabels = ['Doanh nghiệp', 'Trường học', 'Cửa hàng', 'Trung tâm đào tạo', 'Khác'];
