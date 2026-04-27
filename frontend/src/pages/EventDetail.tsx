// @TASK STITCH-DESIGN - EventDetail 페이지 이식 (Stitch event_detail_desktop/code.html 기반)
// @SPEC specs/screens/03_event_detail.yaml

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCouple } from '../context/CoupleContext';
import { getEvent, updateEvent } from '../services/event_api';
import { listPhotos, deletePhoto } from '../services/photo_api';
import { CATEGORY_LABELS } from '../constants/enums';
import PhotoUpload from '../components/PhotoUpload';
import PhotoGrid from '../components/PhotoGrid';
import Toast from '../components/Toast';
import type { Event, Photo, CaptionSource } from '../types';

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')} (${days[d.getDay()]})`;
}

interface ToastState { message: string; type: 'info' | 'success' | 'error'; }

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { couple } = useCouple();
  const coupleId = couple?.id ?? '';

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') =>
    setToast({ message, type }), []);
  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!coupleId || !eventId) return;
    let cancelled = false;
    setLoading(true);
    setPhotosLoading(true);
    setError(null);

    Promise.all([getEvent(coupleId, eventId), listPhotos(eventId)])
      .then(([evtData, photoData]) => {
        if (cancelled) return;
        setEvent(evtData);
        setMemo(evtData.memo ?? '');
        setPhotos(photoData);
      })
      .catch((err: { response?: { data?: { detail?: string } }; message?: string }) => {
        if (cancelled) return;
        setError(err.response?.data?.detail ?? err.message ?? '일정을 불러올 수 없습니다.');
      })
      .finally(() => {
        if (!cancelled) { setLoading(false); setPhotosLoading(false); }
      });

    return () => { cancelled = true; };
  }, [coupleId, eventId]);

  async function handleSave() {
    if (!event || !eventId) return;
    setSaving(true);
    try {
      const updated = await updateEvent(coupleId, eventId, {
        title: event.title, date: event.date, end_date: event.end_date, category: event.category, memo,
      });
      setEvent(updated);
      setMemo(updated.memo ?? '');
      showToast('저장되었습니다.', 'success');
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      showToast(e.response?.data?.detail ?? '저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleUploadSuccess(photo: Photo) {
    setPhotos((prev) => [...prev, photo]);
  }

  async function handleDeletePhoto(photoId: string) {
    try {
      await deletePhoto(photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      showToast('사진이 삭제되었습니다.', 'success');
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      showToast(e.response?.data?.detail ?? '삭제 중 오류가 발생했습니다.', 'error');
    }
  }

  function handleCaptionChange(photoId: string, caption: string, _source: CaptionSource) {
    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, caption } : p)));
  }

  // ── 로딩 ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div
          className="w-8 h-8 rounded-full border-[3px] border-outline-variant wl-spinner"
          style={{ borderTopColor: '#894f41' }}
          role="status"
          aria-label="로딩 중"
        />
        <style>{`@keyframes wl-spin { to { transform: rotate(360deg); } } .wl-spinner { animation: wl-spin 0.8s linear infinite; }`}</style>
      </div>
    );
  }

  // ── 에러 ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-error font-body-md text-body-md">{error}</p>
        <button
          className="px-6 py-2.5 font-body-sm text-body-sm text-on-surface border border-outline rounded hover:bg-surface-dim transition-colors"
          onClick={() => navigate('/calendar')}
        >
          캘린더로 돌아가기
        </button>
      </div>
    );
  }

  const categoryLabel = event ? (CATEGORY_LABELS[event.category] ?? event.category) : '';
  const dateLabel = (() => {
    if (!event) return '';
    const start = formatDate(event.date);
    if (!event.end_date || event.end_date === event.date) return start;
    const startD = new Date(event.date);
    const endD = new Date(event.end_date);
    if (startD.getFullYear() === endD.getFullYear() && startD.getMonth() === endD.getMonth()) {
      return `${start} ~ ${String(endD.getDate()).padStart(2, '0')}`;
    }
    return `${start} ~ ${formatDate(event.end_date)}`;
  })();

  return (
    <div className="flex flex-col pb-32">
      {/* 브레드크럼 + 뒤로가기 */}
      <div className="flex items-center gap-2 mb-10 text-on-surface-variant font-body-sm text-body-sm">
        <button
          className="hover:text-primary transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-dim"
          onClick={() => navigate('/calendar')}
          aria-label="캘린더로 돌아가기"
        >
          <span aria-hidden="true" className="text-[18px] leading-none">←</span>
        </button>
        <span className="text-[#B5AEA0]">캘린더</span>
      </div>

      {/* 이벤트 헤더 */}
      <header className="mb-12 border-b border-outline-variant pb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display-md text-display-md text-on-surface mb-4">
              {event?.title}
            </h1>
            <div className="flex items-center gap-4">
              <span className="font-mono-id text-mono-id text-on-surface-variant">{dateLabel}</span>
              <span className="px-2 py-1 border border-outline text-on-surface-variant rounded font-label-caps text-label-caps tracking-wider uppercase">
                {categoryLabel}
              </span>
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="flex gap-3">
            <button
              className="px-6 py-2.5 font-body-sm text-body-sm text-on-surface border border-outline rounded hover:bg-surface-dim transition-colors"
              onClick={() => navigate('/calendar')}
            >
              취소
            </button>
            <button
              className="px-8 py-2.5 font-body-sm text-body-sm text-white bg-on-surface rounded shadow-md hover:bg-on-surface-variant transition-colors disabled:opacity-60"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        </div>
      </header>

      {/* 메모 영역 */}
      <section className="mb-16">
        <label
          className="block font-label-caps text-label-caps text-on-surface-variant mb-4 uppercase"
          htmlFor="event-memo"
        >
          Memo
        </label>
        <textarea
          id="event-memo"
          className="w-full bg-transparent border-0 border-b border-outline focus:border-on-surface focus:ring-0 resize-none font-body-lg text-body-lg text-on-surface placeholder-on-surface-variant/50 leading-relaxed py-2 min-h-[160px] outline-none"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={6}
          maxLength={500}
          placeholder="오늘의 감상을 기록해보세요..."
        />
        <div className="text-right mt-1 font-label-caps text-label-caps text-on-surface-variant">
          {memo.length} / 500
        </div>
      </section>

      {/* 사진 섹션 */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <label className="font-label-caps text-label-caps text-on-surface-variant uppercase">
            Moments
          </label>
        </div>

        {/* 업로드 영역 */}
        <div className="mb-10">
          <PhotoUpload
            eventId={eventId ?? ''}
            onUploadSuccess={handleUploadSuccess}
            currentCount={photos.length}
          />
        </div>

        {/* 폴라로이드 그리드 */}
        {photosLoading ? (
          <div className="text-center py-8 font-body-sm text-on-surface-variant">사진 불러오는 중…</div>
        ) : (
          <PhotoGrid
            photos={photos}
            event={event ?? undefined}
            onDelete={handleDeletePhoto}
            onCaptionChange={handleCaptionChange}
          />
        )}
      </section>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />}
    </div>
  );
}
