import React, { useState, useEffect, useCallback } from 'react';
import {
  Video,
  Play,
  Square,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Clock,
  Calendar,
  Maximize2,
  Minimize2,
  Tv,
  FileCheck,
  ShieldCheck,
  HelpCircle,
  Lock,
  ArrowRight,
} from 'lucide-react';
import {
  verificatorMeetingService,
  parseMeetingErrorMessage,
  getMeetingLifecycleStatus,
  formatMeetingDuration,
  getRemainingSeconds,
  formatCountdown,
} from '../../services/verificator-meeting.service';
import type { MeetingResponse } from '../../types/verificator-assignments';
import { managementDate } from '../../utils/management';

interface VerificationMeetingPanelProps {
  assignmentId: string;
  projectTitle: string;
  initialMeeting?: MeetingResponse | null;
  onMeetingUpdated?: (meeting: MeetingResponse) => void;
  onNavigateToReport?: () => void;
}

export const VerificationMeetingPanel: React.FC<VerificationMeetingPanelProps> = ({
  assignmentId,
  projectTitle,
  initialMeeting,
  onMeetingUpdated,
  onNavigateToReport,
}) => {
  const [meeting, setMeeting] = useState<MeetingResponse | null>(initialMeeting || null);
  const [loading, setLoading] = useState<boolean>(!initialMeeting);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionStep, setActionStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [popupBlockedUrl, setPopupBlockedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Chế độ nhúng video trực tiếp trên giao diện
  const [isEmbedded, setIsEmbedded] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [embeddedUrl, setEmbeddedUrl] = useState<string | null>(initialMeeting?.joinUrl || null);

  // Mốc thời gian hiện tại để cập nhật live timer và countdown
  const [now, setNow] = useState<number>(() => Date.now());

  // Modal xác nhận kết thúc cuộc họp
  const [showEndConfirm, setShowEndConfirm] = useState<boolean>(false);

  // Tải thông tin phòng họp từ backend (nguồn xác nhận trạng thái)
  const loadMeeting = useCallback(
    async (isSilent = false) => {
      if (!assignmentId) return;
      if (!isSilent) setLoading(true);
      setError(null);
      try {
        const data = await verificatorMeetingService.getMeeting(assignmentId);
        setMeeting(data);
        if (data.joinUrl) {
          setEmbeddedUrl(data.joinUrl);
        }
        onMeetingUpdated?.(data);
      } catch (err) {
        if (!isSilent) {
          setError(parseMeetingErrorMessage(err, 'Chưa thể tải dữ liệu phòng họp.'));
        }
      } finally {
        if (!isSilent) setLoading(false);
      }
    },
    [assignmentId, onMeetingUpdated]
  );

  useEffect(() => {
    if (!initialMeeting) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadMeeting();
    } else {
      setMeeting(initialMeeting);
      if (initialMeeting.joinUrl) {
        setEmbeddedUrl(initialMeeting.joinUrl);
      }
    }
  }, [initialMeeting, loadMeeting]);

  const lifecycle = getMeetingLifecycleStatus(meeting);

  // Kiểm tra thời gian chờ trước giờ hẹn
  const remainingSeconds = getRemainingSeconds(meeting?.scheduledStartAt, now);
  const isBeforeScheduledTime = Boolean(
    meeting?.scheduledStartAt &&
      !meeting?.meetingStartAt &&
      !meeting?.meetingEndAt &&
      remainingSeconds > 0
  );

  // Cập nhật live timer mỗi giây: khi đang họp hoặc khi đang đếm ngược chờ đến giờ hẹn
  useEffect(() => {
    const hasScheduledCountdown = Boolean(
      meeting?.scheduledStartAt && !meeting?.meetingStartAt && !meeting?.meetingEndAt
    );
    const isInProgress = lifecycle === 'InProgress';

    if (!hasScheduledCountdown && !isInProgress) return;

    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [lifecycle, meeting?.scheduledStartAt, meeting?.meetingStartAt, meeting?.meetingEndAt]);

  // Refresh dữ liệu khi quay lại dashboard (chuyển tab hoặc focus cửa sổ)
  // Không tự ý kết thúc phiên khi đóng tab hoặc rời Jitsi
  useEffect(() => {
    let lastFetchTime = Date.now();
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        const currentTime = Date.now();
        // Giới hạn tần suất gọi lại tối thiểu cách nhau 3 giây
        if (currentTime - lastFetchTime > 3000) {
          lastFetchTime = currentTime;
          void loadMeeting(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [loadMeeting]);

  // Tính toán thời gian đã họp trực tiếp (live elapsed seconds)
  const elapsedSeconds =
    lifecycle === 'InProgress' && meeting?.meetingStartAt
      ? Math.max(0, Math.floor((now - new Date(meeting.meetingStartAt).getTime()) / 1000))
      : 0;

  const formatTimer = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // Mở URL phòng họp và phát hiện nếu popup bị trình duyệt chặn
  const openMeetingUrl = (url: string): boolean => {
    try {
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        setPopupBlockedUrl(url);
        return false;
      }
      setPopupBlockedUrl(null);
      return true;
    } catch {
      setPopupBlockedUrl(url);
      return false;
    }
  };

  // Thao tác 1: Khởi tạo phòng họp (cho phép tạo trước giờ hẹn)
  const handleCreateMeeting = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    setActionStep('Đang khởi tạo phòng họp...');
    setError(null);
    setNotice(null);
    setPopupBlockedUrl(null);
    try {
      const data = await verificatorMeetingService.createOrGetMeeting(assignmentId);
      setMeeting(data);
      if (data.joinUrl) {
        setEmbeddedUrl(data.joinUrl);
      }
      onMeetingUpdated?.(data);
      setNotice({
        type: 'success',
        text: 'Khởi tạo phòng họp xác minh trực tuyến thành công.',
      });
    } catch (err) {
      setError(parseMeetingErrorMessage(err, 'Không thể khởi tạo phòng họp xác minh.'));
    } finally {
      setActionLoading(false);
      setActionStep(null);
    }
  };

  // Thao tác 2: Bắt đầu và tham gia (chuỗi tuần tự: tạo phòng nếu chưa có -> start nếu chưa bắt đầu -> join & mở Jitsi)
  const handleStartAndJoinMeeting = async () => {
    if (actionLoading) return;
    if (isBeforeScheduledTime) {
      setError(`Chưa đến giờ hẹn bắt đầu buổi họp (Còn ${formatCountdown(remainingSeconds)}).`);
      return;
    }

    setActionLoading(true);
    setError(null);
    setNotice(null);
    setPopupBlockedUrl(null);

    let currentMeeting = meeting;

    // Bước A: Tạo phòng nếu chưa có
    if (!currentMeeting?.roomName && !currentMeeting?.joinUrl) {
      setActionStep('Đang khởi tạo phòng họp Jitsi...');
      try {
        const created = await verificatorMeetingService.createOrGetMeeting(assignmentId);
        currentMeeting = created;
        setMeeting(created);
        onMeetingUpdated?.(created);
      } catch (err) {
        setError(parseMeetingErrorMessage(err, 'Không thể khởi tạo phòng họp. Vui lòng thử lại.'));
        setActionLoading(false);
        setActionStep(null);
        return;
      }
    }

    // Bước B: Bắt đầu buổi họp nếu chưa bắt đầu
    if (!currentMeeting.meetingStartAt) {
      setActionStep('Đang ghi nhận bắt đầu buổi họp...');
      try {
        const started = await verificatorMeetingService.startMeeting(assignmentId);
        currentMeeting = started;
        setMeeting(started);
        onMeetingUpdated?.(started);
      } catch (err) {
        setError(parseMeetingErrorMessage(err, 'Không thể ghi nhận bắt đầu cuộc họp. Vui lòng thử lại.'));
        setActionLoading(false);
        setActionStep(null);
        return;
      }
    }

    // Bước C: Lấy liên kết tham gia phòng họp (join)
    setActionStep('Đang lấy liên kết tham gia phòng họp...');
    let joinUrl = currentMeeting.joinUrl;
    try {
      const joinData = await verificatorMeetingService.joinMeeting(assignmentId);
      if (joinData.joinUrl) {
        joinUrl = joinData.joinUrl;
        setEmbeddedUrl(joinData.joinUrl);
      }
    } catch (err) {
      // BƯỚC B ĐÃ THÀNH CÔNG -> GIỮ NGUYÊN TRẠNG THÁI ĐÃ BẮT ĐẦU VÀ CHO THAM GIA LẠI
      setError(
        parseMeetingErrorMessage(
          err,
          'Buổi họp đã được ghi nhận bắt đầu thành công, nhưng chưa thể lấy liên kết Jitsi. Bạn có thể nhấn "Tham gia lại" để thử mở lại.'
        )
      );
      setActionLoading(false);
      setActionStep(null);
      return;
    }

    // Bước D: Mở phòng họp Jitsi
    if (!joinUrl) {
      setError('Không tìm thấy liên kết tham gia phòng họp Jitsi. Bạn có thể nhấn "Tham gia lại".');
      setActionLoading(false);
      setActionStep(null);
      return;
    }

    const opened = openMeetingUrl(joinUrl);
    if (opened) {
      setNotice({
        type: 'success',
        text: 'Buổi họp đã bắt đầu thành công và phòng họp Jitsi đã được mở trong thẻ mới.',
      });
    } else {
      setNotice({
        type: 'info',
        text: 'Buổi họp đã bắt đầu. Trình duyệt đã chặn mở tab tự động — vui lòng bấm nút "Mở phòng họp ngay" bên dưới.',
      });
    }

    setActionLoading(false);
    setActionStep(null);
  };

  // Thao tác 3: Tham gia lại (dành cho phiên đã bắt đầu, tuyệt đối KHÔNG gọi lại start)
  const handleRejoinMeeting = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    setActionStep('Đang kết nối lại phòng họp...');
    setError(null);
    setNotice(null);
    setPopupBlockedUrl(null);

    try {
      const joinData = await verificatorMeetingService.joinMeeting(assignmentId);
      const joinUrl = joinData.joinUrl || meeting?.joinUrl || embeddedUrl;
      if (!joinUrl) {
        throw new Error('Không tìm thấy liên kết tham gia phòng họp.');
      }
      setEmbeddedUrl(joinUrl);
      const opened = openMeetingUrl(joinUrl);
      if (opened) {
        setNotice({
          type: 'info',
          text: 'Đã mở lại phòng họp trong thẻ mới. Bạn có thể tiếp tục trao đổi với nhóm dự án.',
        });
      } else {
        setNotice({
          type: 'info',
          text: 'Trình duyệt đã chặn mở tab tự động. Vui lòng bấm nút "Mở phòng họp ngay" bên dưới.',
        });
      }
    } catch (err) {
      setError(parseMeetingErrorMessage(err, 'Không thể tham gia lại phòng họp. Vui lòng thử lại.'));
    } finally {
      setActionLoading(false);
      setActionStep(null);
    }
  };

  // Thao tác 4: Xác nhận kết thúc cuộc họp qua modal
  const handleConfirmEndMeeting = async () => {
    if (actionLoading) return;
    setShowEndConfirm(false);
    setActionLoading(true);
    setActionStep('Đang kết thúc buổi họp...');
    setError(null);
    setNotice(null);
    setPopupBlockedUrl(null);
    try {
      const updated = await verificatorMeetingService.endMeeting(assignmentId);
      setMeeting(updated);
      setIsEmbedded(false);
      onMeetingUpdated?.(updated);
      setNotice({
        type: 'success',
        text: 'Buổi họp xác minh đã kết thúc thành công! Bạn hiện đã có thể chuyển sang nộp báo cáo kết luận.',
      });
    } catch (err) {
      setError(parseMeetingErrorMessage(err, 'Không thể ghi nhận kết thúc cuộc họp. Vui lòng thử lại.'));
    } finally {
      setActionLoading(false);
      setActionStep(null);
    }
  };

  const copyJoinLink = () => {
    const url = meeting?.joinUrl || embeddedUrl || popupBlockedUrl || '';
    if (!url) return;
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded w-1/3" />
        <div className="h-4 bg-slate-100 rounded w-1/2" />
        <div className="h-32 bg-slate-50 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner cảnh báo khi popup bị trình duyệt chặn */}
      {popupBlockedUrl && (
        <div className="p-4 rounded-2xl border bg-amber-50 border-amber-300 text-amber-900 text-xs sm:text-sm space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Trình duyệt đã chặn cửa sổ bật lên tự động (Popup Blocked)</p>
              <p>
                Trình duyệt của bạn đang chặn mở thẻ mới tự động. Vui lòng nhấn vào nút bên dưới để mở trực tiếp
                phòng họp Jitsi Meet:
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pl-7.5">
            <a
              href={popupBlockedUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setPopupBlockedUrl(null)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition"
            >
              <ExternalLink className="w-4 h-4" />
              Mở phòng họp ngay
            </a>
            <button
              type="button"
              onClick={copyJoinLink}
              className="px-3.5 py-2 bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Đã sao chép liên kết' : 'Sao chép liên kết'}
            </button>
            <button
              type="button"
              onClick={() => setPopupBlockedUrl(null)}
              className="px-3 py-2 text-slate-500 hover:text-slate-700 text-xs"
            >
              Đóng cảnh báo
            </button>
          </div>
        </div>
      )}

      {/* Thông báo kết quả thao tác */}
      {notice && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 transition ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{notice.text}</span>
        </div>
      )}

      {/* Thông báo lỗi nếu có */}
      {error && (
        <div className="p-4 rounded-xl border bg-red-50 border-red-200 text-red-800 text-xs sm:text-sm flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-semibold">Lỗi thao tác buổi họp</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadMeeting()}
            className="text-xs font-semibold text-red-700 underline hover:text-red-900 shrink-0"
          >
            Tải lại
          </button>
        </div>
      )}

      {/* Main Container Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        {/* Header buổi họp & Trạng thái */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-600" />
                Buổi họp Xác minh Trực tuyến
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Phỏng vấn và đối chiếu thực tế dự án: <span className="font-semibold text-slate-700">{projectTitle}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {lifecycle === 'NotCreated' && (
              <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-200 inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Chưa khởi tạo phòng
              </span>
            )}
            {lifecycle === 'Ready' && !isBeforeScheduledTime && (
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200 inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                Phòng họp sẵn sàng
              </span>
            )}
            {isBeforeScheduledTime && (
              <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200 inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Chờ đến giờ hẹn ({formatCountdown(remainingSeconds)})
              </span>
            )}
            {lifecycle === 'InProgress' && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
                  Đang trong buổi họp
                </span>
                <span className="font-mono text-xs font-bold bg-slate-900 text-emerald-400 px-2.5 py-1 rounded-lg shadow-inner">
                  {formatTimer(elapsedSeconds)}
                </span>
              </div>
            )}
            {lifecycle === 'Completed' && (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200 inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Buổi họp đã hoàn thành
              </span>
            )}

            <button
              type="button"
              disabled={actionLoading}
              onClick={() => void loadMeeting()}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
              title="Làm mới trạng thái cuộc họp từ máy chủ"
            >
              <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Banner đếm ngược chờ đến giờ hẹn (Trước giờ hẹn) */}
        {isBeforeScheduledTime && (
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3 text-xs sm:text-sm text-amber-900">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Chưa đến giờ hẹn bắt đầu buổi họp</p>
              <p className="text-amber-800 leading-relaxed">
                Lịch hẹn xác minh: <span className="font-semibold">{managementDate(meeting?.scheduledStartAt)}</span>.
                Chức năng bắt đầu buổi họp sẽ tự động mở khóa sau{' '}
                <span className="font-bold font-mono text-amber-950 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                  {formatCountdown(remainingSeconds)}
                </span>
                . Bạn vẫn có thể khởi tạo phòng trước bên dưới để sẵn sàng.
              </p>
            </div>
          </div>
        )}

        {/* Thông tin thời gian & Phòng họp */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Lịch hẹn dự kiến
            </span>
            <p className="font-semibold text-slate-800">
              {meeting?.scheduledStartAt ? managementDate(meeting.scheduledStartAt) : 'Chưa xếp lịch'}
            </p>
            {meeting?.scheduledEndAt && (
              <p className="text-[11px] text-slate-500">Đến: {managementDate(meeting.scheduledEndAt)}</p>
            )}
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Play className="w-3.5 h-3.5 text-emerald-500" />
              Bắt đầu thực tế
            </span>
            <p className="font-semibold text-slate-800">
              {meeting?.meetingStartAt ? managementDate(meeting.meetingStartAt) : 'Chưa bắt đầu'}
            </p>
            {meeting?.meetingStartAt && lifecycle === 'InProgress' && (
              <p className="text-[11px] text-emerald-600 font-medium">
                Thời gian diễn ra: {formatTimer(elapsedSeconds)}
              </p>
            )}
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Square className="w-3.5 h-3.5 text-rose-500" />
              Kết thúc thực tế
            </span>
            <p className="font-semibold text-slate-800">
              {meeting?.meetingEndAt ? managementDate(meeting.meetingEndAt) : 'Chưa kết thúc'}
            </p>
            {meeting?.meetingStartAt && meeting?.meetingEndAt && (
              <p className="text-[11px] text-slate-500">
                Tổng thời lượng: {formatMeetingDuration(meeting.meetingStartAt, meeting.meetingEndAt)}
              </p>
            )}
          </div>
        </div>

        {/* Thanh điều khiển phòng họp và nút hành động */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-700">Điều khiển buổi họp trực tuyến</span>
              <p className="text-[11px] text-slate-500">
                {lifecycle === 'NotCreated' &&
                  (isBeforeScheduledTime
                    ? 'Bạn có thể bấm Khởi tạo phòng họp trước giờ hẹn để hệ thống cấp sẵn URL Jitsi.'
                    : 'Bấm "Bắt đầu và tham gia" để hệ thống tự động khởi tạo, kích hoạt và mở phòng họp.')}
                {lifecycle === 'Ready' &&
                  (isBeforeScheduledTime
                    ? 'Phòng họp đã được khởi tạo. Nút bắt đầu đang khóa chờ đến giờ hẹn.'
                    : 'Đã đến giờ hẹn. Bấm "Bắt đầu và tham gia" để kích hoạt phiên họp và kết nối trực tiếp.')}
                {lifecycle === 'InProgress' &&
                  'Buổi họp đang diễn ra. Bấm "Tham gia lại" nếu cần mở lại phòng, hoặc bấm "Kết thúc cuộc họp" sau khi hoàn tất.'}
                {lifecycle === 'Completed' &&
                  'Buổi họp đã kết thúc. Vui lòng chuyển sang bước nộp báo cáo kết luận thẩm định.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* TRƯỜNG HỢP 1: TRƯỚC GIỜ HẸN */}
              {isBeforeScheduledTime && (
                <>
                  {/* Cho phép khởi tạo phòng trước giờ hẹn nếu chưa có */}
                  {lifecycle === 'NotCreated' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => void handleCreateMeeting()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition disabled:opacity-50"
                    >
                      <Video className="w-4 h-4" />
                      {actionLoading ? (actionStep || 'Đang tạo phòng...') : 'Khởi tạo phòng họp trước'}
                    </button>
                  )}

                  {/* Nút bắt đầu bị khóa trước giờ hẹn kèm thời gian chờ */}
                  <button
                    type="button"
                    disabled={true}
                    className="px-4 py-2 bg-slate-200 text-slate-500 rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-not-allowed opacity-80"
                    title={`Chưa đến giờ hẹn. Còn ${formatCountdown(remainingSeconds)}`}
                  >
                    <Lock className="w-4 h-4 text-slate-400" />
                    Khóa bắt đầu (Còn {formatCountdown(remainingSeconds)})
                  </button>
                </>
              )}

              {/* TRƯỜNG HỢP 2: ĐẾN GIỜ (CHƯA BẮT ĐẦU: lifecycle !== InProgress && lifecycle !== Completed && !isBeforeScheduledTime) */}
              {!isBeforeScheduledTime && lifecycle !== 'InProgress' && lifecycle !== 'Completed' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => void handleStartAndJoinMeeting()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition disabled:opacity-50"
                >
                  {actionLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {actionLoading ? (actionStep || 'Đang xử lý...') : 'Bắt đầu và tham gia'}
                </button>
              )}

              {/* TRƯỜNG HỢP 3: PHIÊN ĐÃ BẮT ĐẦU (chỉ hiển thị "Tham gia lại", không gọi start nữa) */}
              {lifecycle === 'InProgress' && (
                <>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => void handleRejoinMeeting()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    {actionLoading ? (actionStep || 'Đang xử lý...') : 'Tham gia lại'}
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => {
                      if (!isEmbedded && (!embeddedUrl || embeddedUrl === '')) {
                        void handleRejoinMeeting();
                      } else {
                        setIsEmbedded((prev) => !prev);
                      }
                    }}
                    className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition"
                  >
                    <Tv className="w-3.5 h-3.5 text-blue-600" />
                    {isEmbedded ? 'Đóng khung nhúng' : 'Xem nhúng tại trang'}
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setShowEndConfirm(true)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition disabled:opacity-50"
                  >
                    <Square className="w-4 h-4" />
                    Kết thúc cuộc họp
                  </button>
                </>
              )}

              {/* TRƯỜNG HỢP 4: PHIÊN ĐÃ KẾT THÚC (Ẩn nút tham gia, chỉ hiển thị nút nộp report) */}
              {lifecycle === 'Completed' && onNavigateToReport && (
                <button
                  type="button"
                  onClick={onNavigateToReport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition"
                >
                  <FileCheck className="w-4 h-4" />
                  Nộp báo cáo thẩm định
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Hộp chia sẻ liên kết phòng họp (nếu có và phiên chưa kết thúc) */}
          {lifecycle !== 'Completed' && (meeting?.joinUrl || embeddedUrl) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-900">
              <span className="font-medium">Liên kết phòng họp Jitsi Meet đã sẵn sàng cho buổi thẩm định.</span>
              <button
                type="button"
                onClick={copyJoinLink}
                className="self-start sm:self-auto px-3 py-1 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg font-semibold inline-flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Đã sao chép link' : 'Sao chép liên kết phòng họp'}
              </button>
            </div>
          )}

          {/* Banner thông báo khi phiên đã hoàn thành */}
          {lifecycle === 'Completed' && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm text-emerald-900">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Buổi họp xác minh đã kết thúc thành công</p>
                  <p className="text-emerald-800 text-xs">
                    Thời lượng họp thực tế:{' '}
                    <span className="font-semibold">
                      {formatMeetingDuration(meeting?.meetingStartAt, meeting?.meetingEndAt)}
                    </span>
                    . Phiên họp đã chốt trên hệ thống và các nút tham gia đã được ẩn.
                  </p>
                </div>
              </div>
              {onNavigateToReport && (
                <button
                  type="button"
                  onClick={onNavigateToReport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition shrink-0"
                >
                  <FileCheck className="w-4 h-4" />
                  Chuyển sang Báo cáo thẩm định
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Khung nhúng Jitsi Video Call trực tiếp (khi InProgress và người dùng bật) */}
        {lifecycle === 'InProgress' && isEmbedded && embeddedUrl && (
          <div
            className={`border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 shadow-md transition-all ${
              isFullscreen
                ? 'fixed inset-0 z-50 rounded-none w-screen h-screen'
                : 'h-[580px] w-full relative'
            }`}
          >
            {/* Top Toolbar của Khung nhúng */}
            <div className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between text-xs border-b border-slate-700">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold">Phòng họp trực tuyến</span>
                <span className="font-mono bg-slate-900 text-emerald-400 px-2 py-0.5 rounded text-[11px]">
                  {formatTimer(elapsedSeconds)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openMeetingUrl(embeddedUrl)}
                  className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[11px] font-medium inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Mở thẻ mới
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreen((prev) => !prev)}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                  title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEmbedded(false);
                    setIsFullscreen(false);
                  }}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-semibold"
                >
                  Đóng nhúng
                </button>
              </div>
            </div>

            {/* Thẻ iframe Jitsi Meet */}
            <iframe
              src={embeddedUrl}
              title="UniNet Verification Jitsi Room"
              allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
              className="w-full h-[calc(100%-42px)] border-0"
            />
          </div>
        )}

        {/* Hướng dẫn quy trình & Checklist cho Verificator */}
        <div className="border-t border-slate-100 pt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Checklist thao tác xác minh
            </h4>
            <ul className="space-y-1.5 text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Yêu cầu trưởng nhóm bật webcam và đối chiếu khuôn mặt/thông tin sinh viên.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Đề nghị nhóm chia sẻ màn hình demo sản phẩm đang chạy thực tế.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Phỏng vấn các câu hỏi về mã nguồn, cấu trúc dữ liệu và mức độ đóng góp.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Ghi chú các phát hiện và bằng chứng quan trọng để lập báo cáo.</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              Quy tắc phòng họp & Vòng đời
            </h4>
            <div className="space-y-1 text-slate-600 leading-relaxed">
              <p>• <strong>Trước giờ hẹn:</strong> Cho phép khởi tạo phòng trước; nút bắt đầu bị khóa kèm đồng hồ đếm ngược.</p>
              <p>• <strong>Đến giờ hẹn:</strong> Nút "Bắt đầu và tham gia" tự động mở khóa và thực hiện trọn vẹn chuỗi kích hoạt.</p>
              <p>• <strong>Đã bắt đầu:</strong> Chuyển sang "Tham gia lại", hệ thống không gọi lệnh bắt đầu thêm lần nào.</p>
              <p>• <strong>Kết thúc:</strong> Xác nhận qua hộp thoại để chốt thời gian và mở khóa nộp báo cáo kết luận.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal xác nhận Kết thúc cuộc họp */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                <Square className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Xác nhận kết thúc buổi họp</h3>
                <p className="text-xs text-slate-500">
                  Bạn có chắc chắn muốn kết thúc buổi họp xác minh cho đề tài này?
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
              Sau khi kết thúc, thời điểm kết thúc sẽ được chốt chính thức trên hệ thống. Các nút tham gia phòng họp sẽ được ẩn và hệ thống sẽ mở quyền nộp báo cáo kết luận thẩm định cho bạn.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowEndConfirm(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void handleConfirmEndMeeting()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {actionLoading ? 'Đang kết thúc...' : 'Xác nhận Kết thúc'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationMeetingPanel;
