import { useEffect, useState } from 'react';
import { Download, Maximize2 } from 'lucide-react';
import { adminManagementService } from '../../services/admin-management.service';
import { getApiErrorMessage } from '../../services/api';
import type { VerificationDocument, VerificationKind } from '../../types/admin-management';
import { managementButton } from '../../utils/management';
import { ManagementDialog, ManagementError, ManagementSkeleton } from './ManagementUI';

export function VerificationDocumentPreview({ kind, id, document }: { kind: VerificationKind; id: string; document: VerificationDocument }) {
  const [preview, setPreview] = useState<{ url: string; type: string } | null>(null), [external, setExternal] = useState(''), [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const controller = new AbortController(); let objectUrl: string | undefined;
    const load = async () => {
      try {
        if (!document.uploaded && kind === 'partner') {
          const raw = await adminManagementService.externalDocument(id, document.index);
          const url = new URL(raw);
          if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Đường dẫn tài liệu không hợp lệ.');
          if (!controller.signal.aborted) setExternal(url.href);
        } else {
          const blob = await adminManagementService.document(kind, id, document.index, controller.signal);
          if (controller.signal.aborted) return;
          const type = blob.type.split(';')[0];
          if (!['image/jpeg', 'image/png', 'application/pdf'].includes(type)) throw new Error('Định dạng tài liệu chưa hỗ trợ xem trước.');
          objectUrl = URL.createObjectURL(blob); setPreview({ url: objectUrl, type });
        }
      } catch (cause) { if (!controller.signal.aborted) setError(getApiErrorMessage(cause, 'Không xem được tài liệu.')); }
    };
    void load(); return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [kind, id, document.index, document.uploaded]);
  const content = (large = false) => error ? <ManagementError message={error} /> : external ? <div className="space-y-4 text-sm"><p>Tài liệu này được lưu tại nguồn HTTPS bên ngoài. Liên kết chỉ được cung cấp sau khi kiểm tra quyền.</p><a href={external} target="_blank" rel="noopener noreferrer" className={managementButton}>Mở tài liệu bên ngoài</a></div> : !preview ? <ManagementSkeleton /> : <div>
    {preview.type === 'application/pdf'
      ? <iframe title={'Giấy tờ ' + (document.index + 1)} src={preview.url} className={(large ? 'h-[calc(96dvh-8rem)]' : 'h-56 sm:h-64') + ' w-full rounded-lg border'} />
      : <img src={preview.url} alt={'Giấy tờ: ' + document.fileName} onError={() => setError('Không tải được ảnh giấy tờ. Vui lòng tải lại hồ sơ.')} className={(large ? 'h-[calc(96dvh-8rem)] w-full' : 'mx-auto h-48 w-full max-w-lg sm:h-56') + ' rounded-lg bg-slate-50 object-contain'} />}
  </div>;
  const iconButton = 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';
  return <article className="min-w-0">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-bold text-slate-900">{document.index === 0 ? 'Giấy tờ xác minh' : 'Giấy tờ ' + (document.index + 1)}</h2>
      {preview && !error && <div className="flex shrink-0 items-center gap-1">
        <button type="button" onClick={() => setExpanded(true)} aria-label={'Phóng to tài liệu ' + (document.index + 1)} title="Phóng to" className={iconButton}><Maximize2 size={18} aria-hidden="true" /></button>
        <a href={preview.url} download={document.fileName} aria-label={'Tải tài liệu ' + (document.index + 1)} title="Tải xuống" className={iconButton}><Download size={18} aria-hidden="true" /></a>
      </div>}
    </div>
    {content()}
    {expanded && <ManagementDialog size="fullscreen" title={'Giấy tờ ' + (document.index + 1)} onClose={() => setExpanded(false)}>{content(true)}</ManagementDialog>}
  </article>;
}
