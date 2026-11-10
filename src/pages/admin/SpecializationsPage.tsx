import { useCallback, useMemo, useState, type FormEvent } from 'react';
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useAdminResource, useDebouncedSearch } from '../../hooks/useAdminResource';
import { adminSpecializationService } from '../../services/admin-specialization.service';
import { getApiErrorMessage } from '../../services/api';
import { adminPermissions } from '../../types/admin-management';
import type { Specialization, SaveSpecializationRequest } from '../../types/specialization';
import { managementButton, managementInput } from '../../utils/management';
import {
  ManagementAccess,
  ManagementDialog,
  ManagementError,
  ManagementSkeleton,
  ManagementToast,
} from '../../components/management/ManagementUI';

export function SpecializationsPage() {
  return (
    <ManagementAccess permission={adminPermissions.staffManage}>
      <SpecializationsContent />
    </ManagementAccess>
  );
}

function SpecializationsContent() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selectedItem, setSelectedItem] = useState<Specialization | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notice, setNotice] = useState('');

  const query = useDebouncedSearch(search);

  const loader = useCallback(
    (signal: AbortSignal) => adminSpecializationService.list(signal),
    []
  );
  const resource = useAdminResource(loader);

  const rawItems = resource.data;

  // Client-side filtering
  const filteredItems = useMemo(() => {
    const list = rawItems ?? [];
    return list.filter((item) => {
      if (activeFilter === 'true' && !item.isActive) return false;
      if (activeFilter === 'false' && item.isActive) return false;

      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const matchCode = item.code.toLowerCase().includes(q);
        const matchName = item.name.toLowerCase().includes(q);
        if (!matchCode && !matchName) return false;
      }

      return true;
    });
  }, [rawItems, activeFilter, query]);

  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Danh mục ngành nghề</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý danh mục chuyên ngành dùng cho dự án và chuyên gia thẩm định trên UniNet.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Làm mới danh sách ngành nghề"
            onClick={resource.reload}
            className={managementButton}
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:min-h-10"
          >
            <Plus size={16} />
            <span>Thêm ngành nghề</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr] lg:items-end">
        <label className="relative flex-1">
          <span className="sr-only">Tìm kiếm ngành nghề</span>
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            maxLength={100}
            placeholder="Tìm kiếm theo mã hoặc tên ngành nghề…"
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={managementInput + ' pl-9'}
          />
        </label>

        <label className="space-y-1 text-xs text-slate-500">
          <span>Trạng thái hoạt động</span>
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
            className={managementInput}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Ngừng hoạt động</option>
          </select>
        </label>
      </div>

      {/* Content Section */}
      {resource.loading ? (
        <ManagementSkeleton />
      ) : resource.error ? (
        <ManagementError message={resource.error} retry={resource.reload} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="p-4 w-14 text-center">STT</th>
                  <th className="p-4">Mã ngành nghề</th>
                  <th className="p-4">Tên ngành nghề</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="p-4 text-center text-xs font-medium text-slate-400">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="p-4 font-mono">
                      <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800 border border-slate-200/80">
                        {item.code}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-900">
                      {item.name}
                    </td>
                    <td className="p-4">
                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200/80">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200">
                          <XCircle size={13} className="text-slate-400" />
                          Ngừng hoạt động
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {/* Bắt buộc bấm xem chi tiết để thao tác hoặc chỉnh sửa */}
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 rounded-xl border border-blue-200/60 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                        title={`Xem chi tiết ${item.name}`}
                        aria-label={`Xem chi tiết ${item.name}`}
                      >
                        <Eye size={15} aria-hidden="true" />
                        <span>Xem chi tiết</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!paginatedItems.length && (
              <div className="p-10 text-center text-sm text-slate-500">
                Không tìm thấy ngành nghề nào phù hợp với bộ lọc.
              </div>
            )}
          </div>

          {/* Pagination */}
          {total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span>
                Hiển thị {(currentPage - 1) * pageSize + 1} -{' '}
                {Math.min(currentPage * pageSize, total)} của {total} ngành nghề
              </span>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Trang trước"
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                    className={managementButton + ' px-2.5'}
                  >
                    <ChevronLeft size={15} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      aria-label={`Trang ${pageNum}`}
                      aria-current={currentPage === pageNum ? 'page' : undefined}
                      onClick={() => setPage(pageNum)}
                      className={
                        'inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-xs ' +
                        (currentPage === pageNum
                          ? 'bg-blue-600 font-semibold text-white'
                          : 'hover:bg-slate-100 text-slate-700')
                      }
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    aria-label="Trang sau"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage(currentPage + 1)}
                    className={managementButton + ' px-2.5'}
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal Xem chi tiết & Chỉnh sửa / Thao tác */}
      {selectedItem && (
        <SpecializationDetailDialog
          specialization={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdated={(updated) => {
            setSelectedItem(null);
            setNotice(`Đã cập nhật ngành nghề "${updated.name}" thành công.`);
            resource.reload();
          }}
        />
      )}

      {/* Modal Thêm ngành nghề mới */}
      {isCreating && (
        <CreateSpecializationDialog
          onClose={() => setIsCreating(false)}
          onCreated={(created) => {
            setIsCreating(false);
            setNotice(`Đã thêm ngành nghề "${created.name}" thành công.`);
            resource.reload();
          }}
        />
      )}

      {/* Thông báo kết quả Toast */}
      {notice && <ManagementToast message={notice} onClose={() => setNotice('')} />}
    </div>
  );
}

