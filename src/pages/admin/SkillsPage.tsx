import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Award, ChevronLeft, ChevronRight, ImagePlus, Pencil, Plus, RefreshCw, Search, Tag, Users, WandSparkles } from 'lucide-react';
import { useAdminResource, useDebouncedSearch } from '../../hooks/useAdminResource';
import { adminSkillsService, skillCategories, type AdminSkill, type SkillInput } from '../../services/admin-skills.service';
import { getApiErrorMessage } from '../../services/api';
import { managementButton, managementInput, safeManagementImage } from '../../utils/management';
import { ManagementDialog, ManagementError, ManagementSkeleton, ManagementToast } from '../../components/management/ManagementUI';

export function SkillsPage() {
  const [search, setSearch] = useState(''), [category, setCategory] = useState(''), [active, setActive] = useState(''), [page, setPage] = useState(1);
  const [sort, setSort] = useState('popular'), [pageSize, setPageSize] = useState(12);
  const [editing, setEditing] = useState<AdminSkill | 'new' | null>(null), [notice, setNotice] = useState('');
  const query = useDebouncedSearch(search);
  const load = useCallback((signal: AbortSignal) => adminSkillsService.list({ page, pageSize, search: query, category: category === '' ? undefined : Number(category), isActive: active === '' ? undefined : active === 'true', sort }, signal), [page, pageSize, query, category, active, sort]);
  const resource = useAdminResource(load);
  const total = resource.data?.total ?? 0, pages = Math.max(1, Math.ceil(total / pageSize));
  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-slate-900">Quản lý Kỹ năng</h1><p className="mt-1 text-sm text-slate-500">Danh mục kỹ năng và số sinh viên sử dụng trên UniNet.</p></div>
      <div className="flex gap-2"><button type="button" aria-label="Làm mới kỹ năng" onClick={resource.reload} className={managementButton}><RefreshCw size={16} /></button><button type="button" onClick={() => setEditing('new')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:min-h-10"><Plus size={16} />Thêm kỹ năng mới</button></div>
    </div>
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 xl:grid-cols-[2.1fr_1fr_1fr_1fr] xl:items-end">
      <label className="relative flex-1"><span className="sr-only">Tìm kiếm kỹ năng</span><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} maxLength={100} placeholder="Tìm kiếm kỹ năng…" onChange={event => { setSearch(event.target.value); setPage(1); }} className={managementInput + ' pl-9'} /></label>
      <label className="space-y-1 text-xs text-slate-500"><span>Nhóm kỹ năng</span><select value={category} onChange={event => { setCategory(event.target.value); setPage(1); }} className={managementInput}><option value="">Tất cả nhóm</option>{skillCategories.map((label, index) => <option key={index} value={index}>{label}</option>)}</select></label>
      <label className="space-y-1 text-xs text-slate-500"><span>Trạng thái</span><select value={active} onChange={event => { setActive(event.target.value); setPage(1); }} className={managementInput}><option value="">Tất cả trạng thái</option><option value="true">Đang sử dụng</option><option value="false">Ngừng sử dụng</option></select></label>
      <label className="space-y-1 text-xs text-slate-500"><span>Sắp xếp theo</span><select value={sort} onChange={event => { setSort(event.target.value); setPage(1); }} className={managementInput}><option value="popular">Phổ biến</option><option value="name">Tên A–Z</option></select></label>
    </div>
    {resource.loading ? <ManagementSkeleton /> : resource.error ? <ManagementError message={resource.error} retry={resource.reload} /> : <>
      {!resource.data?.items.length ? <p className="rounded-2xl border bg-white p-6 text-center text-sm text-slate-500">Không tìm thấy kỹ năng phù hợp.</p> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{resource.data.items.map(skill => <SkillCard key={skill.id} skill={skill} onEdit={() => setEditing(skill)} />)}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>Hiển thị {total ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, total)} của {total} kỹ năng</span>
        <div className="flex flex-wrap items-center gap-4"><nav aria-label="Phân trang kỹ năng" className="flex items-center gap-1"><button aria-label="Trước" disabled={page <= 1} onClick={() => setPage(page - 1)} className={managementButton + ' px-2'}><ChevronLeft size={15} /></button>{Array.from({ length: Math.min(5, pages) }, (_, index) => Math.max(1, Math.min(page - 2, pages - 4)) + index).map(number => <button key={number} aria-label={'Trang ' + number} aria-current={page === number ? 'page' : undefined} onClick={() => setPage(number)} className={'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg lg:min-h-9 lg:min-w-9 ' + (page === number ? 'bg-blue-600 font-semibold text-white' : 'hover:bg-blue-50')}>{number}</button>)}<button aria-label="Sau" disabled={page >= pages} onClick={() => setPage(page + 1)} className={managementButton + ' px-2'}><ChevronRight size={15} /></button></nav>
        <label className="flex items-center gap-2"><span>Hiển thị</span><select aria-label="Số kỹ năng mỗi trang" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }} className="min-h-10 rounded-lg border border-slate-200 bg-white px-2">{[12, 24, 48].map(size => <option key={size}>{size}</option>)}</select><span>/ trang</span></label></div>
      </div>
    </>}
    {editing && <SkillDialog key={editing === 'new' ? 'new' : editing.id} skill={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onDone={() => { setNotice(editing === 'new' ? 'Đã thêm kỹ năng.' : 'Đã cập nhật kỹ năng.'); setEditing(null); resource.reload(); }} />}
    {notice && <ManagementToast message={notice} onClose={() => setNotice('')} />}
  </div>;
}

