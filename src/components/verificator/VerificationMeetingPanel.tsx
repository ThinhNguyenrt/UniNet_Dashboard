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
} from 'lucide-react';
import {
  verificatorMeetingService,
  parseMeetingErrorMessage,
  getMeetingLifecycleStatus,
  formatMeetingDuration,
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
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Chế độ nhúng video trực tiếp trên giao diện
  const [isEmbedded, setIsEmbedded] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [embeddedUrl, setEmbeddedUrl] = useState<string | null>(initialMeeting?.joinUrl || null);

  // Mốc thời gian hiện tại để cập nhật live timer
  const [now, setNow] = useState<number>(() => Date.now());

  // Modal xác nhận kết thúc cuộc họp
  const [showEndConfirm, setShowEndConfirm] = useState<boolean>(false);

  // Tải thông tin phòng họp
  const loadMeeting = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await verificatorMeetingService.getMeeting(assignmentId);
      setMeeting(data);
      if (data.joinUrl) {
        setEmbeddedUrl(data.joinUrl);
      }
      onMeetingUpdated?.(data);
    } catch (err) {
      setError(parseMeetingErrorMessage(err, 'Chưa thể tải dữ liệu phòng họp.'));
    } finally {
      setLoading(false);
    }
  }, [assignmentId, onMeetingUpdated]);

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

  // Cập nhật mốc thời gian mỗi giây khi cuộc họp đang diễn ra
  useEffect(() => {
    if (lifecycle !== 'InProgress') return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [lifecycle]);

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

  // Thao tác: Tạo hoặc lấy phòng họp
  const handleCreateMeeting = async () => {
    setActionLoading(true);
    setError(null);
    setNotice(null);
    try {
      const data = await verificatorMeetingService.createOrGetMeeting(assignmentId);
      setMeeting(data);
      if (data.joinUrl) {
        setEmbeddedUrl(data.joinUrl);
      }
      onMeetingUpdated?.(data);
      setNotice({ type: 'success', text: 'Khởi tạo phòng họp xác minh trực tuyến thành công.' });
    } catch (err) {
      setError(parseMeetingErrorMessage(err, 'Không thể khởi tạo phòng họp xác minh.'));
    } finally {
      setActionLoading(false);
    }
  };

  // Thao tác: Lấy link và tham gia
  const handleJoinMeeting = async (openExternal = true) => {
    setActionLoading(true);
    setError(null);
    setNotice(null);
    try {
      const joinData = await verificatorMeetingService.joinMeeting(assignmentId);
      if (joinData.joinUrl) {
        setEmbeddedUrl(joinData.joinUrl);
        if (openExternal) {
          window.open(joinData.joinUrl, '_blank', 'noopener,noreferrer');
          setNotice({
            type: 'info',
            text: 'Đã mở phòng họp trong thẻ mới. Bạn có thể bật camera/microphone để bắt đầu trao đổi.',
          });
        } else {
          setIsEmbedded(true);
        }
      } else {
        throw new Error('Máy chủ không trả về liên kết tham gia phòng họp.');
      }
    } catch (err) {
      setError(parseMeetingErrorMessage(err, 'Không thể tham gia phòng họp.'));
    } finally {
      setActionLoading(false);
    }
  };

  // Thao tác: Bắt đầu cuộc họp
  const handleStartMeeting = async () => {
    setActionLoading(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await verificatorMeetingService.startMeeting(assignmentId);
      setMeeting(updated);
      onMeetingUpdated?.(updated);
      setNotice({ type: 'success', text: 'Đã bắt đầu buổi họp xác minh. Đồng hồ thời gian đã kích hoạt.' });
    } catch (err) {
      setError(parseMeetingErrorMessage(err, 'Không thể ghi nhận bắt đầu cuộc họp.'));
    } finally {
      setActionLoading(false);
    }
  };

  // Thao tác: Xác nhận kết thúc cuộc họp
  const handleConfirmEndMeeting = async () => {
    setShowEndConfirm(false);
    setActionLoading(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await verificatorMeetingService.endMeeting(assignmentId);
      setMeeting(updated);
      setIsEmbedded(false);
      onMeetingUpdated?.(updated);
      setNotice({
        type: 'success',
        text: 'Buổi họp xác minh đã kết thúc thành công! Bạn hiện đã có thể nộp báo cáo kết luận.',
      });
    } catch (err) {
      setError(parseMeetingErrorMessage(err, 'Không thể ghi nhận kết thúc cuộc họp.'));
    } finally {
      setActionLoading(false);
    }
  };

  const copyJoinLink = () => {
    if (!meeting?.joinUrl && !embeddedUrl) return;
    const url = meeting?.joinUrl || embeddedUrl || '';
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
            {lifecycle === 'Ready' && (
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200 inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                Phòng họp sẵn sàng
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
              onClick={() => void loadMeeting()}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition"
              title="Làm mới trạng thái cuộc họp"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

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
              <p className="text-[11px] text-emerald-600 font-medium">Thời gian diễn ra: {formatTimer(elapsedSeconds)}</p>
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
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-700">Điều khiển buổi họp trực tuyến</span>
              <p className="text-[11px] text-slate-500">
                {lifecycle === 'NotCreated' && 'Hãy nhấn Khởi tạo phòng họp để cấp phát phòng họp trực tuyến Jitsi.'}
                {lifecycle === 'Ready' && 'Phòng đã sẵn sàng. Bạn có thể tham gia và bấm Bắt đầu cuộc họp khi nhóm tham dự.'}
                {lifecycle === 'InProgress' && 'Buổi họp đang diễn ra. Bấm Kết thúc sau khi phỏng vấn xong.'}
                {lifecycle === 'Completed' && 'Buổi họp đã kết thúc. Bạn có thể tiến hành nộp báo cáo kết luận thẩm định.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Nút 1: Khởi tạo phòng nếu chưa có */}
              {lifecycle === 'NotCreated' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => void handleCreateMeeting()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition disabled:opacity-50"
                >
                  <Video className="w-4 h-4" />
                  {actionLoading ? 'Đang tạo phòng...' : 'Khởi tạo phòng họp'}
                </button>
              )}

              {/* Nút 2: Tham gia phòng (Mở tab mới) */}
              {lifecycle !== 'NotCreated' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => void handleJoinMeeting(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition disabled:opacity-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  Tham gia phòng họp (Thẻ mới)
                </button>
              )}

              {/* Nút 3: Bật/tắt chế độ nhúng trực tiếp */}
              {lifecycle !== 'NotCreated' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => {
                    if (!isEmbedded && (!embeddedUrl || embeddedUrl === '')) {
                      void handleJoinMeeting(false);
                    } else {
                      setIsEmbedded((prev) => !prev);
                    }
                  }}
                  className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition"
                >
                  <Tv className="w-3.5 h-3.5 text-blue-600" />
                  {isEmbedded ? 'Đóng khung nhúng' : 'Xem nhúng tại trang'}
                </button>
              )}

              {/* Nút 4: Bắt đầu cuộc họp */}
              {lifecycle === 'Ready' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => void handleStartMeeting()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  {actionLoading ? 'Đang xử lý...' : 'Bắt đầu cuộc họp'}
                </button>
              )}

              {/* Nút 5: Kết thúc cuộc họp */}
              {lifecycle === 'InProgress' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setShowEndConfirm(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition disabled:opacity-50"
                >
                  <Square className="w-4 h-4" />
                  Kết thúc cuộc họp
                </button>
              )}

              {/* Nút 6: Nút chuyển sang nộp báo cáo khi đã kết thúc */}
              {lifecycle === 'Completed' && onNavigateToReport && (
                <button
                  type="button"
                  onClick={onNavigateToReport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition"
                >
                  <FileCheck className="w-4 h-4" />
                  Chuyển sang Báo cáo Thẩm định
                </button>
              )}
            </div>
          </div>

          {/* Hộp chia sẻ liên kết phòng họp (nếu có) */}
          {(meeting?.joinUrl || embeddedUrl) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-900">
              <span className="font-medium">Liên kết phòng họp đã được cấu hình sẵn sàng cho buổi thẩm định.</span>
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
        </div>

        {/* Khung nhúng Jitsi Video Call trực tiếp */}
        {isEmbedded && embeddedUrl && (
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
                {lifecycle === 'InProgress' && (
                  <span className="font-mono bg-slate-900 text-emerald-400 px-2 py-0.5 rounded text-[11px]">
                    {formatTimer(elapsedSeconds)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.open(embeddedUrl, '_blank', 'noopener,noreferrer')}
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
              Quy định hệ thống
            </h4>
            <div className="space-y-1 text-slate-600 leading-relaxed">
              <p>• Phải khởi tạo phòng họp trước khi có thể tham gia hoặc ghi nhận bắt đầu.</p>
              <p>• Phải bấm <strong>Bắt đầu</strong> và <strong>Kết thúc</strong> buổi họp xác minh để hệ thống mở khóa chức năng nộp báo cáo thẩm định.</p>
              <p>• Thời gian họp thực tế sẽ được lưu lại làm cơ sở nghiệm thu quy trình thẩm định.</p>
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

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
              Sau khi kết thúc, thời điểm kết thúc sẽ được chốt trên hệ thống và bạn có thể chuyển ngay sang bước điền báo cáo kết luận thẩm định.
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
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50"
              >
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
