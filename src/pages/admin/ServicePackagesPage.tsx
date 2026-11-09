import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Package,
  Plus,
  Search,
  RotateCcw,
  AlertCircle,
  X,
  CheckCircle2,
  Check,
  ShieldCheck,
  Megaphone,
  User,
  Building2,
  Eye,
  Edit2,
  Power,
  Trash2,
} from 'lucide-react';
import { packagesService } from '../../services/packages.service';
import { getApiErrorMessage } from '../../services/api';
import {
  PackageType,
  TargetRole,
  PACKAGE_TYPE_LABELS,
  TARGET_ROLE_LABELS,
} from '../../types/packages';
import type {
  PackageResponse,
  SavePackageRequest,
} from '../../types/packages';

export const ServicePackagesPage: React.FC = () => {
  // Data states
  const [packages, setPackages] = useState<PackageResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Filter states
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all'); // 'all', '0', '1'
  const [roleFilter, setRoleFilter] = useState<string>('all'); // 'all', '0', '1'
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'active', 'inactive'

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageResponse | null>(null);
  const [selectedPackageForDetail, setSelectedPackageForDetail] = useState<PackageResponse | null>(null);
  const [packageToDelete, setPackageToDelete] = useState<PackageResponse | null>(null);

  // Mutation loading trackers
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null);
  const [isDeactivatingId, setIsDeactivatingId] = useState<string | null>(null);

  // Form states for creating/editing package
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    type: number;
    role: number;
    price: string;
    durationInDays: string;
    isActive: boolean;
  }>({
    code: '',
    name: '',
    type: PackageType.Verification,
    role: TargetRole.Student,
    price: '',
    durationInDays: '',
    isActive: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Debounce search keyword (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [keyword]);

  // Request sequencing ref to avoid race conditions
  const requestSeq = useRef(0);

  // Fetch packages
  const fetchPackages = useCallback(
    async (currentPage = page) => {
      setIsLoading(true);
      setErrorMessage(null);
      const currentSeq = ++requestSeq.current;

      try {
        const type = typeFilter !== 'all' ? Number(typeFilter) : undefined;
        const role = roleFilter !== 'all' ? Number(roleFilter) : undefined;
        let isActive: boolean | undefined = undefined;
        if (statusFilter === 'active') isActive = true;
        if (statusFilter === 'inactive') isActive = false;

        const res = await packagesService.listAdmin({
          keyword: debouncedKeyword || undefined,
          type,
          role,
          isActive,
          page: currentPage,
          pageSize,
        });

        if (currentSeq === requestSeq.current) {
          setPackages(res.packages || []);
          setTotalItems(res.totalItems || 0);
          setTotalPages(res.totalPages || 1);
          setPage(res.page || 1);
        }
      } catch (err) {
        if (currentSeq === requestSeq.current) {
          setErrorMessage(getApiErrorMessage(err, 'Không thể tải danh sách gói dịch vụ.'));
        }
      } finally {
        if (currentSeq === requestSeq.current) {
          setIsLoading(false);
        }
      }
    },
    [page, debouncedKeyword, typeFilter, roleFilter, statusFilter, pageSize]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPackages(page);
  }, [fetchPackages, page]);

  // Handle Quick Notifications
  const showToastSuccess = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingPackage(null);
    setFormData({
      code: '',
      name: '',
      type: PackageType.Verification,
      role: TargetRole.Student,
      price: '',
      durationInDays: '',
      isActive: true,
    });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (pkg: PackageResponse) => {
    setEditingPackage(pkg);
    setFormData({
      code: pkg.code,
      name: pkg.name,
      type: pkg.type,
      role: pkg.role,
      price: pkg.price.toString(),
      durationInDays: pkg.durationInDays !== null ? pkg.durationInDays.toString() : '',
      isActive: pkg.isActive,
    });
    setFormErrors({});
    setSelectedPackageForDetail(null);
    setIsCreateModalOpen(true);
  };

  // Toggle status (from detail modal)
  const handleToggleStatus = async (pkg: PackageResponse) => {
    if (isTogglingId) return;
    setIsTogglingId(pkg.id);
    try {
      const updated = await packagesService.toggleStatus(pkg.id);
      showToastSuccess(
        `Đã ${!pkg.isActive ? 'kích hoạt' : 'tắt'} thành công gói "${pkg.name}".`
      );
      setSelectedPackageForDetail((prev) =>
        prev && prev.id === pkg.id
          ? { ...prev, isActive: updated.isActive !== undefined ? updated.isActive : !pkg.isActive }
          : prev
      );
      await fetchPackages(page);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Thao tác chuyển đổi trạng thái thất bại.'));
    } finally {
      setIsTogglingId(null);
    }
  };

  // Confirm soft deactivate
  const handleConfirmDeactivate = async () => {
    if (!packageToDelete || isDeactivatingId) return;
    setIsDeactivatingId(packageToDelete.id);
    try {
      await packagesService.deactivate(packageToDelete.id);
      showToastSuccess(`Đã ngừng cung cấp gói "${packageToDelete.name}".`);
      setPackageToDelete(null);
      setSelectedPackageForDetail(null);
      await fetchPackages(page);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể ngừng cung cấp gói dịch vụ.'));
    } finally {
      setIsDeactivatingId(null);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.code.trim()) {
      errors.code = 'Mã gói dịch vụ không được để trống.';
    } else if (formData.code.trim().length > 100) {
      errors.code = 'Mã gói không được vượt quá 100 ký tự.';
    }

    if (!formData.name.trim()) {
      errors.name = 'Tên gói dịch vụ không được để trống.';
    } else if (formData.name.trim().length > 255) {
      errors.name = 'Tên gói không được vượt quá 255 ký tự.';
    }

    const priceTrimmed = formData.price.trim();
    if (!priceTrimmed) {
      errors.price = 'Giá gói không được để trống.';
    } else if (!/^\d+(\.\d{1,2})?$/.test(priceTrimmed)) {
      errors.price = 'Mức giá phải là số dương hợp lệ (tối đa 2 chữ số thập phân).';
    } else {
      const numVal = Number(priceTrimmed);
      if (isNaN(numVal) || numVal < 0) {
        errors.price = 'Mức giá phải lớn hơn hoặc bằng 0.';
      } else if (priceTrimmed.split('.')[0].length > 15 || numVal > 9007199254740991) {
        errors.price = 'Mức giá vượt quá giới hạn an toàn tối đa cho phép.';
      }
    }

    if (formData.durationInDays.trim()) {
      const durationNum = Number(formData.durationInDays.trim());
      if (!Number.isInteger(durationNum) || durationNum <= 0) {
        errors.durationInDays = 'Thời hạn phải là số nguyên dương (ngày), hoặc để trống nếu không giới hạn.';
      } else if (durationNum > 2147483647) {
        errors.durationInDays = 'Thời hạn ngày vượt quá giới hạn Int32.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Form (Create / Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isSubmittingForm) return;

    setIsSubmittingForm(true);
    setFormErrors({});

    const payload: SavePackageRequest = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      type: Number(formData.type),
      role: Number(formData.role),
      price: Number(formData.price.trim()),
      durationInDays: formData.durationInDays.trim()
        ? parseInt(formData.durationInDays.trim(), 10)
        : null,
      isActive: formData.isActive,
    };

    try {
      if (editingPackage) {
        await packagesService.update(editingPackage.id, payload);
        showToastSuccess(`Đã cập nhật gói "${payload.name}" thành công.`);
      } else {
        await packagesService.create(payload);
        showToastSuccess(`Đã tạo mới gói "${payload.name}" thành công.`);
      }
      setIsCreateModalOpen(false);
      setEditingPackage(null);
      await fetchPackages(page);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Không thể lưu thông tin gói dịch vụ.');
      if ((axios.isAxiosError(err) && err.response?.status === 409) || msg.includes('PACKAGE_CODE_EXISTS')) {
        setFormErrors({ code: 'Mã gói dịch vụ này đã tồn tại trong hệ thống.' });
      } else {
        setFormErrors({ form: msg });
      }
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Helper formatting currency
  const formatVnd = (amount: number) => {
    try {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${amount} ₫`;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {actionSuccessMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{actionSuccessMessage}</span>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="ml-2 text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Cấu hình dịch vụ
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Quản lý danh mục gói dịch vụ thẩm định dự án và quảng cáo dành cho Sinh viên và Doanh
            nghiệp trên hệ thống UniNet.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchPackages(page)}
            disabled={isLoading}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Tạo gói mới
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo mã hoặc tên gói..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
            {keyword && (
              <button
                onClick={() => setKeyword('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            >
              <option value="all">Tất cả loại dịch vụ</option>
              <option value={String(PackageType.Verification)}>Thẩm định dự án</option>
              <option value={String(PackageType.Advertisement)}>Quảng cáo</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            >
              <option value="all">Tất cả đối tượng</option>
              <option value={String(TargetRole.Student)}>Sinh viên</option>
              <option value={String(TargetRole.Company)}>Doanh nghiệp</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang áp dụng</option>
              <option value="inactive">Đã ngừng / tắt</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table or States */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium">Đang tải danh sách gói dịch vụ...</p>
          </div>
        ) : errorMessage ? (
          <div className="py-12 px-6 text-center space-y-3">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-red-600 max-w-md mx-auto">{errorMessage}</p>
            <button
              onClick={() => fetchPackages(page)}
              className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
            >
              Thử lại
            </button>
          </div>
        ) : packages.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-medium">Không tìm thấy gói dịch vụ nào phù hợp.</p>
            {(keyword || typeFilter !== 'all' || roleFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setKeyword('');
                  setTypeFilter('all');
                  setRoleFilter('all');
                  setStatusFilter('all');
                  setPage(1);
                }}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Mã gói</th>
                  <th className="py-3 px-4">Tên gói</th>
                  <th className="py-3 px-4">Loại dịch vụ</th>
                  <th className="py-3 px-4">Đối tượng áp dụng</th>
                  <th className="py-3 px-4 text-right">Mức giá</th>
                  <th className="py-3 px-4">Thời hạn</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Code */}
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-[11px]">
                        {pkg.code}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {pkg.name}
                    </td>

                    {/* Type */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                          pkg.type === PackageType.Verification
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}
                      >
                        {pkg.type === PackageType.Verification ? (
                          <ShieldCheck className="w-3 h-3" />
                        ) : (
                          <Megaphone className="w-3 h-3" />
                        )}
                        {PACKAGE_TYPE_LABELS[pkg.type] || 'Khác'}
                      </span>
                    </td>

                    {/* Target Role */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                          pkg.role === TargetRole.Student
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {pkg.role === TargetRole.Student ? (
                          <User className="w-3 h-3" />
                        ) : (
                          <Building2 className="w-3 h-3" />
                        )}
                        {TARGET_ROLE_LABELS[pkg.role] || 'Khác'}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatVnd(pkg.price)}
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 px-4 text-slate-500">
                      {pkg.durationInDays !== null ? (
                        <span className="font-medium text-slate-700">
                          {pkg.durationInDays} ngày
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Không cấu hình thời hạn</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          pkg.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {pkg.isActive ? 'Đang áp dụng' : 'Đã tắt'}
                      </span>
                    </td>

                    {/* Actions: View Detail */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedPackageForDetail(pkg)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem chi tiết</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-xs text-slate-600">
            <span>
              Trang <strong>{page}</strong> / <strong>{totalPages}</strong> (Tổng cộng {totalItems} gói)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                Trang trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                Trang tiếp
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: View Package Detail (with Action Buttons: Edit, Toggle, Deactivate) */}
      {selectedPackageForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Package className="w-4 h-4" />
                </span>
                <h2 className="text-sm font-bold text-slate-900">Chi tiết gói dịch vụ</h2>
              </div>
              <button
                onClick={() => setSelectedPackageForDetail(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Header Box: Name, Code & Status */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900 text-sm">
                    {selectedPackageForDetail.name}
                  </h3>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      selectedPackageForDetail.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {selectedPackageForDetail.isActive ? 'Đang áp dụng' : 'Đã tắt'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  Mã gói:{' '}
                  <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {selectedPackageForDetail.code}
                  </span>
                </p>
              </div>

              {/* Grid 4 Information Boxes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-1">
                  <span className="text-slate-400 block text-[11px]">Loại dịch vụ</span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${
                      selectedPackageForDetail.type === PackageType.Verification
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}
                  >
                    {selectedPackageForDetail.type === PackageType.Verification ? (
                      <ShieldCheck className="w-3 h-3" />
                    ) : (
                      <Megaphone className="w-3 h-3" />
                    )}
                    {PACKAGE_TYPE_LABELS[selectedPackageForDetail.type] || 'Khác'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-1">
                  <span className="text-slate-400 block text-[11px]">Đối tượng áp dụng</span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                      selectedPackageForDetail.role === TargetRole.Student
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {selectedPackageForDetail.role === TargetRole.Student ? (
                      <User className="w-3 h-3" />
                    ) : (
                      <Building2 className="w-3 h-3" />
                    )}
                    {TARGET_ROLE_LABELS[selectedPackageForDetail.role] || 'Khác'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-1">
                  <span className="text-slate-400 block text-[11px]">Mức giá</span>
                  <span className="font-bold text-slate-900 text-sm block">
                    {formatVnd(selectedPackageForDetail.price)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-1">
                  <span className="text-slate-400 block text-[11px]">Thời hạn hiệu lực</span>
                  <span className="font-semibold text-slate-800 block">
                    {selectedPackageForDetail.durationInDays !== null
                      ? `${selectedPackageForDetail.durationInDays} ngày`
                      : 'Không giới hạn thời hạn'}
                  </span>
                </div>
              </div>

              {/* Timestamps if available */}
              {(selectedPackageForDetail.createdAt || selectedPackageForDetail.updatedAt) && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-[11px]">
                  {selectedPackageForDetail.createdAt && (
                    <div>
                      <span className="text-slate-400 block">Thời gian tạo:</span>
                      <span className="font-medium text-slate-700">
                        {new Date(selectedPackageForDetail.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  )}
                  {selectedPackageForDetail.updatedAt && (
                    <div>
                      <span className="text-slate-400 block">Cập nhật gần nhất:</span>
                      <span className="font-medium text-slate-700">
                        {new Date(selectedPackageForDetail.updatedAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons within Detail Modal */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-2 flex-wrap">
              {/* Soft Deactivate Button */}
              <button
                type="button"
                onClick={() => setPackageToDelete(selectedPackageForDetail)}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ngừng cung cấp</span>
              </button>

              {/* Right actions: Toggle, Edit, Close */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(selectedPackageForDetail)}
                  disabled={isTogglingId === selectedPackageForDetail.id}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 ${
                    selectedPackageForDetail.isActive
                      ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                      : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                  } disabled:opacity-50`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{selectedPackageForDetail.isActive ? 'Tắt kích hoạt' : 'Kích hoạt lại'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEditModal(selectedPackageForDetail)}
                  className="px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPackageForDetail(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create or Edit Package */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                {editingPackage ? 'Cập nhật thông tin gói dịch vụ' : 'Tạo gói dịch vụ mới'}
              </h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingPackage(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formErrors.form && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formErrors.form}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Code */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Mã gói dịch vụ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="VD: VERIFY_STUDENT_STANDARD"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                />
                {formErrors.code && (
                  <p className="text-[11px] text-red-600 font-medium">{formErrors.code}</p>
                )}
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Tên gói dịch vụ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Gói thẩm định tiêu chuẩn sinh viên"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                {formErrors.name && (
                  <p className="text-[11px] text-red-600 font-medium">{formErrors.name}</p>
                )}
              </div>

              {/* Type and Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Loại dịch vụ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value={PackageType.Verification}>Thẩm định dự án</option>
                    <option value={PackageType.Advertisement}>Quảng cáo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Đối tượng áp dụng <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value={TargetRole.Student}>Sinh viên</option>
                    <option value={TargetRole.Company}>Doanh nghiệp</option>
                  </select>
                </div>
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Mức giá (VND) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="VD: 500000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  {formErrors.price ? (
                    <p className="text-[11px] text-red-600 font-medium">{formErrors.price}</p>
                  ) : formData.price && !isNaN(Number(formData.price)) ? (
                    <p className="text-[11px] text-slate-400">
                      Hiển thị: {formatVnd(Number(formData.price))}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Thời hạn hiệu lực (ngày)
                  </label>
                  <input
                    type="number"
                    value={formData.durationInDays}
                    onChange={(e) => setFormData({ ...formData, durationInDays: e.target.value })}
                    placeholder="Để trống nếu không giới hạn"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  {formErrors.durationInDays && (
                    <p className="text-[11px] text-red-600 font-medium">
                      {formErrors.durationInDays}
                    </p>
                  )}
                </div>
              </div>

              {/* IsActive */}
              <div className="pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="font-medium text-slate-800">
                    Kích hoạt áp dụng gói này ngay sau khi lưu
                  </span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingPackage(null);
                  }}
                  disabled={isSubmittingForm}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingForm ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{editingPackage ? 'Lưu thay đổi' : 'Tạo gói dịch vụ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Deactivate */}
      {packageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900">
                Xác nhận ngừng cung cấp gói dịch vụ?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bạn đang chuẩn bị ngừng cung cấp gói{' '}
                <strong className="text-slate-900">"{packageToDelete.name}"</strong> (mã:{' '}
                <code>{packageToDelete.code}</code>). Thao tác này sẽ vô hiệu hóa mềm gói dịch vụ (
                <code>isActive = false</code>) và gói sẽ không còn xuất hiện cho người dùng đăng ký mới.
                Lịch sử giao dịch trước đây vẫn được bảo toàn.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPackageToDelete(null)}
                disabled={Boolean(isDeactivatingId)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                disabled={Boolean(isDeactivatingId)}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeactivatingId ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Ngừng cung cấp gói</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicePackagesPage;
