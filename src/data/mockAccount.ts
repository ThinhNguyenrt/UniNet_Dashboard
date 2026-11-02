export interface MockAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'moderator';
  roleName: string;
  description: string;
  avatar?: string;
}

export const mockAccounts: MockAccount[] = [
  {
    id: 'acc-admin',
    name: 'Quản trị viên Hệ thống',
    email: 'admin@gmail.com',
    password: '123456',
    role: 'admin',
    roleName: 'Admin (Quản trị viên)',
    description: 'Toàn quyền cấu hình hệ thống, quản lý người dùng và phân quyền'
  },

  {
    id: 'acc-moderator',
    name: 'Kiểm duyệt viên Cộng đồng',
    email: 'moderator@gmail.com',
    password: '123456',
    role: 'moderator',
    roleName: 'Moderator (Kiểm duyệt viên)',
    description: 'Kiểm duyệt bài đăng, nhóm thảo luận và xử lý báo cáo vi phạm'
  }
];
