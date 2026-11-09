import React, { useState, useEffect } from 'react';
import { X, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { adminAssignmentsService } from '../../services/admin-assignments.service';
import type { SuitableVerificatorResponse } from '../../types/admin-project-verifications';
import { getApiErrorMessage } from '../../services/api';

interface ReplaceVerificatorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: {
    id: string;
    assignedToUserId: string;
    assignedToFullName?: string | null;
    status: number;
  } | null;
  projectVerificationId: string;
  onSuccess: () => void;
}

export const ReplaceVerificatorDialog: React.FC<ReplaceVerificatorDialogProps> = ({
  isOpen,
  onClose,
  assignment,
  projectVerificationId,
  onSuccess,
}) => {
  const [candidates, setCandidates] = useState<SuitableVerificatorResponse[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !assignment || !projectVerificationId) return;

    let ignore = false;
    const controller = new AbortController();

    async function fetchCandidates() {
      try {
        const data = await adminAssignmentsService.getCandidates(
          projectVerificationId,
          assignment?.id,
          controller.signal
        );
        if (!ignore) {
          const filtered = data.filter((c) => c.userId !== assignment?.assignedToUserId);
          setCandidates(filtered);
          if (filtered.length > 0) {
            setSelectedUserId(filtered[0].userId);
          }
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore && !controller.signal.aborted) {
          setErrorMessage(
            getApiErrorMessage(
              err,
              'Không thể tải danh sách người thẩm định thay thế. Vui lòng thử lại.'
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
  }, [isOpen, assignment, projectVerificationId]);

  if (!isOpen || !assignment) return null;

  const handleClose = () => {
    setCandidates([]);
    setSelectedUserId('');
    setReason('');
    setErrorMessage(null);
    setIsLoading(true);
    onClose();
  };

  const trimmedReason = reason.trim();
  const isReasonValid = trimmedReason.length >= 1 && trimmedReason.length <= 2000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setErrorMessage('Vui lòng chọn một người thẩm định thay thế.');
      return;
    }
    if (!isReasonValid) {
      setErrorMessage('Lý do thay thế phải chứa từ 1 đến 2000 ký tự.');
      return;
    }
    if (selectedUserId === assignment.assignedToUserId) {
      setErrorMessage('Người thẩm định mới phải khác người thẩm định hiện tại.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await adminAssignmentsService.replaceVerificator(assignment.id, {
        assignedToUserId: selectedUserId,
        reason: trimmedReason,
      });
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      setErrorMessage(
        getApiErrorMessage(
          err,
          'Thay thế người thẩm định thất bại. Phân công có thể đã có báo cáo hoặc người được chọn không còn rảnh.'
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
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                Thay người thẩm định (Reassign)
              </h3>
              <p className="text-xs text-slate-500">
                Chuyển giao hồ sơ cho thẩm định viên khác và lưu vết lịch sử
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

          {/* Current Assignment Info */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-500">Người thẩm định hiện tại:</span>
              <span className="font-semibold text-slate-800">
                {assignment.assignedToFullName || 'Chưa cập nhật tên người thẩm định'}
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
              <p className="text-sm">Đang kiểm tra lịch thẩm định viên thay thế...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Không có người thay thế phù hợp</span>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                Không tìm thấy thẩm định viên nào khác đáp ứng yêu cầu hoặc có lịch rảnh khớp với hồ sơ này.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Chọn người thẩm định mới <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
              >
                {candidates.map((c) => (
                  <option key={c.userId} value={c.userId}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reason Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">
                Lý do thay thế <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400">
                {trimmedReason.length}/2000 ký tự
              </span>
            </div>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
              placeholder="Nhập lý do thay thế người thẩm định (bắt buộc, ví dụ: Quá hạn nộp báo cáo, thẩm định viên bận đột xuất...)"
              maxLength={2000}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors resize-none"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 space-y-1">
            <p className="font-medium">Chính sách thay thế:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-blue-600">
              <li>Phân công cũ sẽ chuyển sang "Đã hủy" và lưu lại lý do thay thế.</li>
              <li>Hệ thống tự động kích hoạt phân công mới và gửi thông báo tới thẩm định viên mới.</li>
            </ul>
          </div>

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
              disabled={
                isSubmitting ||
                isLoading ||
                candidates.length === 0 ||
                !selectedUserId ||
                !isReasonValid
              }
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận thay người'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
