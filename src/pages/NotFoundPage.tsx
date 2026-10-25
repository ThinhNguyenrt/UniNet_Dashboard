import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { roleDefaultRoutes } from '../data/navigation';

export const NotFoundPage: React.FC = () => {
  const { currentUser } = useAuth();
  const targetRoute = currentUser ? roleDefaultRoutes[currentUser.role] : '/login';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-xl shadow-slate-200/80">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-200">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">404</h1>
        <h2 className="text-lg font-bold text-slate-800 mt-1">Không tìm thấy trang</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          Đường dẫn bạn yêu cầu không tồn tại hoặc đã được thay đổi trong hệ thống UniNet Dashboard.
        </p>

        <Link
          to={targetRoute}
          className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition shadow-md shadow-blue-500/20"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại trang quản trị
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
