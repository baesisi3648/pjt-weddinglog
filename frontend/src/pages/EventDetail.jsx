// @TASK P3-S1-T1 - EventDetail 페이지 API 연동
// @SPEC specs/screens/03_event_detail.yaml
// @TEST src/pages/EventDetail.test.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCouple } from '../context/CoupleContext';
import { getEvent, updateEvent } from '../services/event_api';
import { listPhotos, deletePhoto } from '../services/photo_api';
import { CATEGORY_LABELS } from '../constants/enums';
import PhotoUpload from '../components/PhotoUpload';
import PhotoGrid from '../components/PhotoGrid';
import Toast from '../components/Toast';

// ─── 스피너 ────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 64 }}>
      <div
        role="status"
        aria-label="로딩 중"
        style={{
          width: 32, height: 32,
          border: '3px solid var(--wl-line)',
          borderTopColor: 'var(--wl-coral)',
          borderRadius: '50%',
          animation: 'wl-spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes wl-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── 날짜 포맷 유틸 ─────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}. ${m}. ${day}`;
}

function formatDateLong(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

// ─── EventDetail ───────────────────────────────────────────────
export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { couple } = useCouple();
  const coupleId = couple?.id ?? '';

  // Event state
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Editable fields
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);

  // Photos state
  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(true);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = 'info') => setToast({ message, type }), []);
  const dismissToast = useCallback(() => setToast(null), []);

  // ─── 데이터 로드 ──────────────────────────────────────────────
  useEffect(() => {
    if (!coupleId || !eventId) return;
    let cancelled = false;

    setLoading(true);
    setPhotosLoading(true);
    setError(null);

    Promise.all([
      getEvent(coupleId, eventId),
      listPhotos(eventId),
    ])
      .then(([evtData, photoData]) => {
        if (cancelled) return;
        setEvent(evtData);
        setMemo(evtData.memo ?? '');
        setPhotos(photoData);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.detail ?? err.message ?? '일정을 불러올 수 없습니다.');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setPhotosLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [coupleId, eventId]);

  // ─── 저장 ─────────────────────────────────────────────────────
  async function handleSave() {
    if (!event) return;
    setSaving(true);
    try {
      const updated = await updateEvent(coupleId, eventId, {
        title: event.title,
        date: event.date,
        category: event.category,
        memo,
      });
      setEvent(updated);
      setMemo(updated.memo ?? '');
      showToast('저장되었습니다.', 'success');
    } catch (err) {
      showToast(err.response?.data?.detail ?? '저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  }

  // ─── 사진 업로드 성공 ─────────────────────────────────────────
  function handleUploadSuccess(photo) {
    setPhotos((prev) => [...prev, photo]);
  }

  // ─── 사진 삭제 ────────────────────────────────────────────────
  async function handleDeletePhoto(photoId) {
    try {
      await deletePhoto(photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      showToast('사진이 삭제되었습니다.', 'success');
    } catch (err) {
      showToast(err.response?.data?.detail ?? '삭제 중 오류가 발생했습니다.', 'error');
    }
  }

  // ─── 캡션 변경 ────────────────────────────────────────────────
  function handleCaptionChange(photoId, caption) {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, caption } : p))
    );
  }

  // ─── 완료 토글 ────────────────────────────────────────────────
  function handleToggleDone() {
    if (!event) return;
    setEvent((prev) => ({ ...prev, is_completed: !prev.is_completed }));
  }

  // ─── 렌더링 ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="wl-page">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="wl-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 48 }}>
        <p style={{ color: '#EF4444', fontSize: 15 }}>{error}</p>
        <button className="wl-btn wl-btn-ghost" onClick={() => navigate('/calendar')}>
          캘린더로 돌아가기
        </button>
      </div>
    );
  }

  const categoryLabel = event ? (CATEGORY_LABELS[event.category] ?? event.category) : '';
  const dateLabel = event ? formatDate(event.date) : '';
  const dateLongLabel = event ? formatDateLong(event.date) : '';

  return (
    <div className="wl-page">
      {/* Top bar */}
      <div className="wl-page-topbar">
        <button className="wl-icon-btn wl-back-btn" onClick={() => navigate('/calendar')}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>캘린더</span>
        </button>
        <div className="wl-page-crumbs">
          <span>{dateLabel.slice(0, 7)}</span>
          <span className="wl-crumb-sep">·</span>
          <span>{dateLongLabel}</span>
        </div>
        <div className="wl-page-actions">
          <button className="wl-btn wl-btn-ghost">공유</button>
          <button
            className="wl-btn wl-btn-primary wl-btn-sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>

      <div className="wl-page-body">
        {/* LEFT — Event info */}
        <aside className="wl-detail-left">
          <div className="wl-detail-card">
            <div className="wl-detail-head">
              <span className="wl-cat-pill wl-cat-photo">{categoryLabel}</span>
              <button
                className={`wl-toggle-done ${event?.is_completed ? 'is-on' : ''}`}
                onClick={handleToggleDone}
              >
                <span className={`wl-check wl-check-lg ${event?.is_completed ? 'is-checked' : ''}`}>
                  {event?.is_completed && (
                    <svg viewBox="0 0 14 14" width="11" height="11" aria-hidden="true">
                      <path d="M2 7.5L5.5 11L12 3.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span>{event?.is_completed ? '완료됨' : '완료 표시'}</span>
              </button>
            </div>

            <h1 className="wl-detail-title serif">{event?.title}</h1>

            <div className="wl-detail-meta">
              <div className="wl-meta-row">
                <div className="wl-meta-label">날짜</div>
                <div className="wl-meta-value">
                  <span className="wl-meta-strong">{dateLabel}</span>
                  <span className="wl-meta-dim">{dateLongLabel}</span>
                </div>
              </div>
              <div className="wl-meta-row">
                <div className="wl-meta-label">카테고리</div>
                <div className="wl-meta-value">
                  <span>{categoryLabel}</span>
                </div>
              </div>
            </div>

            <div className="wl-detail-memo">
              <label className="wl-field-label" htmlFor="event-memo">메모</label>
              <textarea
                id="event-memo"
                className="wl-textarea"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={5}
                maxLength={500}
                placeholder="메모를 입력하세요..."
              />
              <div className="wl-textarea-meta">
                <span>{memo.length} / 500</span>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT — Photos */}
        <main className="wl-detail-right">
          <div className="wl-section-head wl-section-head-plain">
            <div>
              <div className="wl-section-eyebrow">Photos</div>
              <h2 className="wl-section-title">사진 기록</h2>
            </div>
            <div className="wl-photos-summary">
              <span className="wl-photos-count">{photos.length}장</span>
            </div>
          </div>

          {/* 업로드 영역 */}
          <PhotoUpload
            eventId={eventId}
            onUploadSuccess={handleUploadSuccess}
            currentCount={photos.length}
          />

          {/* 사진 그리드 */}
          {photosLoading ? (
            <Spinner />
          ) : (
            <PhotoGrid
              photos={photos}
              event={event}
              onDelete={handleDeletePhoto}
              onCaptionChange={handleCaptionChange}
            />
          )}
        </main>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={dismissToast}
        />
      )}
    </div>
  );
}