/**
 * Hộp thoại Xem chi tiết & Chỉnh sửa ngành nghề.
 * Bắt buộc thao tác chỉnh sửa / đổi trạng thái tại đây, không hiện ID ra bên ngoài.
 */
function SpecializationDetailDialog({
  specialization,
  onClose,
  onUpdated,
}: {
  specialization: Specialization;
  onClose: () => void;
  onUpdated: (item: Specialization) => void;
}) {
  const [code, setCode] = useState(specialization.code);
  const [name, setName] = useState(specialization.name);
  const [isActive, setIsActive] = useState(specialization.isActive);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedCode) {
      setError('Vui lòng nhập mã ngành nghề.');
      return;
    }
    if (!/^[A-Z0-9_]+$/.test(trimmedCode)) {
      setError('Mã ngành chỉ được gồm chữ cái in hoa (A-Z), chữ số (0-9) và dấu gạch dưới (_).');
      return;
    }
    if (trimmedCode.length > 100) {
      setError('Mã ngành không được vượt quá 100 ký tự.');
      return;
    }
    if (!trimmedName) {
      setError('Vui lòng nhập tên ngành nghề.');
      return;
    }
    if (trimmedName.length > 255) {
      setError('Tên ngành không được vượt quá 255 ký tự.');
      return;
    }

    setBusy(true);
    setError('');

    const payload: SaveSpecializationRequest = {
      code: trimmedCode,
      name: trimmedName,
      isActive,
    };

    try {
      const updated = await adminSpecializationService.update(specialization.id, payload);
      onUpdated(updated);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Không thể cập nhật chuyên ngành nghề.');
      if (typeof msg === 'string' && msg.includes('SPECIALIZATION_CODE_EXISTS')) {
        setError(`Mã ngành nghề "${trimmedCode}" đã tồn tại trên hệ thống.`);
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <ManagementDialog
      title="Chi tiết ngành nghề"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
            <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Mã ngành nghề */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Mã ngành nghề <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={100}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ví dụ: SOFTWARE_ENGINEERING"
            className={managementInput + ' font-mono'}
          />
          <p className="text-[11px] text-slate-500">
            Mã định danh ngành (1-100 ký tự, in hoa A-Z, số 0-9 và dấu gạch dưới).
          </p>
        </div>

        {/* Tên ngành nghề */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Tên ngành nghề <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={255}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Kỹ thuật phần mềm"
            className={managementInput}
          />
          <p className="text-[11px] text-slate-500">
            Tên hiển thị đầy đủ của ngành nghề (1-255 ký tự).
          </p>
        </div>

        {/* Trạng thái hoạt động */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span className="text-xs font-semibold text-slate-800">
              Kích hoạt sử dụng (Đang hoạt động)
            </span>
          </label>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Ngừng sử dụng sẽ ẩn ngành này khỏi danh mục lựa chọn của dự án mới. Lịch sử phân công
            thẩm định viên và dữ liệu dự án cũ đã gắn ngành này vẫn được bảo lưu nguyên vẹn.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="min-h-10 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Đóng
          </button>
          <button
            type="submit"
            disabled={busy}
            className="min-h-10 px-5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </ManagementDialog>
  );
}

/**
 * Hộp thoại Thêm ngành nghề mới.
 */
function CreateSpecializationDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (item: Specialization) => void;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedCode) {
      setError('Vui lòng nhập mã ngành nghề.');
      return;
    }
    if (!/^[A-Z0-9_]+$/.test(trimmedCode)) {
      setError('Mã ngành chỉ được gồm chữ cái in hoa (A-Z), chữ số (0-9) và dấu gạch dưới (_).');
      return;
    }
    if (trimmedCode.length > 100) {
      setError('Mã ngành không được vượt quá 100 ký tự.');
      return;
    }
    if (!trimmedName) {
      setError('Vui lòng nhập tên ngành nghề.');
      return;
    }
    if (trimmedName.length > 255) {
      setError('Tên ngành không được vượt quá 255 ký tự.');
      return;
    }

    setBusy(true);
    setError('');

    const payload: SaveSpecializationRequest = {
      code: trimmedCode,
      name: trimmedName,
      isActive,
    };

    try {
      const created = await adminSpecializationService.create(payload);
      onCreated(created);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Không thể tạo chuyên ngành nghề mới.');
      if (typeof msg === 'string' && msg.includes('SPECIALIZATION_CODE_EXISTS')) {
        setError(`Mã ngành nghề "${trimmedCode}" đã tồn tại trên hệ thống.`);
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <ManagementDialog
      title="Thêm ngành nghề mới"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
            <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Mã ngành nghề */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Mã ngành nghề <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={100}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ví dụ: SOFTWARE_ENGINEERING"
            className={managementInput + ' font-mono'}
          />
          <p className="text-[11px] text-slate-500">
            Mã định danh ngành (1-100 ký tự, in hoa A-Z, số 0-9 và dấu gạch dưới).
          </p>
        </div>

        {/* Tên ngành nghề */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Tên ngành nghề <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={255}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Kỹ thuật phần mềm"
            className={managementInput}
          />
          <p className="text-[11px] text-slate-500">
            Tên hiển thị đầy đủ của ngành nghề (1-255 ký tự).
          </p>
        </div>

        {/* Trạng thái hoạt động */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span className="text-xs font-semibold text-slate-800">
              Kích hoạt ngay khi tạo
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="min-h-10 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={busy}
            className="min-h-10 px-5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {busy ? 'Đang tạo…' : 'Tạo ngành nghề'}
          </button>
        </div>
      </form>
    </ManagementDialog>
  );
}

export default SpecializationsPage;
