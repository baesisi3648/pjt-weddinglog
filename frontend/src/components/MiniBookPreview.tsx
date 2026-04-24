// @TASK P5-FRONTEND - MiniBookPreview 컴포넌트
// @SPEC docs/planning/06-tasks.md#Phase5

import React from 'react';
import type { AlbumLayout, AlbumPage, LayoutTemplate } from '../types/album';
import { LAYOUT_INFO } from '../types/album';
import type { Photo } from '../types/photo';

interface Props {
  layout: AlbumLayout;
  photos: Photo[];
  editable?: boolean;
}

const CHAPTER_COLORS: Record<string, { bg: string; text: string }> = {
  coral:    { bg: '#fce8e3', text: '#8b3626' },
  lavender: { bg: '#ede8f7', text: '#4a3f7a' },
  mint:     { bg: '#e4f4ee', text: '#2d6e52' },
  gold:     { bg: '#fdf4e0', text: '#7a5c1a' },
  gray:     { bg: '#efefef', text: '#4a4a4a' },
};

function getPhoto(photos: Photo[], id: string): Photo | undefined {
  return photos.find((p) => p.id === id);
}

interface PhotoSlotProps {
  photoId: string | undefined;
  photos: Photo[];
  className?: string;
  alt?: string;
}

function PhotoSlot({ photoId, photos, className = '', alt = '' }: PhotoSlotProps) {
  const photo = photoId ? getPhoto(photos, photoId) : undefined;
  return (
    <div className={`bg-surface-variant overflow-hidden flex items-center justify-center ${className}`}>
      {photo ? (
        <img
          src={photo.file_url}
          alt={alt || `photo-${photoId}`}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-outline-variant text-xs">—</span>
      )}
    </div>
  );
}

interface PageRendererProps {
  page: AlbumPage;
  photos: Photo[];
}

function PageRenderer({ page, photos }: PageRendererProps) {
  const template: LayoutTemplate = page.template;
  const ids = page.photo_ids;

  if (template === 'T1') {
    return (
      <div className="w-full aspect-[4/3]">
        <PhotoSlot photoId={ids[0]} photos={photos} className="w-full h-full" alt="page-main" />
      </div>
    );
  }

  if (template === 'T2') {
    return (
      <div className="flex gap-1 w-full aspect-[4/3]">
        <PhotoSlot photoId={ids[0]} photos={photos} className="flex-1 h-full" />
        <PhotoSlot photoId={ids[1]} photos={photos} className="flex-1 h-full" />
      </div>
    );
  }

  if (template === 'T3') {
    return (
      <div className="grid grid-cols-3 gap-1 w-full aspect-[4/3]">
        <PhotoSlot photoId={ids[0]} photos={photos} className="col-span-2 row-span-2 h-full" />
        <PhotoSlot photoId={ids[1]} photos={photos} className="h-full" />
        <PhotoSlot photoId={ids[2]} photos={photos} className="h-full" />
      </div>
    );
  }

  if (template === 'T4') {
    return (
      <div className="grid grid-cols-2 gap-1 w-full aspect-[4/3]">
        <PhotoSlot photoId={ids[0]} photos={photos} className="h-full" />
        <PhotoSlot photoId={ids[1]} photos={photos} className="h-full" />
        <PhotoSlot photoId={ids[2]} photos={photos} className="h-full" />
        <PhotoSlot photoId={ids[3]} photos={photos} className="h-full" />
      </div>
    );
  }

  // T5 Cover — 챕터 표지는 ChapterBand에서 처리하므로 여기서는 심플 뷰
  return (
    <div className="w-full aspect-[4/3] relative">
      <PhotoSlot photoId={ids[0]} photos={photos} className="w-full h-full" />
      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
        <span className="text-white font-medium text-sm">{page.caption ?? 'Cover'}</span>
      </div>
    </div>
  );
}

export default function MiniBookPreview({ layout, photos }: Props) {
  return (
    <div
      className="flex flex-col gap-4 overflow-y-auto max-h-[60vh] pr-1"
      role="region"
      aria-label="앨범 미리보기"
    >
      {layout.chapters.map((chapter) => {
        const colorStyle = CHAPTER_COLORS[chapter.color] ?? CHAPTER_COLORS.gray;
        return (
          <div key={chapter.chapter_number} className="flex flex-col gap-2">
            {/* 챕터 타이틀 띠 */}
            <div
              className="px-4 py-2 rounded flex items-center gap-2"
              style={{ background: colorStyle.bg }}
            >
              <span
                className="font-mono text-xs opacity-60"
                style={{ color: colorStyle.text }}
              >
                CH.{String(chapter.chapter_number).padStart(2, '0')}
              </span>
              <span
                className="font-medium text-sm"
                style={{ color: colorStyle.text, fontFamily: 'Fraunces, serif' }}
              >
                {chapter.title}
              </span>
            </div>

            {/* 페이지 목록 */}
            {chapter.pages.map((page) => {
              const info = LAYOUT_INFO[page.template];
              return (
                <div
                  key={page.page_number}
                  className="border border-outline-variant rounded overflow-hidden"
                >
                  {/* 페이지 메타 헤더 */}
                  <div className="bg-surface-variant/50 px-3 py-1 flex items-center gap-2 border-b border-outline-variant">
                    <span className="font-mono text-[10px] text-outline">
                      Page {page.page_number}
                    </span>
                    <span className="text-[10px] text-outline-variant">·</span>
                    <span className="text-[10px] text-on-surface-variant">
                      {info.name}
                    </span>
                    {page.caption && (
                      <>
                        <span className="text-[10px] text-outline-variant">·</span>
                        <span className="text-[10px] text-on-surface-variant italic truncate max-w-[120px]">
                          {page.caption}
                        </span>
                      </>
                    )}
                  </div>

                  {/* 페이지 렌더링 */}
                  <div className="p-2 bg-surface">
                    <PageRenderer page={page} photos={photos} />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
