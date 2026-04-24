// @TASK STITCH-DESIGN - PhotoGrid Polaroid 스타일 (event_detail_desktop 기반)
// @SPEC specs/screens/03_event_detail.yaml#photo_grid

import { useState } from 'react';
import CaptionSelector from './CaptionSelector';
import type { Photo, Event, CaptionSource } from '../types';

const MAX_PHOTOS = 10;

interface PhotoGridProps {
  photos?: Photo[];
  event?: Event;
  onDelete: (photoId: string) => void;
  onCaptionChange: (photoId: string, caption: string, source: CaptionSource) => void;
}

const POLAROID_ROTATIONS = ['-rotate-2', 'rotate-1', 'rotate-2', '-rotate-1', 'rotate-1', '-rotate-2'];

export default function PhotoGrid({ photos = [], event, onDelete, onCaptionChange }: PhotoGridProps) {
  const [captionOpenId, setCaptionOpenId] = useState<string | null>(null);

  function handleCaptionApply(photoId: string, caption: string, source: CaptionSource) {
    onCaptionChange?.(photoId, caption, source);
    setCaptionOpenId(null);
  }

  return (
    <div>
      {/* 사진 개수 */}
      <div className="font-label-caps text-label-caps text-on-surface-variant mb-6 uppercase">
        {photos.length} / {MAX_PHOTOS}장
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {photos.map((photo, idx) => {
          const rotClass = POLAROID_ROTATIONS[idx % POLAROID_ROTATIONS.length] ?? '';
          const isAI = (photo as unknown as { source?: string }).source === 'AI';

          return (
            <div key={photo.id} className="relative group">
              {/* Polaroid 프레임 */}
              <div className={`polaroid-frame ${rotClass}`}>
                <img
                  src={`/api/photos/${photo.id}/file`}
                  alt={photo.caption || '사진'}
                  className="w-full aspect-square object-cover bg-surface-dim"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.style.background = '#f0e7d8';
                      parent.style.minHeight = '120px';
                    }
                  }}
                />
                {photo.caption && (
                  <div className="polaroid-caption">{photo.caption}</div>
                )}

                {/* 호버 삭제 버튼 */}
                <button
                  className="absolute -top-3 -right-3 bg-surface border border-outline-variant w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity hover:text-error hover:border-error shadow-sm z-10"
                  type="button"
                  aria-label="사진 삭제"
                  title="삭제"
                  onClick={() => onDelete?.(photo.id)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                </button>
              </div>

              {/* AI 캡션 액션 */}
              <div className="mt-4 flex items-center justify-between px-2">
                <button
                  className="text-primary font-body-sm text-body-sm hover:underline flex items-center gap-1"
                  type="button"
                  onClick={() => setCaptionOpenId(captionOpenId === photo.id ? null : photo.id)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>auto_awesome</span>
                  AI 캡션 추천
                </button>
                <div className="flex items-center gap-1.5 font-label-caps text-[10px] text-on-surface-variant">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: isAI ? '#e89f8e' : '#d7c2bd' }}
                  />
                  {isAI ? 'AI 생성' : '기본 템플릿'}
                </div>
              </div>

              {/* CaptionSelector */}
              {captionOpenId === photo.id && event && (
                <div className="mt-2 px-2">
                  <CaptionSelector
                    photo={photo}
                    event={event}
                    onApply={(caption, source) => handleCaptionApply(photo.id, caption, source)}
                    onClose={() => setCaptionOpenId(null)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
