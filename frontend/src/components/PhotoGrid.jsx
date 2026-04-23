// @TASK P3-S1-T3 - PhotoGrid 컴포넌트
// @SPEC specs/screens/03_event_detail.yaml#photo_grid
// @TEST src/pages/EventDetail.test.jsx

import { useState } from 'react';
import CaptionSelector from './CaptionSelector';

const MAX_PHOTOS = 10;

/**
 * PhotoGrid — 업로드된 사진 그리드 뷰
 * @param {Array} photos - Photo[]
 * @param {object} event - 현재 이벤트 (AI 캡션 컨텍스트용)
 * @param {Function} onDelete - (photoId) => void
 * @param {Function} onCaptionChange - (photoId, caption) => void
 */
export default function PhotoGrid({ photos = [], event, onDelete, onCaptionChange }) {
  const [captionOpenId, setCaptionOpenId] = useState(null);

  function handleCaptionApply(photoId, caption, source) {
    onCaptionChange?.(photoId, caption);
    setCaptionOpenId(null);
  }

  return (
    <div>
      {/* 사진 개수 카운터 */}
      <div
        style={{
          fontSize: 13, color: 'var(--wl-ink-3)',
          marginBottom: 12, fontWeight: 500,
        }}
      >
        <span style={{ color: 'var(--wl-ink)', fontWeight: 700 }}>{photos.length}</span>
        {' / '}{MAX_PHOTOS}
      </div>

      <div className="wl-photo-grid">
        {photos.map((photo) => (
          <div key={photo.id} className="wl-photo-item">
            {/* 썸네일 */}
            <div className="wl-photo-thumb" style={{ position: 'relative', overflow: 'hidden', borderRadius: 8 }}>
              <img
                src={`/api/photos/${photo.id}/file`}
                alt={photo.caption || '사진'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                  // 이미지 로드 실패 시 플레이스홀더
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement.classList.add('wl-photo-thumb-fallback');
                }}
              />
              {/* 호버 오버레이 액션 */}
              <div className="wl-photo-actions">
                <button
                  className="wl-photo-action"
                  title="삭제"
                  type="button"
                  aria-label="사진 삭제"
                  onClick={() => onDelete?.(photo.id)}
                >
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M3 3.5h8M5.5 3.5V2.5h3v1M4 3.5l.5 7.5h5l.5-7.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 캡션 영역 */}
            <div style={{ marginTop: 6 }}>
              {/* 캡션 미리보기 (2줄 잘림) */}
              <div
                style={{
                  fontSize: 12, color: 'var(--wl-ink-2)',
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  lineHeight: 1.5, minHeight: '2.2em',
                  marginBottom: 4,
                }}
              >
                {photo.caption || (
                  <span style={{ color: 'var(--wl-ink-4)' }}>캡션 없음</span>
                )}
              </div>

              {/* AI 캡션 추천 버튼 */}
              <button
                className={`wl-ai-btn${captionOpenId === photo.id ? ' is-on' : ''}`}
                type="button"
                onClick={() => setCaptionOpenId(captionOpenId === photo.id ? null : photo.id)}
                style={{ fontSize: 11 }}
              >
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M7 2l1 2.5L10.5 5.5 8 6.5 7 9 6 6.5 3.5 5.5 6 4.5 7 2z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
                </svg>
                AI 캡션 추천
              </button>

              {/* CaptionSelector (인라인 확장) */}
              {captionOpenId === photo.id && event && (
                <CaptionSelector
                  photo={photo}
                  event={event}
                  onApply={(caption, source) => handleCaptionApply(photo.id, caption, source)}
                  onClose={() => setCaptionOpenId(null)}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
