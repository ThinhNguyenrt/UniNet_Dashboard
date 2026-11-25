import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { assessorOnboardingService } from '../../services/assessor-onboarding.service';
import { getApiErrorMessage } from '../../services/api';
import { getAssessorOnboardingStatusConfig } from '../../types/assessor-onboarding';
import type { AssessorOnboardingReviewResponse } from '../../types/assessor-onboarding';
import { AssessorOnboardingDetailView } from '../../components/admin/AssessorOnboardingDetailView';

export const AssessorOnboardingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  // Data states
  const [detail, setDetail] = useState<AssessorOnboardingReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Fetch detail
  const fetchDetail = useCallback(
    async (showLoadingSpinner = true, signal?: AbortSignal): Promise<AssessorOnboardingReviewResponse | null> => {
      if (!id) return null;
      if (showLoadingSpinner) setIsLoading(true);
      setErrorMessage(null);

      try {
        const res = await assessorOnboardingService.getDetail(id, signal);
        if (!signal?.aborted) {
          setDetail(res);
          return res;
        }
        return null;
      } catch (err: unknown) {
        if (signal?.aborted) return null;
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          const data = err.response?.data as { code?: string; message?: string } | undefined;
          if (status === 404 || data?.code === 'ONBOARDING_NOT_FOUND') {
            setErrorMessage('Hồ sơ onboarding không còn khả dụng hoặc không tồn tại trên hệ thống.');
          } else if (status === 401) {
            setErrorMessage('Phiên làm việc không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
          } else if (status === 403 || data?.code === 'FORBIDDEN') {
            setErrorMessage(data?.message || 'Bạn không có quyền xem chi tiết hồ sơ này.');
          } else {
            setErrorMessage(getApiErrorMessage(err, 'Không thể tải chi tiết hồ sơ onboarding.'));
          }
        } else {
          setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
        }
        return null;
      } finally {
        if (showLoadingSpinner && !signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [id]
  );

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchDetail(true, controller.signal);
    return () => controller.abort();
  }, [fetchDetail]);

  const showToast = useCallback((msg: string) => {
    setActionSuccessMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setActionSuccessMessage(null), 4000);
  }, []);

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-xs font-medium">Đang tải thông tin chi tiết hồ sơ onboarding...</p>
      </div>
    );
  }

  if (errorMessage || !detail) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4 text-center py-20 animate-fade-in">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Không thể hiển thị hồ sơ</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          {errorMessage || 'Hồ sơ onboarding không tồn tại hoặc bạn không có quyền truy cập.'}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/admin/assessor-onboardings')}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
          >
            Quay lại danh sách hồ sơ
          </button>
          <button
            type="button"
            onClick={() => void fetchDetail(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getAssessorOnboardingStatusConfig(detail.status);

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {actionSuccessMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{actionSuccessMessage}</span>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="ml-2 text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Breadcrumb & Refresh */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/admin/assessor-onboardings')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách hồ sơ assessor
        </button>

        <button
          type="button"
          onClick={() => void fetchDetail(false)}
          className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Làm mới
        </button>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="space-y-1.5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-100 text-slate-700">
              Hồ sơ assessor
            </span>
            <span
              className={`text-xs font-bold px-3 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
            >
              {statusConfig.label}
            </span>
            {detail.autoApprove && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Tự động duyệt: Bật
              </span>
            )}
          </div>

          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {detail.fullName || detail.emailNormalized}
          </h1>
          <p className="text-xs text-slate-500">
            Email: <span className="font-semibold text-slate-700">{detail.emailNormalized}</span>
          </p>
        </div>

        <AssessorOnboardingDetailView
          detail={detail}
          isAdmin={isAdmin}
          variant="page"
          onRefreshDetail={() => fetchDetail(false)}
          onNotFound={(msg) => setErrorMessage(msg)}
          onToast={showToast}
        />
      </div>
    </div>
  );
};

export default AssessorOnboardingDetailPage;
