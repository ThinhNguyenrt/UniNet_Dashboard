export interface MockAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'verificator' | 'moderator';
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
    id: 'acc-verificator',
    name: 'Chuyên viên Xác thực',
    email: 'verificator@gmail.com',
    password: '123456',
    role: 'verificator',
    roleName: 'Verificator (Xác thực viên)',
    description: 'Kiểm tra hồ sơ sinh viên, thông tin trường và cấp tích xanh'
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
