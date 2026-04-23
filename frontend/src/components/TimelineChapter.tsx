// @TASK P4-S1-T2 - TimelineChapter 컴포넌트
// @SPEC specs/screens/04_timeline.yaml#chapter_list
// @TEST src/components/TimelineChapter.test.tsx

import React, { useState } from 'react';
import { toggleSelection } from '../services/timeline_api';
import type { Chapter, TimelinePhoto } from '../types';

// 챕터 번호를 두 자리로 포맷
function padChapterNum(n: number | string): string {
  return String(n).padStart(2, '0');
}

interface InlineCaptionEditorProps {
  caption: string;
  photoId: string;
  onSave?: (photoId: string, value: string) => void;
}

/**
 * InlineCaptionEditor — 더블클릭 시 인라인 편집
 */
function InlineCaptionEditor({ caption, photoId, onSave }: InlineCaptionEditorProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(caption);

  if (editing) {
    return (
      <input
        className="wl-caption-input"
        value={value}
        autoFocus
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (onSave) onSave(photoId, value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setEditing(false);
            if (onSave) onSave(photoId, value);
          }
          if (e.key === 'Escape') {
            setValue(caption);
            setEditing(false);
          }
        }}
        style={{
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid #FF5533',
          outline: 'none',
          fontSize: '13px',
          width: '100%',
          color: '#374151',
          padding: '1px 2px',
        }}
      />
    );
  }

  return (
    <figcaption
      className="wl-tl-photo-cap"
      onDoubleClick={() => setEditing(true)}
      title="더블클릭으로 편집"
      style={{ cursor: 'text', minHeight: '20px' }}
    >
      {value || caption}
    </figcaption>
  );
}

interface PhotoCardProps {
  photo: TimelinePhoto;
  onToggle?: (photoId: string, newIsSelected: boolean) => void;
}

/**
 * PhotoCard — 개별 사진 카드 (체크박스 + 썸네일 + 캡션 + source 배지)
 */
function PhotoCard({ photo, onToggle }: PhotoCardProps) {
  const [isSelected, setIsSelected] = useState(photo.is_selected);
  const [pending, setPending] = useState(false);

  async function handleToggle() {
    if (pending) return;
    // optimistic UI
    setIsSelected((prev) => !prev);
    setPending(true);
    try {
      await toggleSelection(photo.id);
      if (onToggle) onToggle(photo.id, !isSelected);
    } catch {
      // 롤백
      setIsSelected((prev) => !prev);
    } finally {
      setPending(false);
    }
  }

  return (
    <figure
      className="wl-tl-photo-card"
      data-selected={String(isSelected)}
      style={{
        opacity: isSelected ? 1 : 0.5,
        transition: 'opacity 0.2s',
        position: 'relative',
      }}
    >
      {/* 썸네일 */}
      <div className="wl-tl-photo-thumb" style={{ position: 'relative' }}>
        <img
          src={photo.file_url}
          alt={photo.caption || '사진'}
          style={{
            width: '100%',
            aspectRatio: '1 / 1',
            objectFit: 'cover',
            borderRadius: '8px',
            display: 'block',
          }}
        />

        {/* 체크박스 */}
        <label
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            cursor: 'pointer',
            zIndex: 2,
          }}
          aria-label={isSelected ? '선택 해제' : '선택'}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleToggle}
            disabled={pending}
            style={{ width: '18px', height: '18px', accentColor: '#FF5533', cursor: 'pointer' }}
          />
        </label>

        {/* source 배지 */}
        {photo.source && (
          <span
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '9999px',
              background: photo.source === 'AI' ? '#EDE9FE' : '#FEF3C7',
              color: photo.source === 'AI' ? '#7C3AED' : '#B45309',
              lineHeight: 1.4,
            }}
          >
            {photo.source === 'AI' ? 'AI' : '템플릿'}
          </span>
        )}
      </div>

      {/* 캡션 (인라인 편집 지원) */}
      <InlineCaptionEditor caption={photo.caption || ''} photoId={photo.id} />
    </figure>
  );
}

interface TimelineChapterProps {
  chapter: Chapter;
  onSelectionChange?: (photoId: string, newIsSelected: boolean) => void;
  onToggleSelection?: (photoId: string) => Promise<void>;
  onCaptionChange?: (photoId: string, caption: string) => void;
}

/**
 * TimelineChapter — 챕터 카드 (북 메타포 디자인)
 */
export default function TimelineChapter({ chapter, onSelectionChange }: TimelineChapterProps) {
  const chapterNum = padChapterNum(chapter.chapter_number ?? chapter.id);

  return (
    <article className={`wl-chapter wl-chapter-${chapter.category?.toLowerCase() ?? ''}`}>
      {/* 챕터 헤더 */}
      <header className="wl-chapter-head" style={{ marginBottom: '20px' }}>
        <div className="wl-chapter-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span
            className="wl-chapter-big-num serif"
            style={{ fontFamily: 'Fraunces, serif', fontSize: '48px', fontWeight: 700, color: '#FF5533', lineHeight: 1 }}
          >
            {chapterNum}
          </span>
          <div>
            <h2
              className="wl-chapter-title serif"
              style={{ fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 600, color: '#111827', margin: 0 }}
            >
              {chapter.title}
            </h2>
            {chapter.subtitle && (
              <div
                className="wl-chapter-subtitle serif"
                style={{ fontFamily: 'Fraunces, serif', fontSize: '14px', color: '#6B7280', fontStyle: 'italic' }}
              >
                {chapter.subtitle}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* 날짜 범위 */}
          {chapter.date_range && (
            <span style={{ fontSize: '13px', color: '#9CA3AF' }}>{chapter.date_range}</span>
          )}
          {/* 사진 개수 배지 */}
          <span
            className="wl-chapter-count-pill"
            style={{
              background: '#FFE6DD',
              color: '#FF5533',
              fontSize: '13px',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: '9999px',
            }}
          >
            <span className="serif">{chapter.photo_count ?? chapter.photos?.length ?? 0}</span>
            <span>장의 사진</span>
          </span>
        </div>
      </header>

      {/* 사진 그리드 (모바일 2열, 데스크톱 3열) */}
      <div
        className="wl-chapter-photo-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
        }}
      >
        {(chapter.photos ?? []).map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onToggle={onSelectionChange}
          />
        ))}
      </div>
    </article>
  );
}
