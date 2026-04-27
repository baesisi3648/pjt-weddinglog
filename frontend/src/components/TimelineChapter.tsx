// @TASK STITCH-DESIGN - TimelineChapter 재작성 (Stitch timeline_desktop 구조)
// @SPEC specs/screens/04_timeline.yaml#chapter_list

import React, { useState } from 'react';
import { toggleSelection } from '../services/timeline_api';
import type { Chapter, TimelinePhoto } from '../types';
import { photoUrl } from '../utils/photo';

function padChapterNum(n: number | string): string {
  return String(n).padStart(2, '0');
}

interface PhotoCardProps {
  photo: TimelinePhoto;
  onToggle?: (photoId: string, newIsSelected: boolean) => void;
}

/**
 * PhotoCard — Polaroid 스타일 (Stitch timeline_desktop 기반)
 * 선택 여부 opacity 토글 + primary-container 체크박스
 */
function PhotoCard({ photo, onToggle }: PhotoCardProps) {
  const [isSelected, setIsSelected] = useState(photo.is_selected);
  const [pending, setPending] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState(photo.caption || '');

  async function handleToggle() {
    if (pending) return;
    const next = !isSelected;
    setIsSelected(next);
    setPending(true);
    try {
      await toggleSelection(photo.id);
      if (onToggle) onToggle(photo.id, next);
    } catch {
      setIsSelected(!next); // 롤백
    } finally {
      setPending(false);
    }
  }

  const rotations = ['rotate-1', '-rotate-2', 'rotate-2', '-rotate-1', 'rotate-1'];
  const rotClass = rotations[parseInt(photo.id.slice(-1), 16) % rotations.length] ?? 'rotate-1';

  return (
    <div
      className={`relative bg-white p-2 pb-8 shadow-[0_1px_3px_rgba(0,0,0,0.1),_0_8px_24px_rgba(0,0,0,0.05)] transform ${rotClass} transition-transform hover:z-10 hover:scale-105 duration-300 ${!isSelected ? 'opacity-40' : ''}`}
      data-selected={String(isSelected)}
    >
      {/* 체크박스 */}
      <div className="absolute top-4 right-4 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleToggle}
          disabled={pending}
          className="w-5 h-5 rounded-sm border-[#E3DBC8] cursor-pointer"
          style={{ accentColor: '#e89f8e' }}
          aria-label={isSelected ? '선택 해제' : '선택'}
        />
      </div>

      {/* 사진 */}
      <img
        src={photoUrl(photo.file_url)}
        alt={photo.caption || '사진'}
        className="w-full aspect-square object-cover mb-4 bg-surface-dim"
      />

      {/* 캡션 (더블클릭으로 인라인 편집) */}
      {editingCaption ? (
        <input
          type="text"
          value={captionDraft}
          onChange={(e) => setCaptionDraft(e.target.value)}
          onBlur={() => setEditingCaption(false)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingCaption(false); }}
          className="w-full text-[14px] text-center border-b border-outline focus:outline-none bg-transparent"
          autoFocus
        />
      ) : (
        <p
          className="font-display-md italic text-[14px] text-center text-on-surface-variant leading-tight cursor-text"
          style={{ fontFamily: 'Fraunces, serif' }}
          onDoubleClick={() => { setCaptionDraft(photo.caption || ''); setEditingCaption(true); }}
        >
          {isSelected
            ? (photo.caption || '')
            : <span className="line-through text-[#B5AEA0]">{photo.caption || ''}</span>
          }
        </p>
      )}

      {/* source 배지 (우측 상단 - 체크박스 아래) */}
      {photo.source && (
        <span
          className="absolute top-10 right-4 font-label-caps text-[10px] px-2 py-0.5 rounded-full"
          style={{
            background: photo.source === 'AI' ? '#e89f8e' : '#f6eddd',
            color: photo.source === 'AI' ? '#693529' : '#524340',
          }}
        >
          {photo.source === 'AI' ? '자동' : '템플릿'}
        </span>
      )}
    </div>
  );
}

interface TimelineChapterProps {
  chapter: Chapter;
  onSelectionChange?: (photoId: string, newIsSelected: boolean) => void;
  onToggleSelection?: (photoId: string) => Promise<void>;
  onCaptionChange?: (photoId: string, caption: string) => void;
}

/**
 * TimelineChapter — Stitch timeline_desktop 챕터 구조
 * 큰 챕터 번호 (80px) + 제목 + Polaroid 그리드
 */
export default function TimelineChapter({ chapter, onSelectionChange }: TimelineChapterProps) {
  const chapterNum = padChapterNum(chapter.chapter_number ?? chapter.id);
  const photoCount = chapter.photo_count ?? chapter.photos?.length ?? 0;

  return (
    <section className="mb-24" id={`chapter-${chapter.id}`}>
      {/* 챕터 헤더: 큰 번호 + 제목 */}
      <div className="flex items-baseline gap-6 mb-12">
        <span
          className="font-display-lg text-primary-container tracking-tight leading-none select-none"
          style={{ fontSize: '80px', fontWeight: 300, lineHeight: 1 }}
        >
          <span>{chapterNum}</span>
          <span aria-hidden="true">.</span>
        </span>
        <div>
          <h2
            className="font-display-md text-on-surface"
            style={{ fontSize: '28px' }}
          >
            {chapter.title}
            {photoCount > 0 && (
              <span className="ml-3 font-body-sm text-body-sm text-on-surface-variant">
                · {photoCount}장
              </span>
            )}
          </h2>
          {chapter.subtitle && (
            <p className="font-body-sm text-on-surface-variant italic mt-1">
              {chapter.subtitle}
            </p>
          )}
          {chapter.date_range && (
            <p className="font-mono-id text-mono-id text-on-surface-variant mt-1">
              {chapter.date_range}
            </p>
          )}
        </div>
      </div>

      {/* 사진 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {(chapter.photos ?? []).map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onToggle={onSelectionChange}
          />
        ))}
      </div>

      {chapter.photos?.length === 0 && (
        <div className="text-center py-12 text-on-surface-variant font-body-sm text-body-sm">
          이 챕터에 사진이 없습니다.
        </div>
      )}
    </section>
  );
}
