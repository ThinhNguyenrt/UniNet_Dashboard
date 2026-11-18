import React, { useState, useEffect, useMemo } from 'react';
import { X, BookOpen, AlertCircle, Loader2, CheckCircle2, Search } from 'lucide-react';
import { adminSpecializationService } from '../../services/admin-specialization.service';
import { adminProjectVerificationsService } from '../../services/admin-project-verifications.service';
import type { SuitableAssessorSpecialization } from '../../types/admin-project-verifications';
import type { Specialization } from '../../types/specialization';
import { getApiErrorMessage } from '../../services/api';

interface UpdateProjectSpecializationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  currentSpecialization?: {
    id: string;
    code: string;
    name: string;
    isActive: boolean;
  } | null;
  onSuccess: (updated: SuitableAssessorSpecialization) => void;
}

export const UpdateProjectSpecializationDialog: React.FC<UpdateProjectSpecializationDialogProps> = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  currentSpecialization,
  onSuccess,
}) => {
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [selectedSpecializationId, setSelectedSpecializationId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatedResult, setUpdatedResult] = useState<SuitableAssessorSpecialization | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;
    const controller = new AbortController();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setErrorMessage(null);
    setIsSuccess(false);
    setUpdatedResult(null);
    setSearchTerm('');
    setSelectedSpecializationId(currentSpecialization?.id || '');

    async function loadSpecializations() {
      try {
        let list: Specialization[] = [];
        try {
          // Ưu tiên danh sách active
          list = await adminSpecializationService.listActive(controller.signal);
        } catch {
          // Fallback sang endpoint admin/specializations
          const all = await adminSpecializationService.list(controller.signal);
          list = all.filter((s) => s.isActive);
        }

        if (!ignore) {
          setSpecializations(list);
          // Nếu chưa chọn và có specialization hiện tại khớp danh sách
          if (currentSpecialization?.id) {
            setSelectedSpecializationId(currentSpecialization.id);
          } else if (list.length > 0) {
            setSelectedSpecializationId(list[0].id);
          }
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore && !controller.signal.aborted) {
          setErrorMessage(
            getApiErrorMessage(
              err,
              'Không thể tải danh mục chuyên ngành. Vui lòng thử lại.'
            )
          );
          setIsLoading(false);
        }
      }
    }

    loadSpecializations();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [isOpen, currentSpecialization]);

  // Lọc theo từ khóa tìm kiếm
  const filteredSpecializations = useMemo(() => {
    if (!searchTerm.trim()) return specializations;
    const q = searchTerm.trim().toLowerCase();
    return specializations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q)
    );
  }, [specializations, searchTerm]);

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedSpecializationId('');
    setSearchTerm('');
    setErrorMessage(null);
    setIsSuccess(false);
    setUpdatedResult(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpecializationId) {
      setErrorMessage('Vui lòng chọn một chuyên ngành cho dự án.');
      return;
    }

    if (currentSpecialization?.id && selectedSpecializationId === currentSpecialization.id) {
      setErrorMessage('Chuyên ngành được chọn trùng với chuyên ngành hiện tại của dự án.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await adminProjectVerificationsService.updateProjectSpecialization(
        projectId,
        selectedSpecializationId
      );

      setUpdatedResult(result);
      setIsSuccess(true);

      setTimeout(() => {
        onSuccess(result);
        handleClose();
      }, 1000);
    } catch (err: unknown) {
      setErrorMessage(
        getApiErrorMessage(
          err,
          'Cập nhật chuyên ngành dự án thất bại. Vui lòng kiểm tra lại kết nối hoặc quyền truy cập.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSpec = specializations.find((s) => s.id === selectedSpecializationId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                Cập nhật chuyên ngành dự án
              </h3>
              <p className="text-xs text-slate-500 max-w-sm truncate" title={projectTitle}>
                {projectTitle ? `Dự án: ${projectTitle}` : 'Chỉ định chuyên ngành phù hợp cho dự án'}
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

        {/* Success State */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-3 animate-fade-in">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">
              Cập nhật chuyên ngành thành công!
            </h4>
            <p className="text-xs text-slate-600">
              Chuyên ngành mới:{' '}
              <span className="font-semibold text-slate-900">
                {updatedResult?.name || selectedSpec?.name}
              </span>{' '}
              <span className="text-slate-400 font-mono">
                ({updatedResult?.code || selectedSpec?.code})
              </span>
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

            {/* Current Specialization Display */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <span className="text-slate-500 font-medium">Chuyên ngành hiện tại:</span>
              <p className="text-slate-800 font-semibold text-sm">
                {currentSpecialization ? (
                  <>
                    <span>{currentSpecialization.name}</span>{' '}
                    <span className="text-xs text-slate-400 font-mono font-normal">
                      ({currentSpecialization.code})
                    </span>
                  </>
                ) : (
                  <span className="text-amber-600 italic font-normal">
                    Chưa được gán chuyên ngành
                  </span>
                )}
              </p>
            </div>

            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <p className="text-xs">Đang tải danh sách chuyên ngành...</p>
              </div>
            ) : specializations.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                Không tìm thấy chuyên ngành khả dụng nào trên hệ thống. Vui lòng liên hệ quản trị viên để bổ sung danh mục chuyên ngành.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Search Box */}
                {specializations.length > 5 && (
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm chuyên ngành theo tên hoặc mã..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Dropdown / Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Chọn chuyên ngành mới <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedSpecializationId}
                    onChange={(e) => setSelectedSpecializationId(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  >
                    <option value="">-- Chọn chuyên ngành --</option>
                    {filteredSpecializations.map((spec) => (
                      <option key={spec.id} value={spec.id}>
                        {spec.name} ({spec.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Item Preview */}
                {selectedSpec && (
                  <div className="p-3 bg-blue-50/60 border border-blue-200/70 rounded-lg text-xs space-y-1">
                    <p className="font-semibold text-blue-900">
                      Chuyên ngành sẽ áp dụng:
                    </p>
                    <div className="text-slate-700 flex items-center justify-between">
                      <span className="font-bold text-slate-900">{selectedSpec.name}</span>
                      <span className="font-mono text-[11px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                        {selectedSpec.code}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Note */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Lưu ý nghiệp vụ:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Chuyên ngành dự án là tiêu chí bắt buộc để tìm kiếm và chỉ định chuyên gia thẩm định (Assessor) phù hợp.</li>
                <li>Thay đổi chuyên ngành sẽ ảnh hưởng đến danh sách gợi ý chuyên gia cho các phân công tiếp theo.</li>
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
                  !selectedSpecializationId ||
                  (currentSpecialization?.id === selectedSpecializationId)
                }
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isSubmitting ? 'Đang cập nhật...' : 'Lưu chuyên ngành'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UpdateProjectSpecializationDialog;

