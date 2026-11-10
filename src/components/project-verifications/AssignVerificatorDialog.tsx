import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  X,
  UserCheck,
  AlertCircle,
  Loader2,
  Calendar,
  Briefcase,
  Award,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { adminAssignmentsService } from '../../services/admin-assignments.service';
import type {
  SuitableAssessorsResponse,
  AssessorAvailabilityItem,
} from '../../types/admin-project-verifications';
import { getApiErrorMessage } from '../../services/api';

interface AssignVerificatorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectVerificationId: string;
  projectId: string;
  projectTitle: string;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  onSuccess: () => void;
}

export const AssignVerificatorDialog: React.FC<AssignVerificatorDialogProps> = ({
  isOpen,
  onClose,
  projectVerificationId,
  projectId,
  projectTitle,
  scheduledStartAt,
  scheduledEndAt,
  onSuccess,
}) => {
  const [suitablePage, setSuitablePage] = useState<number>(1);
  const pageSize = 20;

  const [suitableData, setSuitableData] = useState<SuitableAssessorsResponse | null>(null);
  const [availabilityList, setAvailabilityList] = useState<AssessorAvailabilityItem[] | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [businessWarning, setBusinessWarning] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Format date helper in Asia/Ho_Chi_Minh (UTC+7)
  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime())
      ? '—'
      : new Intl.DateTimeFormat('vi-VN', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'Asia/Ho_Chi_Minh',
        }).format(date);
  };

  const formatSchedule = (start?: string | null, end?: string | null) => {
    if (!start) return 'Chưa xếp lịch hẹn';
    return `${formatDateTime(start)} – ${end ? formatDateTime(end) : '—'}`;
  };

  // Reset when dialog opens with a new verification/project
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedUserId('');
      setSuitablePage(1);
      setSuitableData(null);
      setAvailabilityList(null);
      setErrorMessage(null);
      setBusinessWarning(null);
      setIsSuccess(false);
      return;
    }
    setSelectedUserId('');
    setSuitablePage(1);
    setErrorMessage(null);
    setBusinessWarning(null);
    setIsSuccess(false);
  }, [isOpen, projectVerificationId, projectId]);

  // Fetch both suitable-assessors and availability
  useEffect(() => {
    if (!isOpen || !projectVerificationId || !projectId) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setErrorMessage(null);
    setBusinessWarning(null);

    async function fetchData() {
      try {
        // Step 2 & 3: Call suitable-assessors and availability concurrently
        const [suitableRes, availRes] = await Promise.all([
          adminAssignmentsService.getSuitableAssessors(
            projectId,
            suitablePage,
            pageSize,
            controller.signal
          ),
          adminAssignmentsService.getAvailability(
            projectVerificationId,
            controller.signal
          ),
        ]);

        if (!controller.signal.aborted) {
          setSuitableData(suitableRes);
          setAvailabilityList(availRes);

          // Clear selection if current selected user is not available
          const availIds = new Set(availRes.map((a) => a.userId));
          const currentAssessors = suitableRes.assessors || [];

          if (currentAssessors.length === 0) {
            setBusinessWarning('Chưa có chuyên gia thẩm định nào phù hợp với chuyên ngành của dự án.');
          } else {
            const availableOnPage = currentAssessors.filter((a) => availIds.has(a.userId));
            if (availableOnPage.length === 0) {
              setBusinessWarning(
                'Các chuyên gia trên trang này hiện không khả dụng cho lịch hẹn đã chọn. Bạn có thể chuyển sang trang tiếp theo để tìm chuyên gia khác.'
              );
            }
          }

          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          if (axios.isAxiosError(err)) {
            const status = err.response?.status;
            const data = err.response?.data as { code?: string; message?: string } | undefined;
            const code = data?.code || '';

            if (status === 409) {
              if (code === 'SPECIALIZATION_REQUIRED' || data?.message?.includes('SPECIALIZATION_REQUIRED')) {
                setErrorMessage('Dự án chưa được gán chuyên ngành. Vui lòng bổ sung chuyên ngành cho dự án trước khi phân công.');
              } else if (code === 'SPECIALIZATION_INACTIVE' || data?.message?.includes('SPECIALIZATION_INACTIVE')) {
                setErrorMessage('Chuyên ngành của dự án hiện đang ngừng sử dụng.');
              } else {
                setErrorMessage(data?.message || 'Không thể tải danh sách chuyên gia phù hợp do xung đột nghiệp vụ.');
              }
            } else if (status === 404) {
              setErrorMessage('Dự án hoặc hồ sơ thẩm định không còn tồn tại trên hệ thống.');
            } else if (status === 401) {
              setErrorMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            } else if (status === 403) {
              setErrorMessage('Bạn không có quyền phân công thẩm định viên (yêu cầu quyền verification.evidence.review).');
            } else if (status === 400 && code === 'INVALID_PAGINATION') {
              setErrorMessage('Thông số phân trang không hợp lệ, vui lòng quay lại trang 1.');
              setSuitablePage(1);
            } else {
              setErrorMessage(getApiErrorMessage(err, 'Không thể tải danh sách chuyên gia thẩm định phù hợp.'));
            }
          } else {
            setErrorMessage('Lỗi kết nối khi tải danh sách chuyên gia thẩm định. Vui lòng thử lại.');
          }
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      controller.abort();
    };
  }, [isOpen, projectVerificationId, projectId, suitablePage]);

  if (!isOpen) return null;

  // Cross-reference suitable assessors with availability by userId
  const availableUserIds = new Set((availabilityList || []).map((a) => a.userId));
  const assessors = suitableData?.assessors || [];

  const assessorsWithAvailability = assessors.map((assessor) => ({
    ...assessor,
    isAvailable: availableUserIds.has(assessor.userId),
  }));

  const availableCountOnPage = assessorsWithAvailability.filter((a) => a.isAvailable).length;
  const totalOnPage = assessors.length;
  const totalSuitableAllPages = suitableData?.totalItems || 0;
  const totalPages = suitableData?.totalPages || 1;

  const selectedAssessor = assessorsWithAvailability.find(
    (a) => a.userId === selectedUserId
  );

  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setSelectedUserId('');
    setErrorMessage(null);
    setBusinessWarning(null);
    onClose();
  };

  // Step 6: Confirmation and POST /api/assignments
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      setErrorMessage('Vui lòng chọn một chuyên gia thẩm định khả dụng từ danh sách.');
      return;
    }

    if (!selectedAssessor?.isAvailable) {
      setErrorMessage('Chuyên gia đã chọn không khả dụng cho lịch hẹn này. Vui lòng chọn người khác.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await adminAssignmentsService.createAssignment({
        projectVerificationId,
        assignedToUserId: selectedUserId,
      });

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1200);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data as { code?: string; message?: string } | undefined;
        const code = data?.code || '';
        const msg = data?.message || '';

        if (status === 409) {
          if (code === 'VERIFICATOR_UNAVAILABLE' || msg.includes('VERIFICATOR_UNAVAILABLE')) {
            setErrorMessage('Chuyên gia được chọn không còn khả dụng cho lịch này. Vui lòng chọn chuyên gia khác.');
            setSelectedUserId('');
            // Reload availability to get fresh availability
            adminAssignmentsService.getAvailability(projectVerificationId).then((fresh) => {
              setAvailabilityList(fresh);
            });
          } else if (
            code === 'ASSIGNMENT_EXISTS' ||
            code === 'ASSIGNMENT_CONFLICT' ||
            msg.includes('ASSIGNMENT_EXISTS') ||
            msg.includes('ASSIGNMENT_CONFLICT')
          ) {
            setErrorMessage('Hồ sơ đã được phân công hoặc có xung đột phân công. Vui lòng tải lại dữ liệu.');
          } else if (code === 'BOOKING_NOT_CONFIRMED' || msg.includes('BOOKING_NOT_CONFIRMED')) {
            setErrorMessage('Lịch hẹn thẩm định chưa được xác nhận thanh toán.');
          } else if (code === 'PAYMENT_REQUIRED' || msg.includes('PAYMENT_REQUIRED')) {
            setErrorMessage('Hồ sơ thẩm định chưa hoàn tất thanh toán phí thẩm định.');
          } else if (code === 'INVALID_VERIFICATION_SCHEDULE' || msg.includes('INVALID_VERIFICATION_SCHEDULE')) {
            setErrorMessage('Lịch hẹn thẩm định không hợp lệ hoặc đã qua thời gian bắt đầu.');
          } else if (code === 'VERIFICATION_LOCKED' || msg.includes('VERIFICATION_LOCKED')) {
            setErrorMessage('Hồ sơ thẩm định hiện đang bị khóa xử lý.');
          } else if (code === 'REPORT_EXISTS' || msg.includes('REPORT_EXISTS')) {
            setErrorMessage('Hồ sơ này đã có báo cáo thẩm định, không thể tạo phân công mới.');
          } else {
            setErrorMessage(msg || 'Phân công không thành công do xung đột điều kiện nghiệp vụ.');
          }
        } else if (status === 404) {
          setErrorMessage('Hồ sơ thẩm định hoặc dự án không còn tồn tại trên hệ thống.');
        } else if (status === 401) {
          setErrorMessage('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (status === 403) {
          setErrorMessage('Bạn không có quyền phân công thẩm định (yêu cầu quyền verification.evidence.review).');
        } else {
          setErrorMessage(getApiErrorMessage(err, 'Lỗi kết nối máy chủ hoặc quá thời gian chờ. Vui lòng kiểm tra lại trạng thái trước khi gửi lại.'));
        }
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed top-16 inset-x-0 bottom-0 z-20 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-6.5rem)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Phân công assessor thẩm định</h3>
              <p className="text-xs text-slate-500">
                Đối chiếu chuyên môn dự án và lịch rảnh thực tế của chuyên gia
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project & Schedule Context Banner */}
        <div className="px-6 py-3.5 bg-blue-50/50 border-b border-blue-100/60 text-xs shrink-0 space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Briefcase className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-slate-500 font-medium">Dự án:</span>
              <span className="font-bold text-slate-900 truncate">{projectTitle}</span>
            </div>
            {suitableData?.specialization && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[11px] bg-blue-100 text-blue-700 shrink-0">
                <Award className="w-3 h-3" />
                {suitableData.specialization.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-slate-500 font-medium">Lịch hẹn thẩm định:</span>
            <span className="font-semibold text-slate-800">
              {formatSchedule(scheduledStartAt, scheduledEndAt)}
            </span>
          </div>
        </div>

        {/* Success Alert */}
        {isSuccess && (
          <div className="m-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Phân công assessor thành công! Đang cập nhật dữ liệu...</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Business Warning Banner */}
        {businessWarning && !errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800 text-xs shrink-0">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span className="leading-relaxed">{businessWarning}</span>
          </div>
        )}

        {/* Body Form / Candidates List */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-medium">
                Đang tìm assessor phù hợp chuyên môn và kiểm tra lịch rảnh...
              </p>
            </div>
          ) : assessorsWithAvailability.length === 0 ? (
            <div className="py-12 text-center space-y-2 text-slate-500">
              <UserCheck className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-semibold text-slate-700">
                Chưa có assessor phù hợp chuyên ngành
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Hệ thống chưa tìm thấy chuyên gia thẩm định nào thuộc chuyên ngành của dự án đang hoạt động.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Stats Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-1 pb-1">
                <span>
                  Trang <strong className="text-slate-800">{suitablePage}</strong>/{totalPages}:{' '}
                  <strong className="text-emerald-700">{availableCountOnPage}</strong>/
                  {totalOnPage} chuyên gia khả dụng cho lịch này
                </span>
                <span className="text-[11px] text-slate-400">
                  (Tổng số {totalSuitableAllPages} chuyên gia phù hợp chuyên ngành)
                </span>
              </div>

              {/* Assessor Radio List */}
              <div className="space-y-2">
                {assessorsWithAvailability.map((assessor) => {
                  const isSelected = selectedUserId === assessor.userId;
                  const isAvailable = assessor.isAvailable;

                  return (
                    <label
                      key={assessor.userId}
                      className={`block p-3.5 rounded-xl border transition cursor-pointer select-none ${
                        !isAvailable
                          ? 'bg-slate-50/70 border-slate-200/80 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
                          : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Radio Input */}
                          <input
                            type="radio"
                            name="assignedAssessor"
                            value={assessor.userId}
                            checked={isSelected}
                            disabled={!isAvailable || isSubmitting}
                            onChange={() => {
                              if (isAvailable) {
                                setSelectedUserId(assessor.userId);
                                setErrorMessage(null);
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 disabled:opacity-40 shrink-0"
                          />

                          {/* Avatar */}
                          {assessor.avatarUrl ? (
                            <img
                              src={assessor.avatarUrl}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {assessor.fullName?.charAt(0).toUpperCase() || 'A'}
                            </div>
                          )}

                          {/* Assessor Info */}
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs truncate">
                                {assessor.fullName}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                • {assessor.jobTitle || 'Chưa cập nhật'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                              <span>
                                Kinh nghiệm:{' '}
                                <strong className="text-slate-700 font-semibold">
                                  {assessor.yearsOfExperience} năm
                                </strong>
                              </span>
                              {assessor.specialization?.name && (
                                <span>
                                  | Ngành:{' '}
                                  <strong className="text-slate-700 font-semibold">
                                    {assessor.specialization.name}
                                  </strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Availability Badge */}
                        <div className="shrink-0">
                          {isAvailable ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                              Khả dụng
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200 whitespace-nowrap">
                              Không khả dụng cho lịch này
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Pagination for Suitable Assessors */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">
                    Trang {suitablePage} / {totalPages}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSuitablePage((p) => Math.max(1, p - 1));
                        setSelectedUserId('');
                      }}
                      disabled={suitablePage <= 1 || isLoading || isSubmitting}
                      className="px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 text-slate-700"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Trước</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSuitablePage((p) => Math.min(totalPages, p + 1));
                        setSelectedUserId('');
                      }}
                      disabled={suitablePage >= totalPages || isLoading || isSubmitting}
                      className="px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 text-slate-700"
                    >
                      <span>Sau</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Review Selected Assessor Panel */}
          {selectedAssessor && (
            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl text-xs space-y-1.5 animate-in fade-in">
              <span className="font-bold text-blue-900 block">Xem lại thông tin phân công:</span>
              <div className="space-y-0.5 text-slate-700">
                <p>
                  • Chuyên gia thẩm định:{' '}
                  <strong className="text-slate-900">{selectedAssessor.fullName}</strong> (
                  {selectedAssessor.jobTitle || 'Chuyên gia'}, {selectedAssessor.yearsOfExperience} năm kinh nghiệm)
                </p>
                <p>
                  • Dự án thẩm định: <strong className="text-slate-900">{projectTitle}</strong>
                </p>
                <p>
                  • Lịch thẩm định:{' '}
                  <strong className="text-slate-900">
                    {formatSchedule(scheduledStartAt, scheduledEndAt)}
                  </strong>
                </p>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                isLoading ||
                !selectedUserId ||
                !selectedAssessor?.isAvailable
              }
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Đang phân công...' : 'Xác nhận phân công'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignVerificatorDialog;
