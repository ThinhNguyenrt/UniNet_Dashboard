import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { roleDefaultRoutes } from '../data/navigation';

export const UnauthorizedPage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const attemptedPath = (location.state as { attemptedPath?: string })?.attemptedPath;
  const targetRoute = currentUser ? roleDefaultRoutes[currentUser.role] : '/login';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-xl shadow-slate-200/80">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">403</h1>
        <h2 className="text-lg font-bold text-slate-800 mt-1">Không có quyền truy cập</h2>
        <p className="text-sm text-slate-500 mt-2 mb-4">
          Tài khoản của bạn thuộc vai trò{' '}
          <span className="font-bold text-slate-900 uppercase">
            {currentUser?.role || 'Khách'}
          </span>
          , không có quyền truy cập vào phân vùng chức năng này.
        </p>

        {attemptedPath && (
          <div className="p-2.5 bg-slate-100 rounded-xl font-mono text-xs text-slate-600 mb-6 truncate">
            Đường dẫn yêu cầu: {attemptedPath}
          </div>
        )}

        <div className="space-y-2.5">
          <Link
            to={targetRoute}
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition shadow-md shadow-blue-500/20"
          >
            <ArrowLeft className="w-4 h-4" />
            Về khu vực làm việc của bạn
          </Link>

          {currentUser && (
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
            >
              Đăng nhập bằng tài khoản khác
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
