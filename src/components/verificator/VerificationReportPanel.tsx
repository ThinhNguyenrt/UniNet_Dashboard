import React, { useState } from 'react';
import {
  FileText,
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  RefreshCw,
  Copy,
  Check,
  Video,
  ShieldCheck,
  HelpCircle,
  Clock,
} from 'lucide-react';
import {
  verificatorReportService,
  parseReportErrorMessage,
  validateReportInput,
} from '../../services/verificator-report.service';
import {
  type VerificationReportResponse,
  type ReportResponse,
  ProjectVerificationStatus,
} from '../../types/verificator-assignments';
import { managementDate, managementInput } from '../../utils/management';

interface VerificationReportPanelProps {
  assignmentId: string;
  projectTitle: string;
  initialReport?: VerificationReportResponse | ReportResponse | null;
  isMeetingCompleted: boolean;
  isAssignmentActive: boolean;
  onReportSubmitted?: (report: ReportResponse) => void;
  onNavigateToMeeting?: () => void;
}

export const VerificationReportPanel: React.FC<VerificationReportPanelProps> = ({
  assignmentId,
  projectTitle,
  initialReport,
  isMeetingCompleted,
  isAssignmentActive,
  onReportSubmitted,
  onNavigateToMeeting,
}) => {
  const [report, setReport] = useState<VerificationReportResponse | ReportResponse | null>(
    initialReport || null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Form input state
  const [outcome, setOutcome] = useState<
    typeof ProjectVerificationStatus.Verified | typeof ProjectVerificationStatus.Failed
  >(ProjectVerificationStatus.Verified);
  const [summary, setSummary] = useState<string>('');
  const [findings, setFindings] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Modal xác nhận nộp báo cáo
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Tải lại báo cáo từ API
  const handleReloadReport = async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await verificatorReportService.getReportByAssignment(assignmentId);
      setReport(data);
    } catch (err) {
      setError(parseReportErrorMessage(err, 'Chưa thể tải dữ liệu báo cáo thẩm định.'));
    } finally {
      setLoading(false);
    }
  };

  // Mở modal xác nhận sau khi kiểm tra form hợp lệ
  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateReportInput({
      summary,
      findings,
      recommendations,
      outcome,
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors as Record<string, string>);
      return;
    }

    setValidationErrors({});
    setShowConfirmModal(true);
  };

  // Nộp báo cáo chính thức
  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setError(null);

    try {
      const res = await verificatorReportService.submitReport({
        assignmentId,
        summary: summary.trim(),
        findings: findings.trim(),
        recommendations: recommendations.trim(),
        outcome,
      });

      setReport(res);
      onReportSubmitted?.(res);
    } catch (err) {
      setError(parseReportErrorMessage(err, 'Không thể nộp báo cáo kết luận thẩm định. Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Sao chép nội dung báo cáo dạng văn bản
  const handleCopyReportContent = () => {
    if (!report) return;
    const outcomeText =
      report.outcome === ProjectVerificationStatus.Verified
        ? 'ĐẠT CHUẨN (VERIFIED)'
        : report.outcome === ProjectVerificationStatus.Failed
        ? 'KHÔNG ĐẠT (FAILED)'
        : 'ĐÃ GHI NHẬN';

    const text = `BÁO CÁO KẾT LUẬN THẨM ĐỊNH DỰ ÁN
Dự án: ${projectTitle}
Ngày gửi: ${managementDate(report.submittedAt)}
Kết luận: ${outcomeText}

1. TÓM TẮT BUỔI XÁC MINH:
${report.summary}

2. BẰNG CHỨNG VÀ KẾT QUẢ ĐỐI CHIẾU:
${report.findings || '—'}

3. CÁC KHUYẾN NGHỊ CHO DỰ ÁN:
${report.recommendations || '—'}
`;

    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Thông báo lỗi nếu có */}
      {error && (
        <div className="p-4 rounded-xl border bg-red-50 border-red-200 text-red-800 text-xs sm:text-sm flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-semibold">Lỗi thao tác báo cáo</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
          {report && (
            <button
              type="button"
              onClick={() => void handleReloadReport()}
              className="text-xs font-semibold text-red-700 underline hover:text-red-900 shrink-0"
            >
              Tải lại
            </button>
          )}
        </div>
      )}

      {/* TRƯỜNG HỢP 1: ĐÃ CÓ BÁO CÁO (VIEW MODE) */}
      {report ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          {/* Header Báo cáo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Báo cáo Kết luận Thẩm định đã nộp
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Thời gian nộp: <span className="font-semibold text-slate-700">{managementDate(report.submittedAt)}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {report.outcome === ProjectVerificationStatus.Verified ? (
                <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 inline-flex items-center gap-1.5 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ĐẠT CHUẨN (VERIFIED)
                </span>
              ) : report.outcome === ProjectVerificationStatus.Failed ? (
                <span className="px-3.5 py-1.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-full border border-rose-200 inline-flex items-center gap-1.5 shadow-xs">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  KHÔNG ĐẠT (FAILED)
                </span>
              ) : (
                <span className="px-3.5 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full border border-slate-200">
                  Đã ghi nhận kết quả
                </span>
              )}

              <button
                type="button"
                onClick={handleCopyReportContent}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition"
                title="Sao chép nội dung báo cáo"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Đã sao chép' : 'Sao chép'}</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => void handleReloadReport()}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition"
                title="Làm mới báo cáo"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Nội dung chi tiết 3 phần */}
          <div className="space-y-6 text-xs sm:text-sm">
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="size-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
                Tóm tắt buổi xác minh (Summary)
              </h3>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-700 whitespace-pre-wrap leading-relaxed">
                {report.summary}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="size-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">2</span>
                Bằng chứng và kết quả đối chiếu (Findings)
              </h3>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-700 whitespace-pre-wrap leading-relaxed">
                {report.findings || '—'}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="size-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">3</span>
                Các khuyến nghị cho dự án (Recommendations)
              </h3>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-700 whitespace-pre-wrap leading-relaxed">
                {report.recommendations || '—'}
              </div>
            </div>
          </div>

          {/* Ghi chú pháp lý & Quy định hệ thống */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Quy định xử lý hồ sơ:</p>
            <p>
              Báo cáo kết luận thẩm định đã được ghi nhận trên hệ thống và phân công đã được cập nhật sang trạng thái{' '}
              <strong>Đã hoàn thành</strong>. Theo thiết kế backend, báo cáo đã nộp không thể chỉnh sửa hoặc xóa qua hệ thống.
            </p>
          </div>
        </div>
      ) : (
        /* TRƯỜNG HỢP 2: CHƯA CÓ BÁO CÁO (FORM LẬP BÁO CÁO) */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          {/* Header */}
          <div className="border-b border-slate-100 pb-4 space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Lập Báo cáo Kết luận Thẩm định
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Đánh giá kết quả phỏng vấn, rà soát mã nguồn và đối chiếu bằng chứng cho dự án:{' '}
              <span className="font-semibold text-slate-700">{projectTitle}</span>
            </p>
          </div>

          {/* Kiểm tra điều kiện nộp */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
            <span className="font-semibold text-slate-800">Điều kiện tiên quyết trước khi nộp báo cáo:</span>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Phân công thẩm định đang có hiệu lực và chưa có báo cáo cuối cùng</span>
              </li>
              <li className="flex items-center gap-2">
                {isMeetingCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <span className={isMeetingCompleted ? 'text-slate-700 font-medium' : 'text-amber-800 font-medium'}>
                  Buổi họp xác minh trực tuyến đã bắt đầu và kết thúc (
                  {isMeetingCompleted ? 'Đã hoàn thành cuộc họp' : 'Chưa hoàn thành cuộc họp'}
                  )
                </span>
              </li>
            </ul>
          </div>

          {/* Cảnh báo nếu chưa họp xong */}
          {!isMeetingCompleted && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-bold">Chưa thể gửi báo cáo kết luận</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Hệ thống yêu cầu buổi họp xác minh phải được bắt đầu và kết thúc chính thức trước khi bạn nộp báo cáo.
                  </p>
                </div>
              </div>
              {onNavigateToMeeting && (
                <button
                  type="button"
                  onClick={onNavigateToMeeting}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-xs"
                >
                  <Video className="w-3.5 h-3.5" />
                  Đến phòng họp
                </button>
              )}
            </div>
          )}

          {/* Form điền báo cáo */}
          <form onSubmit={handleOpenConfirm} className="space-y-5 text-xs sm:text-sm">
            {/* Lựa chọn Outcome */}
            <div className="space-y-2">
              <label className="font-bold text-slate-900 flex items-center gap-1">
                <span>1. Kết luận thẩm định</span>
                <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label
                  className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                    outcome === ProjectVerificationStatus.Verified
                      ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="report-outcome"
                    value={ProjectVerificationStatus.Verified}
                    checked={outcome === ProjectVerificationStatus.Verified}
                    onChange={() => setOutcome(ProjectVerificationStatus.Verified)}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Đạt chuẩn (Verified)
                    </p>
                    <p className="text-xs text-slate-500">
                      Đề tài đáp ứng đầy đủ yêu cầu xác thực về thành viên, sản phẩm và minh chứng.
                    </p>
                  </div>
                </label>

                <label
                  className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                    outcome === ProjectVerificationStatus.Failed
                      ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="report-outcome"
                    value={ProjectVerificationStatus.Failed}
                    checked={outcome === ProjectVerificationStatus.Failed}
                    onChange={() => setOutcome(ProjectVerificationStatus.Failed)}
                    className="mt-1 text-rose-600 focus:ring-rose-500"
                  />
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      Không đạt (Failed)
                    </p>
                    <p className="text-xs text-slate-500">
                      Đề tài không đáp ứng tiêu chuẩn thẩm định, phát hiện vi phạm hoặc không có sản phẩm.
                    </p>
                  </div>
                </label>
              </div>

              {validationErrors.outcome && (
                <p className="text-xs text-red-600 font-medium">{validationErrors.outcome}</p>
              )}
            </div>

            {/* Tóm tắt buổi xác minh */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 flex items-center gap-1">
                  <span>2. Tóm tắt buổi xác minh (Summary)</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs ${summary.length > 9500 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                  {summary.length.toLocaleString('vi-VN')} / 10.000 ký tự
                </span>
              </div>
              <textarea
                rows={4}
                required
                maxLength={10000}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Khái quát diễn biến buổi họp, các thành viên tham gia, tinh thần hợp tác và những nội dung chính đã phỏng vấn..."
                className={managementInput}
              />
              {validationErrors.summary && (
                <p className="text-xs text-red-600 font-medium">{validationErrors.summary}</p>
              )}
            </div>

            {/* Bằng chứng & Kết quả đối chiếu */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 flex items-center gap-1">
                  <span>3. Bằng chứng và kết quả đối chiếu (Findings)</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs ${findings.length > 29000 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                  {findings.length.toLocaleString('vi-VN')} / 30.000 ký tự
                </span>
              </div>
              <textarea
                rows={6}
                required
                maxLength={30000}
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                placeholder="Mô tả chi tiết các sản phẩm demo thực tế, đường link mã nguồn, sự khớp nối giữa báo cáo của sinh viên và bằng chứng quét AI, đánh giá mức độ hoàn thiện sản phẩm..."
                className={managementInput}
              />
              {validationErrors.findings && (
                <p className="text-xs text-red-600 font-medium">{validationErrors.findings}</p>
              )}
            </div>

            {/* Khuyến nghị cho dự án */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 flex items-center gap-1">
                  <span>4. Các khuyến nghị cho dự án (Recommendations)</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs ${recommendations.length > 9500 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                  {recommendations.length.toLocaleString('vi-VN')} / 10.000 ký tự
                </span>
              </div>
              <textarea
                rows={4}
                required
                maxLength={10000}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="Gợi ý cải tiến về kiến trúc phần mềm, bảo mật, khả năng mở rộng, định hướng nghiên cứu tiếp theo cho nhóm tác giả..."
                className={managementInput}
              />
              {validationErrors.recommendations && (
                <p className="text-xs text-red-600 font-medium">{validationErrors.recommendations}</p>
              )}
            </div>

            {/* Lưu ý nghiệp vụ */}
            <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                Lưu ý quan trọng trước khi gửi:
              </p>
              <p>• Báo cáo sau khi nộp sẽ tự động hoàn tất phân công và chuyển trạng thái xác minh của dự án.</p>
              <p>• Báo cáo đã nộp không thể chỉnh sửa hay hủy bỏ. Hãy rà soát kỹ văn phong và nội dung đối chiếu trước khi xác nhận.</p>
            </div>

            {/* Nút Submit */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={!isMeetingCompleted || !isAssignmentActive || submitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs transition disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Đang nộp báo cáo...' : 'Kiểm tra & Nộp báo cáo Thẩm định'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL XÁC NHẬN NỘP BÁO CÁO LẦN CUỐI */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start gap-3">
              <div
                className={`p-3 rounded-xl border shrink-0 ${
                  outcome === ProjectVerificationStatus.Verified
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-rose-50 text-rose-600 border-rose-200'
                }`}
              >
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Xác nhận Nộp Báo cáo Thẩm định
                </h3>
                <p className="text-xs text-slate-500">
                  Dự án: <span className="font-semibold text-slate-700">{projectTitle}</span>
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Kết luận thẩm định:</span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                    outcome === ProjectVerificationStatus.Verified
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {outcome === ProjectVerificationStatus.Verified ? 'ĐẠT CHUẨN' : 'KHÔNG ĐẠT'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Độ dài tóm tắt:</span>
                <span>{summary.length} ký tự</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Độ dài bằng chứng đối chiếu:</span>
                <span>{findings.length} ký tự</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Độ dài khuyến nghị:</span>
                <span>{recommendations.length} ký tự</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
              <strong>Cảnh báo:</strong> Thao tác này sẽ chốt kết quả và chuyển phân công sang <strong>Đã hoàn thành</strong>. Báo cáo không thể sửa đổi sau khi nộp.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
              >
                Quay lại chỉnh sửa
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleConfirmSubmit()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Đang gửi...' : 'Xác nhận Nộp báo cáo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationReportPanel;

