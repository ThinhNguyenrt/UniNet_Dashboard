/**
 * Định nghĩa kiểu dữ liệu và hằng số cho chức năng Báo cáo vi phạm cộng đồng (Community Reports)
 * Tuân thủ hợp đồng API trong UniNet_BE (Controller: CommunityController, Service: CommunityService)
 */

export const ContentReportStatus = {
  Open: 0, // Chờ xử lý
  Resolved: 1, // Không vi phạm (giữ nguyên trạng thái bài)
  Dismissed: 2, // Xác nhận vi phạm (ẩn bài đăng nếu đang hiển thị)
} as const;
export type ContentReportStatus = (typeof ContentReportStatus)[keyof typeof ContentReportStatus];

export const PostStatus = {
  PendingReview: 0, // Chờ duyệt
  Published: 1, // Đang hiển thị / Công khai
  Hidden: 2, // Đã ẩn
  Blocked: 3, // Bị chặn
} as const;
export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

export const contentReportStatusLabels: Record<number, string> = {
  [ContentReportStatus.Open]: 'Chờ xử lý',
  [ContentReportStatus.Resolved]: 'Không vi phạm',
  [ContentReportStatus.Dismissed]: 'Xác nhận vi phạm',
};

export const postStatusLabels: Record<number, string> = {
  [PostStatus.PendingReview]: 'Chờ duyệt',
  [PostStatus.Published]: 'Đang hiển thị',
  [PostStatus.Hidden]: 'Đã ẩn',
  [PostStatus.Blocked]: 'Bị chặn',
};

export interface ContentReportResponse {
  id: string; // Report ID (UUID)
  postId: string; // Post ID (UUID)
  reporterUserId: string; // Reporter user UUID
  reporterName: string; // Tên người gửi báo cáo
  reason: string; // Lý do báo cáo
  status: ContentReportStatus; // Trạng thái báo cáo: 0 = Open, 1 = Resolved, 2 = Dismissed
  createdAt: string; // ISO 8601 thời điểm gửi báo cáo
  postStatus: PostStatus; // Trạng thái bài đăng: 0 = PendingReview, 1 = Published, 2 = Hidden, 3 = Blocked
  isPostDeleted: boolean; // Bài đăng đã bị xóa mềm hay chưa
  authorUserId: string; // Author user UUID
  authorName: string; // Tên tác giả bài đăng
  description: string | null; // Nội dung bài đăng
  mediaUrls: string[]; // Danh sách link ảnh đính kèm bài đăng
}

export interface ContentReportQuery {
  status?: number; // 0 = Open, 1 = Resolved, 2 = Dismissed (không truyền để lấy Tất cả)
  page?: number;
  pageSize?: number;
}

export interface ReviewContentReportRequest {
  isViolation: boolean;
}
