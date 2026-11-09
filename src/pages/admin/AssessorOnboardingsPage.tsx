import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  UserCheck,
  Plus,
  Search,
  Clock,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  X,
  ArrowRight,
  Info,
} from 'lucide-react';
import { assessorOnboardingService } from '../../services/assessor-onboarding.service';
import { getApiErrorMessage } from '../../services/api';
import {
  ASSESSOR_ONBOARDING_STATUS_CONFIG,
} from '../../types/assessor-onboarding';
import type {
  AssessorInvitationResponse,
  SessionOnboardingItem,
} from '../../types/assessor-onboarding';

const SESSION_STORAGE_KEY = 'uninet_assessor_onboarding_history';

export const AssessorOnboardingsPage: React.FC = () => {
  const navigate = useNavigate();

  // Search input state
  const [lookupId, setLookupId] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Modal Create Invitation state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [autoApprove, setAutoApprove] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [createdInvitation, setCreatedInvitation] = useState<AssessorInvitationResponse | null>(null);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isCopiedId, setIsCopiedId] = useState(false);

  // Session history state (lazy initialization from sessionStorage)
  const [sessionHistory, setSessionHistory] = useState<SessionOnboardingItem[]>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Ignore session storage errors
    }
    return [];
  });

  // Save session history item
  const saveToSessionHistory = (item: SessionOnboardingItem) => {
    setSessionHistory((prev) => {
      const filtered = prev.filter((h) => h.id.toLowerCase() !== item.id.toLowerCase());
      const updated = [item, ...filtered].slice(0, 20); // Keep max 20
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  // Clear session history
  const handleClearHistory = () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setSessionHistory([]);
  };

  // Open Lookup
  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = lookupId.trim();
    if (!cleanId) {
      setLookupError('Vui lòng nhập ID hồ sơ onboarding.');
      return;
    }
    // GUID regex check
    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!guidRegex.test(cleanId)) {
      setLookupError('ID hồ sơ phải là chuỗi GUID/UUID hợp lệ (vd: 12345678-1234-1234-1234-123456789abc).');
      return;
    }

    setLookupError(null);
    navigate(`/admin/assessor-onboardings/${cleanId}`);
  };

  // Submit Create Invitation
  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = inviteEmail.trim();

    if (!cleanEmail) {
      setInviteError('Vui lòng nhập địa chỉ email của chuyên gia.');
      return;
    }
    // Basic email check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setInviteError('Địa chỉ email không đúng định dạng.');
      return;
    }

    setIsInviting(true);
    setInviteError(null);

    try {
      const result = await assessorOnboardingService.invite({
        email: cleanEmail,
        autoApprove,
      });

      setCreatedInvitation(result);

      // Save to session history
      saveToSessionHistory({
        id: result.id,
        email: result.email,
        fullName: null,
        status: 'Invited',
        updatedAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Không thể tạo lời mời onboarding.');
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        if (msg.includes('EMAIL_ALREADY_REGISTERED')) {
          setInviteError('Email này đã được đăng ký tài khoản trong hệ thống.');
        } else if (msg.includes('ONBOARDING_ALREADY_OPEN')) {
          setInviteError('Email này đang có một hồ sơ onboarding mở khác chưa hoàn tất.');
        } else {
          setInviteError(msg);
        }
      } else {
        setInviteError(msg);
      }
    } finally {
      setIsInviting(false);
    }
  };

  // Close invite modal
  const handleCloseModal = () => {
    setIsInviteModalOpen(false);
    setInviteEmail('');
    setAutoApprove(false);
    setCreatedInvitation(null);
    setInviteError(null);
    setIsCopiedLink(false);
    setIsCopiedId(false);
  };

  // Copy full profile link
  const handleCopyLink = () => {
    if (!createdInvitation) return;
    // Assemble URL: window.location.origin + profileLink
    const fullUrl = createdInvitation.profileLink.startsWith('http')
      ? createdInvitation.profileLink
      : `${window.location.origin}${createdInvitation.profileLink.startsWith('/') ? '' : '/'}${createdInvitation.profileLink}`;

    navigator.clipboard.writeText(fullUrl);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 3000);
  };

  // Copy ID
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setIsCopiedId(true);
    setTimeout(() => setIsCopiedId(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Onboarding chuyên gia thẩm định
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Quản lý quy trình mời, tiếp nhận thông tin, xem xét hợp đồng điện tử và phê duyệt cấp
            tài khoản cho chuyên gia thẩm định dự án (Assessor).
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            handleCloseModal();
            setIsInviteModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tạo lời mời mới
        </button>
      </div>

      {/* Main Workflow Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          Quy trình Onboarding chuyên gia thẩm định gồm 4 bước:
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
              Bước 1
            </span>
            <h3 className="font-semibold text-slate-900">Gửi lời mời</h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Admin tạo lời mời bằng email và gửi liên kết khai báo thông tin cho chuyên gia (thời hạn 7 ngày).
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
              Bước 2
            </span>
            <h3 className="font-semibold text-slate-900">Khai báo hồ sơ</h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Chuyên gia điền thông tin cá nhân. Hệ thống tự động khởi tạo bản thảo hợp đồng điện tử.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
              Bước 3
            </span>
            <h3 className="font-semibold text-slate-900">Ký hợp đồng</h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Chuyên gia xem hợp đồng PDF và thực hiện ký số điện tử kèm xác thực mã OTP email.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
              Bước 4
            </span>
            <h3 className="font-semibold text-slate-900">Duyệt & Kích hoạt</h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Admin kiểm tra tính hợp lệ và phê duyệt cấp tài khoản; chuyên gia nhận link đặt mật khẩu để kích hoạt.
            </p>
          </div>
        </div>
      </div>

      {/* Lookup by ID Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            Tra cứu hồ sơ Onboarding theo ID
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Nhập mã định danh (ID dạng GUID) của hồ sơ onboarding để mở trang chi tiết, xem xét hợp đồng và thực hiện phê duyệt.
          </p>
        </div>

        <form onSubmit={handleLookup} className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={lookupId}
                onChange={(e) => {
                  setLookupId(e.target.value);
                  setLookupError(null);
                }}
                placeholder="Ví dụ: e3b0c442-98fc-1c14-9afbf4c8996fb924"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2 shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mở hồ sơ</span>
            </button>
          </div>
          {lookupError && (
            <p className="text-[11px] text-red-600 font-medium flex items-center gap-1.5 pt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{lookupError}</span>
            </p>
          )}
        </form>
      </div>

      {/* Session History List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Lịch sử tra cứu trong phiên làm việc ({sessionHistory.length})
            </h2>
            <p className="text-[11px] text-slate-400">
              Chỉ lưu tạm trên trình duyệt phiên này để hỗ trợ điều hướng nhanh, không phải danh sách toàn hệ thống.
            </p>
          </div>

          {sessionHistory.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs text-slate-400 hover:text-red-600 font-medium transition"
            >
              Xóa lịch sử phiên
            </button>
          )}
        </div>

        {sessionHistory.length === 0 ? (
          <div className="py-8 text-center text-slate-400 italic text-xs">
            Chưa có hồ sơ nào được tạo hoặc mở trong phiên làm việc này.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sessionHistory.map((item) => {
              const statusCfg =
                ASSESSOR_ONBOARDING_STATUS_CONFIG[item.status] || {
                  label: item.status,
                  bg: 'bg-slate-100',
                  text: 'text-slate-600',
                  border: 'border-slate-200',
                };

              return (
                <div
                  key={item.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2.5 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-xs">
                        {item.fullName || item.email || 'Chuyên gia thẩm định'}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>ID: {item.id}</span>
                      {item.email && <span className="font-sans text-slate-500">| {item.email}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => handleCopyId(item.id)}
                      title="Sao chép ID"
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => navigate(`/admin/assessor-onboardings/${item.id}`)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <span>Xem chi tiết</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create Invitation */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Tạo lời mời Onboarding thẩm định viên
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If Invitation is created, display links & actions */}
            {createdInvitation ? (
              <div className="space-y-4 py-1 text-xs">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Lời mời onboarding đã được tạo thành công!</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Hệ thống đã cấp mã hồ sơ và đường dẫn khai báo. Lưu ý:{' '}
                    <strong>Backend không tự động gửi email lời mời</strong>. Vui lòng sao chép đường dẫn
                    dưới đây và gửi đến chuyên gia thẩm định.
                  </p>
                </div>

                {/* ID Record */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Mã hồ sơ Onboarding (ID):</span>
                    <button
                      type="button"
                      onClick={() => handleCopyId(createdInvitation.id)}
                      className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] flex items-center gap-1"
                    >
                      {isCopiedId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopiedId ? 'Đã chép' : 'Sao chép ID'}</span>
                    </button>
                  </div>
                  <code className="block font-mono text-[11px] text-slate-900 bg-white p-2 rounded border border-slate-200 select-all">
                    {createdInvitation.id}
                  </code>
                </div>

                {/* Profile Link */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="text-slate-500 font-medium block">
                    Đường dẫn khai báo thông tin cá nhân (Profile Link):
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdInvitation.profileLink}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-[11px] font-mono text-slate-800 select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-[11px] flex items-center gap-1 shrink-0 transition"
                    >
                      {isCopiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopiedLink ? 'Đã sao chép' : 'Sao chép link'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Thời hạn hiệu lực: 7 ngày (hết hạn vào {new Date(createdInvitation.expiresAt).toLocaleString('vi-VN')}).
                  </p>
                </div>

                {/* Bottom actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/assessor-onboardings/${createdInvitation.id}`)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <span>Mở chi tiết hồ sơ ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateInvitation} className="space-y-4 text-xs">
                {inviteError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{inviteError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Địa chỉ Email chuyên gia thẩm định <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="assessor@example.com"
                    maxLength={255}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                  <p className="text-[11px] text-slate-400">
                    Email phải là địa chỉ duy nhất, chưa từng đăng ký tài khoản trên hệ thống.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoApprove}
                      onChange={(e) => setAutoApprove(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-800">
                        Bật chế độ tự động phê duyệt (Auto Approve)
                      </span>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Khi bật, hệ thống background worker sẽ tự động phê duyệt khoảng 15 phút sau khi
                        chuyên gia ký hợp đồng điện tử nếu đáp ứng đủ điều kiện. Quản trị viên vẫn có
                        thể chủ động xem xét và phê duyệt trước thời điểm đó.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isInviting}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {isInviting ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Tạo lời mời</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessorOnboardingsPage;
