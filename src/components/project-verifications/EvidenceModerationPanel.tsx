import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  FileCode,
  ExternalLink,
  AlertCircle,
  Clock,
} from 'lucide-react';
import type { EvidenceModerationResponse } from '../../types/admin-project-verifications';

interface EvidenceModerationPanelProps {
  evidenceModeration?: EvidenceModerationResponse | null;
}

export const EvidenceModerationPanel: React.FC<EvidenceModerationPanelProps> = ({
  evidenceModeration,
}) => {
  const [showFullHash, setShowFullHash] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'tasks' | 'attempts'>('summary');

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

  if (!evidenceModeration) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-500">
        <ShieldAlert className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <h4 className="text-base font-semibold text-slate-700">Chưa có dữ liệu bằng chứng cấp 1</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Hồ sơ này chưa chạy quy trình thu thập hoặc kiểm duyệt tự động bằng chứng cấp 1 (Evidence Moderation).
        </p>
      </div>
    );
  }

  const isPassed = evidenceModeration.status === 2; // Passed

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-lg ${
                isPassed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}
            >
              {isPassed ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <ShieldAlert className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">
                  Bằng chứng cấp 1 (Level 1 Evidence Snapshot)
                </h3>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    evidenceModeration.isCurrent
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {evidenceModeration.isCurrent ? 'Bằng chứng hiện hành' : 'Bằng chứng cũ / Stale'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Phiên bản snapshot: v{evidenceModeration.version} | Mã kiểm duyệt:{' '}
                <span className="font-mono">{evidenceModeration.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Hoàn tất lúc:</span>
            <span className="font-medium text-slate-700">
              {formatDate(evidenceModeration.completedAt)}
            </span>
          </div>
        </div>

        {/* Scope Notice */}
        <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-800">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold">Giới hạn phạm vi đánh giá tự động:</span>
            <p className="text-blue-700 leading-relaxed">
              {evidenceModeration.scopeLimitation ||
                'Chỉ quét nội dung văn bản báo cáo và uy tín liên kết URL (Google Safe Browsing / VirusTotal); nội dung tập tin không được đọc tự động.'}
            </p>
          </div>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 border border-slate-100">
            <span className="text-slate-500 font-medium">Source Hash (Dữ liệu nguồn):</span>
            <p className="font-mono text-slate-800 break-all select-all">
              {showFullHash
                ? evidenceModeration.sourceHash
                : `${evidenceModeration.sourceHash?.slice(0, 32)}...`}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 border border-slate-100">
            <span className="text-slate-500 font-medium">Policy Hash (Chính sách quét):</span>
            <p className="font-mono text-slate-800 break-all select-all">
              {showFullHash
                ? evidenceModeration.policyHash
                : `${evidenceModeration.policyHash?.slice(0, 32)}...`}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setShowFullHash(!showFullHash)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            {showFullHash ? 'Thu gọn mã hash' : 'Xem đầy đủ mã hash'}
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'summary'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Tổng quan chính sách quét
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'tasks'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Danh sách Task & File minh chứng ({evidenceModeration.source?.tasks?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('attempts')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'attempts'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Lịch sử quét ({evidenceModeration.attempts?.length || 0})
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'summary' && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="space-y-1">
                <span className="font-semibold text-slate-800">Tóm tắt kết quả kiểm tra:</span>
                <p className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-600">
                  {evidenceModeration.summary || 'Tất cả báo cáo nhiệm vụ và đường dẫn đã vượt qua bài kiểm tra sơ bộ an toàn.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-800">Mô hình AI kiểm tra:</span>
                  <p className="p-2.5 bg-slate-50 rounded border border-slate-100 font-mono text-slate-700">
                    {evidenceModeration.policy?.geminiModel || 'gemini-1.5-flash'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-slate-800">Phạm vi kiểm tra (Scope):</span>
                  <p className="p-2.5 bg-slate-50 rounded border border-slate-100 text-slate-700">
                    {evidenceModeration.policy?.scope || 'ReportTextAndUrls'}
                  </p>
                </div>
              </div>

              {evidenceModeration.lastError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
                  <span className="font-semibold">Lỗi gần nhất ({evidenceModeration.lastErrorCode}):</span>{' '}
                  {evidenceModeration.lastError}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {(!evidenceModeration.source?.tasks || evidenceModeration.source.tasks.length === 0) ? (
                <p className="text-xs text-slate-500 text-center py-4">Không có task nào trong snapshot.</p>
              ) : (
                evidenceModeration.source.tasks.map((task, tIdx) => (
                  <div key={task.projectTaskId || tIdx} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 font-mono">
                        Nhiệm vụ #{tIdx + 1}: {task.projectTaskId}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                        {task.reports?.length || 0} báo cáo
                      </span>
                    </div>

                    {task.reports?.map((rep, rIdx) => (
                      <div key={rep.taskReportId || rIdx} className="p-3 bg-white rounded border border-slate-200 text-xs space-y-2">
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Phiên bản v{rep.version}</span>
                          <span>{formatDate(rep.submittedAt)}</span>
                        </div>
                        <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{rep.content}</p>

                        {/* Files */}
                        {rep.evidence && rep.evidence.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 space-y-1.5">
                            <span className="text-slate-500 font-medium block">Tập tin minh chứng đính kèm:</span>
                            <div className="flex flex-wrap gap-2">
                              {rep.evidence.map((f, fIdx) => (
                                <a
                                  key={f.taskEvidenceId || fIdx}
                                  href={f.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-[11px]"
                                >
                                  <FileCode className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{f.fileName || 'Tập tin minh chứng'}</span>
                                  <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'attempts' && (
            <div className="space-y-3">
              {(!evidenceModeration.attempts || evidenceModeration.attempts.length === 0) ? (
                <p className="text-xs text-slate-500 text-center py-4">Chưa có lần kiểm duyệt nào được ghi nhận.</p>
              ) : (
                evidenceModeration.attempts.map((att) => (
                  <div key={att.number} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Lần quét #{att.number}</span>
                      <span className="text-slate-500">
                        {formatDate(att.startedAt)} - {formatDate(att.finishedAt)}
                      </span>
                    </div>

                    {att.results && att.results.length > 0 ? (
                      <div className="space-y-1">
                        {att.results.map((res, idx) => (
                          <div key={idx} className="p-2 bg-white rounded border border-slate-100 flex items-center justify-between">
                            <span className="font-mono text-slate-700">{res.kind}: {res.url || 'Văn bản'}</span>
                            <span className="font-medium text-emerald-600">Hợp lệ ({res.provider})</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">Không có phát hiện vi phạm nào.</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
