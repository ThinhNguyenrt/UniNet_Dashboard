import React, { useState, useEffect } from 'react';
import { X, RefreshCw, AlertCircle, Loader2, CheckCircle2, UserCheck, ShieldAlert } from 'lucide-react';
import { adminAssignmentsService } from '../../services/admin-assignments.service';
import type { SuitableVerificatorResponse, SuitableAssessorItem } from '../../types/admin-project-verifications';
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
  projectId?: string;
  projectTitle?: string;
  onSuccess: () => void;
}

export const ReplaceVerificatorDialog: React.FC<ReplaceVerificatorDialogProps> = ({
  isOpen,
  onClose,
  assignment,
  projectVerificationId,
  projectId,
  projectTitle,
  onSuccess,
}) => {
  const [candidates, setCandidates] = useState<SuitableVerificatorResponse[]>([]);
  const [assessorDetailsMap, setAssessorDetailsMap] = useState<Record<string, SuitableAssessorItem>>({});
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !assignment || !projectVerificationId) return;

    let ignore = false;
    const controller = new AbortController();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setErrorMessage(null);
    setIsSuccess(false);

    async function fetchCandidates() {
      try {
        let candidateList: SuitableVerificatorResponse[] = [];

        // 1. Lấy danh sách ứng viên phù hợp/khả dụng cho việc thay thế
        try {
          const data = await adminAssignmentsService.getCandidates(
            projectVerificationId,
            assignment?.id,
            controller.signal
          );
          const raw: unknown = data;
          if (Array.isArray(raw)) {
            candidateList = raw as SuitableVerificatorResponse[];
          } else if (raw && typeof raw === 'object') {
            const obj = raw as Record<string, unknown>;
            if (Array.isArray(obj.candidates)) candidateList = obj.candidates as SuitableVerificatorResponse[];
            else if (Array.isArray(obj.assessors)) candidateList = obj.assessors as SuitableVerificatorResponse[];
            else if (Array.isArray(obj.items)) candidateList = obj.items as SuitableVerificatorResponse[];
          }
        } catch {
          // Fallback nếu replaceAssignmentId không được hỗ trợ
          try {
            const avail = await adminAssignmentsService.getAvailability(
              projectVerificationId,
              controller.signal
            );
            if (Array.isArray(avail)) {
              candidateList = avail;
            }
          } catch {
            candidateList = [];
          }
        }

        // 2. Nếu có projectId, tải thêm thông tin chi tiết chuyên ngành của assessors
        const detailsMap: Record<string, SuitableAssessorItem> = {};
        if (projectId) {
          try {
            const suitableRes = await adminAssignmentsService.getSuitableAssessors(
              projectId,
              1,
              50,
              controller.signal
            );
            if (suitableRes?.assessors && Array.isArray(suitableRes.assessors)) {
              suitableRes.assessors.forEach((item) => {
                detailsMap[item.userId] = item;
              });

              // Nếu candidateList ban đầu rỗng, có thể lấy từ suitableAssessors
              if (candidateList.length === 0) {
                candidateList = suitableRes.assessors.map((item) => ({
                  userId: item.userId,
                  fullName: item.fullName,
                }));
              }
            }
          } catch {
            // Không chặn nếu suitable-assessors lỗi
          }
        }

        if (!ignore) {
          // Lọc bỏ người thẩm định hiện tại đang được thay thế
          const filtered = candidateList.filter((c) => c.userId !== assignment?.assignedToUserId);
          setCandidates(filtered);
          setAssessorDetailsMap(detailsMap);

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
  }, [isOpen, assignment, projectVerificationId, projectId]);

  if (!isOpen || !assignment) return null;

  const handleClose = () => {
    setCandidates([]);
    setSelectedUserId('');
    setReason('');
    setErrorMessage(null);
    setIsSuccess(false);
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
      // POST /api/assignments/{id}/replace
      await adminAssignmentsService.replaceVerificator(assignment.id, {
        assignedToUserId: selectedUserId,
        reason: trimmedReason,
      });

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1000);
    } catch (err: unknown) {
      setErrorMessage(
        getApiErrorMessage(
          err,
          'Thay thế người thẩm định thất bại. Phân công có thể đã hoàn thành hoặc người được chọn không còn khả dụng.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAssessorDetail = assessorDetailsMap[selectedUserId];

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
                Thay thế người thẩm định
              </h3>
              <p className="text-xs text-slate-500">
                {projectTitle ? `Hồ sơ: ${projectTitle}` : 'Chuyển giao hồ sơ thẩm định cho chuyên gia khác'}
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

        {/* Success Alert */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-3 animate-fade-in">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">
              Thay thế người thẩm định thành công!
            </h4>
            <p className="text-xs text-slate-500">
              Phân công mới đã được kích hoạt và hệ thống đang làm mới dữ liệu...
            </p>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Current Assignment Info */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-500">Người thẩm định hiện tại:</span>
                <span className="font-bold text-slate-800">
                  {assignment.assignedToFullName || 'Chuyên gia thẩm định hiện tại'}
                </span>
              </div>
            </div>

            {isLoading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                <p className="text-xs">Đang kiểm tra danh sách chuyên gia thay thế khả dụng...</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-medium">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Không tìm thấy người thẩm định thay thế</span>
                </div>
                <p className="text-amber-700 leading-relaxed">
                  Hiện không có chuyên gia nào khác khả dụng hoặc có lịch rảnh phù hợp với hồ sơ thẩm định này.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Chọn người thẩm định thay thế <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                >
                  {candidates.map((c) => {
                    const detail = assessorDetailsMap[c.userId];
                    const label = detail
                      ? `${c.fullName} ${detail.jobTitle ? `– ${detail.jobTitle}` : ''} (${detail.specialization?.name || 'Chuyên gia'})`
                      : c.fullName;
                    return (
                      <option key={c.userId} value={c.userId}>
                        {label}
                      </option>
                    );
                  })}
                </select>

                {/* Selected Assessor Card Info if available */}
                {selectedAssessorDetail && (
                  <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg flex items-center gap-2.5 text-xs">
                    {selectedAssessorDetail.avatarUrl ? (
                      <img
                        src={selectedAssessorDetail.avatarUrl}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-blue-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                        {selectedAssessorDetail.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {selectedAssessorDetail.fullName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {selectedAssessorDetail.jobTitle || 'Chuyên gia thẩm định'}{' '}
                        {selectedAssessorDetail.yearsOfExperience > 0 &&
                          `• ${selectedAssessorDetail.yearsOfExperience} năm KN`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reason Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Lý do thay thế <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
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
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors resize-none"
              />
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-lg text-[11px] text-amber-800 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                Lưu ý khi thay thế:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-amber-700">
                <li>Phân công cũ sẽ chuyển sang trạng thái "Đã hủy" và lưu vết lý do thay thế.</li>
                <li>Hệ thống sẽ tạo phân công mới cho người được chọn và gửi thông báo liên quan.</li>
              </ul>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
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
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận thay người'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
export default ReplaceVerificatorDialog;