function SkillCard({ skill, onEdit }: { skill: AdminSkill; onEdit: () => void }) {
  const source = safeManagementImage(skill.iconUrl);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return <article data-testid={'skill-' + skill.id} className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-blue-200 sm:p-4">
    <div className="flex size-11 shrink-0 items-center justify-center self-start rounded-xl">
      {source && source !== failedSource ? <img src={source} alt={'Icon ' + skill.name} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedSource(source)} className="size-11 object-contain" /> : <span aria-label={'Icon mặc định ' + skill.name} className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Award size={23} aria-hidden="true" /></span>}
    </div>
    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="min-w-0 flex-1 break-words text-sm font-semibold text-slate-900">{skill.name}</h2><span className={'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ' + (skill.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>{skill.isActive ? 'Đang sử dụng' : 'Ngừng sử dụng'}</span></div>
    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Tag size={12} />{skill.category == null ? 'Chưa phân nhóm' : skillCategories[skill.category] ?? 'Chưa phân nhóm'}</p>
    <div className="mt-1 flex items-center justify-between gap-2"><span className="flex items-center gap-1 text-xs text-slate-500"><Users size={13} />{skill.studentCount.toLocaleString('vi-VN')} sinh viên</span><button type="button" aria-label="Chỉnh sửa" title={'Chỉnh sửa ' + skill.name} onClick={onEdit} className="flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 lg:size-8"><Pencil size={14} aria-hidden="true" /></button></div></div>
  </article>;
}

function SkillDialog({ skill, onClose, onDone }: { skill: AdminSkill | null; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(skill?.name ?? ''), [category, setCategory] = useState(skill?.category == null ? '' : String(skill.category)), [active, setActive] = useState(skill?.isActive ?? true);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [preparing, setPreparing] = useState(false);
  const [iconFile, setIconFile] = useState<File | null>(null), [originalFile, setOriginalFile] = useState<File | null>(null), [previewUrl, setPreviewUrl] = useState(safeManagementImage(skill?.iconUrl) ?? ''), [processing, setProcessing] = useState(false);
  const objectUrl = useRef<string | null>(null), backgroundRequest = useRef<AbortController | null>(null), saveRequest = useRef<AbortController | null>(null);
  const preparationRequest = useRef<AbortController | null>(null);
  const working = preparing || processing;
  const uploaded = useRef<{ file: File; url: string } | null>(null);
  useEffect(() => () => { preparationRequest.current?.abort(); backgroundRequest.current?.abort(); saveRequest.current?.abort(); if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); }, []);
  const showFile = (file: File) => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(file); setPreviewUrl(objectUrl.current); setIconFile(file); uploaded.current = null;
  };
  const chooseFile = async (file: File | undefined) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size <= 0 || file.size > 5 * 1024 * 1024) { setError('Chọn ảnh JPG, PNG hoặc WebP tối đa 5 MB.'); return; }
    setError(''); setOriginalFile(file); showFile(file);
    preparationRequest.current?.abort();
    const controller = new AbortController(); preparationRequest.current = controller; setPreparing(true);
    try {
      const blob = await adminSkillsService.prepareIcon(file, controller.signal);
      if (!controller.signal.aborted) {
        if (blob.type.split(';')[0] !== 'image/png') throw new Error('Không nhận được ảnh icon chuẩn hóa hợp lệ.');
        const prepared = new File([blob], 'skill-icon.png', { type: 'image/png' });
        setOriginalFile(prepared); showFile(prepared);
      }
    } catch (cause) { if (!controller.signal.aborted) setError(getApiErrorMessage(cause, 'Không chuẩn hóa được ảnh icon.')); }
    finally { if (!controller.signal.aborted) setPreparing(false); }
  };
  const removeBackground = async () => {
    if (!iconFile || working || busy) return;
    const controller = new AbortController(); backgroundRequest.current = controller; setProcessing(true); setError('');
    try {
      const blob = await adminSkillsService.removeIconBackground(iconFile, controller.signal);
      if (!controller.signal.aborted) {
        if (blob.type.split(';')[0] !== 'image/png') throw new Error('Không nhận được ảnh đã xóa nền hợp lệ.');
        showFile(new File([blob], 'skill-icon.png', { type: 'image/png' }));
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        let message = getApiErrorMessage(cause, 'Không xóa được nền ảnh.');
        if (cause && typeof cause === 'object' && 'response' in cause) {
          const response = cause.response as { data?: unknown } | undefined;
          if (response?.data instanceof Blob) { try { const data = JSON.parse(await response.data.text()); if (typeof data.message === 'string') message = data.message; } catch { /* Keep the request error when no JSON body is available. */ } }
        }
        setError(message);
      }
    } finally { if (!controller.signal.aborted) setProcessing(false); }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (busy || working || !name.trim()) return;
    setBusy(true); setError('');
    const controller = new AbortController(); saveRequest.current = controller;
    const input: SkillInput = { name: name.trim(), category: category === '' ? null : Number(category), isActive: active };
    try {
      if (iconFile) {
        const url = uploaded.current?.file === iconFile ? uploaded.current.url : await adminSkillsService.uploadIcon(iconFile, controller.signal);
        if (controller.signal.aborted) return;
        uploaded.current = { file: iconFile, url }; input.iconUrl = url;
      }
      await adminSkillsService.save(skill?.id ?? null, input); onDone();
    }
    catch (cause) { setError(getApiErrorMessage(cause)); }
    finally { setBusy(false); }
  };
  return <ManagementDialog title={skill ? 'Chỉnh sửa kỹ năng' : 'Thêm kỹ năng mới'} onClose={() => { if (!busy) onClose(); }}><form onSubmit={event => void submit(event)} className="space-y-4">
    {error && <ManagementError message={error} />}
    <fieldset disabled={busy || working} className="space-y-4 disabled:opacity-70">
    <div className="space-y-2"><span className="text-sm font-medium text-slate-700">Icon kỹ năng</span><div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 p-3">
      <div aria-busy={working} className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-200 bg-[conic-gradient(#f1f5f9_25%,white_0_50%,#f1f5f9_0_75%,white_0)] bg-[length:16px_16px]">{previewUrl ? <img src={previewUrl} alt="Xem trước icon kỹ năng" className="size-16 object-contain" /> : <Award size={30} className="text-blue-500" />}{working && <div data-testid="icon-background-scan" aria-hidden="true" className="pointer-events-none absolute inset-0 bg-blue-500/10"><span className="skill-icon-scan-line" /></div>}</div>
      <div className="min-w-0 flex-1 space-y-2"><div className="flex flex-wrap gap-2"><label className={managementButton + ' relative cursor-pointer focus-within:ring-2 focus-within:ring-blue-500'}><ImagePlus size={15} />Chọn ảnh<input aria-label="Chọn ảnh icon" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { chooseFile(event.target.files?.[0]); event.target.value = ''; }} className="absolute inset-0 size-full cursor-pointer opacity-0" /></label><button type="button" disabled={!iconFile} onClick={() => void removeBackground()} className={managementButton}><WandSparkles size={15} />{processing ? 'Đang xóa nền…' : 'Xóa nền'}</button></div>
      <p className="text-xs text-slate-500">JPG, PNG, WebP · Tối đa 5 MB. Logo được căn giữa, chuẩn hóa kích thước và lưu lên Cloudinary khi lưu kỹ năng.</p>
      {originalFile && iconFile !== originalFile && <button type="button" onClick={() => showFile(originalFile)} className="text-xs text-blue-700 underline">Dùng ảnh gốc</button>}</div>
    </div>{working && <p role="status" className="text-xs text-blue-700">{preparing ? 'Đang chuẩn hóa kích thước icon…' : 'Đang xóa nền ảnh icon…'}</p>}</div>
    <label className="block space-y-1 text-sm"><span>Tên kỹ năng</span><input autoFocus required maxLength={100} value={name} onChange={event => setName(event.target.value)} className={managementInput} /></label>
    <label className="block space-y-1 text-sm"><span>Nhóm kỹ năng</span><select value={category} onChange={event => setCategory(event.target.value)} className={managementInput}><option value="">Chưa phân nhóm</option>{skillCategories.map((label, index) => <option key={index} value={index}>{label}</option>)}</select></label>
    <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={event => setActive(event.target.checked)} />Đang sử dụng</label>
    </fieldset>
    <div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className={managementButton}>Hủy</button><button disabled={busy || working || !name.trim()} className={managementButton}>{busy ? 'Đang lưu…' : 'Lưu kỹ năng'}</button></div>
  </form></ManagementDialog>;
}
