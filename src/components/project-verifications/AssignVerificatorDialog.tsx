import React, { useState, useEffect } from 'react';
import { X, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import { adminAssignmentsService } from '../../services/admin-assignments.service';
import type { SuitableVerificatorResponse } from '../../types/admin-project-verifications';
import { getApiErrorMessage } from '../../services/api';

interface AssignVerificatorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectVerificationId: string;
  onSuccess: () => void;
}

export const AssignVerificatorDialog: React.FC<AssignVerificatorDialogProps> = ({
  isOpen,
  onClose,
  projectVerificationId,
  onSuccess,
}) => {
  const [candidates, setCandidates] = useState<SuitableVerificatorResponse[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !projectVerificationId) return;

    let ignore = false;
    const controller = new AbortController();

    async function fetchCandidates() {
      try {
        const data = await adminAssignmentsService.getCandidates(
          projectVerificationId,
          undefined,
          controller.signal
        );
        if (!ignore) {
          setCandidates(data);
          if (data.length > 0) {
            setSelectedUserId(data[0].userId);
          }
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore && !controller.signal.aborted) {
          setErrorMessage(
            getApiErrorMessage(
              err,
              'Không thể tải danh sách người thẩm định phù hợp. Vui lòng thử lại.'
            )
          );
          setIsLoading(false);
        }
      }
    }

    fetchCandidates();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [isOpen, projectVerificationId]);

  if (!isOpen) return null;

  const handleClose = () => {
    setCandidates([]);
    setSelectedUserId('');
    setErrorMessage(null);
    setIsLoading(true);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setErrorMessage('Vui lòng chọn một người thẩm định.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await adminAssignmentsService.createAssignment({
        projectVerificationId,
        assignedToUserId: selectedUserId,
      });
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      setErrorMessage(
        getApiErrorMessage(
          err,
          'Phân công không thành công. Hồ sơ có thể đã thay đổi trạng thái hoặc người được chọn không còn khả dụng.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                Phân công người thẩm định
              </h3>
              <p className="text-xs text-slate-500">
                Chỉ hiển thị thẩm định viên đáp ứng tiêu chuẩn và có lịch rảnh khớp với lịch hẹn
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-sm">Đang kiểm tra lịch và tải danh sách thẩm định viên...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Không có người thẩm định phù hợp</span>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                Không tìm thấy thẩm định viên nào đang hoạt động, có lịch rảnh bao phủ toàn bộ buổi họp và không xung đột lịch hoặc có liên quan đến dự án này.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Chọn người thẩm định (Assessor) <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              >
                {candidates.map((c) => (
                  <option key={c.userId} value={c.userId}>
                    {c.fullName}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                Lưu ý: Hệ thống chỉ ghi nhận thẩm định viên được đề xuất từ backend.
              </p>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading || candidates.length === 0 || !selectedUserId}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Đang phân công...' : 'Xác nhận phân công'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
