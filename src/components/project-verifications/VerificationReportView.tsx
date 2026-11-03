import React from 'react';
import {
  FileText,
  HelpCircle,
  Award,
  Calendar,
  Check,
  X,
  FileCheck2,
} from 'lucide-react';
import type {
  VerificationReportResponse,
  AssessmentRubric,
} from '../../types/admin-project-verifications';
import {
  ProjectVerificationStatus,
  projectVerificationStatusLabels,
  projectVerificationStatusStyles,
} from '../../types/admin-project-verifications';

interface VerificationReportViewProps {
  reports: VerificationReportResponse[];
  rubricSnapshot?: AssessmentRubric | null;
}

export const VerificationReportView: React.FC<VerificationReportViewProps> = ({
  reports,
  rubricSnapshot,
}) => {
  const formatDate = (dateStr?: string | null) => {
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

  if (!reports || reports.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-500">
        <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <h4 className="text-base font-semibold text-slate-700">Chưa có báo cáo thẩm định</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Thẩm định viên được phân công chưa nộp báo cáo đánh giá cho hồ sơ này. Sau khi cuộc họp kết thúc và báo cáo được gửi, kết quả sẽ tự động hiển thị tại đây.
        </p>
      </div>
    );
  }

  // Lấy báo cáo mới nhất (hoặc báo cáo chốt)
  const report = reports[reports.length - 1];
  const assessment = report.assessment;
  const outcome = report.outcome ?? assessment?.outcome ?? ProjectVerificationStatus.Pending;

  const outcomeStyle =
    projectVerificationStatusStyles[outcome] ||
    projectVerificationStatusStyles[ProjectVerificationStatus.Pending];

  // Helper map rubric descriptions
  const criteriaMap = new Map(
    (rubricSnapshot?.criteria || assessment?.rubric?.criteria || []).map((c) => [c.code, c])
  );
  const conditionsMap = new Map(
    (rubricSnapshot?.conditions || assessment?.rubric?.conditions || []).map((c) => [c.code, c])
  );

  return (
    <div className="space-y-6">
      {/* Report Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">
                  Báo cáo thẩm định dự án
                </h3>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${outcomeStyle.bg} ${outcomeStyle.text} ${outcomeStyle.border}`}
                >
                  {projectVerificationStatusLabels[outcome]}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mã báo cáo: <span className="font-mono">{report.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Thời điểm gửi:</span>
            <span className="font-medium text-slate-700">
              {formatDate(report.submittedAt)}
            </span>
          </div>
        </div>

        {/* Total Score Banner if assessed */}
        {assessment && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <span className="text-sm font-semibold text-slate-800">
                  Rubric áp dụng: {assessment.rubric?.code || 'UAS-SOFTWARE-PROJECT'} (Phiên bản: {assessment.rubric?.version || '1.0'})
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Điểm sàn đạt chuẩn: <span className="font-bold text-slate-700">{assessment.rubric?.passingScore ?? 65}/100</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Tổng điểm đạt được</span>
                <span className="text-2xl font-black text-slate-900">
                  {assessment.totalScore !== null && assessment.totalScore !== undefined
                    ? `${assessment.totalScore.toFixed(2)}`
                    : 'N/A'}
                  <span className="text-sm font-normal text-slate-400">/100</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Narrative sections */}
        <div className="grid grid-cols-1 gap-4 pt-2">
          {/* Summary */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Tóm tắt kết quả (Summary)
            </h4>
            <div className="p-3.5 bg-slate-50 rounded-lg text-sm text-slate-800 whitespace-pre-wrap leading-relaxed border border-slate-100">
              {report.summary}
            </div>
          </div>

          {/* Findings */}
          {report.findings && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Phát hiện & Minh chứng đối chiếu (Findings)
              </h4>
              <div className="p-3.5 bg-slate-50 rounded-lg text-sm text-slate-800 whitespace-pre-wrap leading-relaxed border border-slate-100">
                {report.findings}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Khuyến nghị & Định hướng (Recommendations)
              </h4>
              <div className="p-3.5 bg-slate-50 rounded-lg text-sm text-slate-800 whitespace-pre-wrap leading-relaxed border border-slate-100">
                {report.recommendations}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rubric Criteria Evaluation Table */}
      {assessment?.scores && assessment.scores.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h4 className="text-sm font-bold text-slate-800">
              Chi tiết điểm đánh giá theo tiêu chí (Rubric Criteria)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Điểm số thang 100. Điểm null đại diện cho trường hợp thiếu minh chứng kiểm tra.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="py-3 px-4">Tiêu chí</th>
                  <th className="py-3 px-3 text-center">Trọng số</th>
                  <th className="py-3 px-3 text-center">Điểm số</th>
                  <th className="py-3 px-4">Lý do chấm</th>
                  <th className="py-3 px-4">Minh chứng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assessment.scores.map((item) => {
                  const criterion = criteriaMap.get(item.code);
                  const isNullScore = item.score === null || item.score === undefined;
                  return (
                    <tr key={item.code} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {criterion?.name || item.code}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {item.code}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 font-medium">
                        {criterion?.weight ? `${(criterion.weight * 100).toFixed(0)}%` : '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isNullScore ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[11px]">
                            Thiếu minh chứng
                          </span>
                        ) : (
                          <span
                            className={`font-bold text-sm ${
                              (item.score ?? 0) >= 65 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {item.score}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs break-words">
                        {item.reason}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs break-words font-mono text-[11px]">
                        {item.evidence || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mandatory Conditions Table */}
      {assessment?.conditions && assessment.conditions.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h4 className="text-sm font-bold text-slate-800">
              Điều kiện tiên quyết bắt buộc (Mandatory Conditions)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Hồ sơ chỉ được công nhận Đạt chuẩn khi thỏa mãn đồng thời tất cả các điều kiện này.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {assessment.conditions.map((cond) => {
              const def = conditionsMap.get(cond.code);
              const isPassed = cond.passed === true;
              const isFailed = cond.passed === false;
              

              return (
                <div key={cond.code} className="p-4 flex items-start gap-3.5 hover:bg-slate-50/50">
                  <div className="mt-0.5 shrink-0">
                    {isPassed ? (
                      <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-full">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : isFailed ? (
                      <div className="p-1.5 bg-rose-100 text-rose-700 rounded-full">
                        <X className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-full">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800">
                        {def?.description || cond.code}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        ({cond.code})
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      <span className="font-medium text-slate-700">Lý do đối chiếu:</span>{' '}
                      {cond.reason}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {isPassed ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Đạt điều kiện
                      </span>
                    ) : isFailed ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        Không đạt
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Chưa đủ cơ sở
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
