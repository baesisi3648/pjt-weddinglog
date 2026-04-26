// @TASK AlbumEditor — 앨범 페이지 직접 편집
//   기능: 사진 교체 / 페이지 순서(위↑아래↓) / 템플릿 변경 / 페이지 추가·삭제
//   영상 원칙: 카드·아이콘 최소화, 코랄 강조 1색, 텍스트 라벨 위주.
import React, { useState } from 'react';
import type { AlbumLayout, AlbumPage, LayoutTemplate } from '../types/album';
import { LAYOUT_INFO } from '../types/album';
import type { Photo } from '../types/photo';

const TEMPLATES: LayoutTemplate[] = ['T1', 'T2', 'T3', 'T4', 'T5'];

interface Props {
  layout: AlbumLayout;
  photos: Photo[];
  onChange: (next: AlbumLayout) => void;
}

function getPhoto(photos: Photo[], id: string): Photo | undefined {
  return photos.find((p) => p.id === id);
}

// ─── 페이지 슬롯 (편집 모드) ────────────────────────────────────────────────
interface SlotProps {
  photoId: string | undefined;
  photos: Photo[];
  className?: string;
  onPick: () => void;
}

function PhotoSlotEditable({ photoId, photos, className = '', onPick }: SlotProps) {
  const photo = photoId ? getPhoto(photos, photoId) : undefined;
  return (
    <button
      type="button"
      onClick={onPick}
      className={`relative bg-bg-soft overflow-hidden flex items-center justify-center hover:opacity-90 transition-opacity group ${className}`}
      aria-label={photo?.caption || '사진 변경'}
    >
      {photo ? (
        <>
          <img
            src={photo.file_url}
            alt={photo.caption || ''}
            className="w-full h-full object-cover"
          />
          <span className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors flex items-center justify-center text-white text-[12px] opacity-0 group-hover:opacity-100">
            교체
          </span>
        </>
      ) : (
        <span className="text-ink-muted text-xs">사진 추가</span>
      )}
    </button>
  );
}

// ─── 페이지 렌더 (편집 모드) ───────────────────────────────────────────────
interface PageRendererProps {
  page: AlbumPage;
  photos: Photo[];
  onSlotPick: (slotIdx: number) => void;
}

function PageRenderer({ page, photos, onSlotPick }: PageRendererProps) {
  const ids = page.photo_ids;
  const slot = (i: number, cls: string) => (
    <PhotoSlotEditable
      photoId={ids[i]}
      photos={photos}
      className={cls}
      onPick={() => onSlotPick(i)}
    />
  );

  if (page.template === 'T1' || page.template === 'T5') {
    return <div className="w-full aspect-[4/3]">{slot(0, 'w-full h-full')}</div>;
  }
  if (page.template === 'T2') {
    return (
      <div className="flex gap-1 w-full aspect-[4/3]">
        {slot(0, 'flex-1 h-full')}
        {slot(1, 'flex-1 h-full')}
      </div>
    );
  }
  if (page.template === 'T3') {
    return (
      <div className="grid grid-cols-3 grid-rows-2 gap-1 w-full aspect-[4/3]">
        {slot(0, 'col-span-2 row-span-2 h-full')}
        {slot(1, 'h-full')}
        {slot(2, 'h-full')}
      </div>
    );
  }
  // T4
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full aspect-[4/3]">
      {slot(0, 'h-full')}
      {slot(1, 'h-full')}
      {slot(2, 'h-full')}
      {slot(3, 'h-full')}
    </div>
  );
}

// ─── 사진 선택 모달 ────────────────────────────────────────────────────────
interface PickerModalProps {
  photos: Photo[];
  onPick: (photoId: string) => void;
  onClose: () => void;
  currentId?: string;
}

function PhotoPickerModal({ photos, onPick, onClose, currentId }: PickerModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사진 선택"
      className="fixed inset-0 z-[1500] bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-bg w-full max-w-[960px] max-h-[85vh] overflow-hidden flex flex-col rounded">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h3 className="font-display-md text-[18px] text-ink">사진 선택</h3>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="text-ink-muted hover:text-ink text-[20px] leading-none"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto p-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {photos.map((p) => {
              const selected = currentId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onPick(p.id); onClose(); }}
                  className={`aspect-square overflow-hidden bg-bg-soft relative group ${
                    selected ? 'ring-2 ring-coral ring-offset-2 ring-offset-bg' : ''
                  }`}
                  aria-label={p.caption || '사진'}
                  aria-pressed={selected}
                >
                  <img
                    src={p.file_url}
                    alt={p.caption || ''}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {p.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-ink/70 text-white text-[10px] px-2 py-1 truncate text-left opacity-0 group-hover:opacity-100 transition-opacity">
                      {p.caption}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AlbumEditor 메인 ──────────────────────────────────────────────────────
export default function AlbumEditor({ layout, photos, onChange }: Props) {
  const [picker, setPicker] = useState<{
    chapterIdx: number;
    pageIdx: number;
    slotIdx: number;
    currentId?: string;
  } | null>(null);

  // 페이지 번호 재부여 (모든 변경 후 호출)
  function renumberPages(next: AlbumLayout): AlbumLayout {
    let totalPages = 0;
    let totalPhotos = 0;
    const chapters = next.chapters.map((ch) => {
      const pages = ch.pages.map((pg, i) => ({ ...pg, page_number: i + 1 }));
      totalPages += pages.length;
      totalPhotos += pages.reduce((acc, pg) => acc + pg.photo_ids.length, 0);
      return { ...ch, pages };
    });
    return { ...next, chapters, total_pages: totalPages, total_photos: totalPhotos };
  }

  // 사진 교체
  function replacePhoto(chapterIdx: number, pageIdx: number, slotIdx: number, newId: string) {
    const next = structuredClone(layout) as AlbumLayout;
    next.chapters[chapterIdx].pages[pageIdx].photo_ids[slotIdx] = newId;
    onChange(renumberPages(next));
  }

  // 페이지 위/아래 이동
  function movePage(chapterIdx: number, pageIdx: number, dir: -1 | 1) {
    const next = structuredClone(layout) as AlbumLayout;
    const pages = next.chapters[chapterIdx].pages;
    const target = pageIdx + dir;
    if (target < 0 || target >= pages.length) return;
    [pages[pageIdx], pages[target]] = [pages[target], pages[pageIdx]];
    onChange(renumberPages(next));
  }

  // 템플릿 변경
  function changeTemplate(chapterIdx: number, pageIdx: number, newTemplate: LayoutTemplate) {
    const next = structuredClone(layout) as AlbumLayout;
    const page = next.chapters[chapterIdx].pages[pageIdx];
    const targetCount = LAYOUT_INFO[newTemplate].photoCount;
    let ids = [...page.photo_ids];
    if (ids.length < targetCount) {
      // 부족하면 첫 사진을 복제(없으면 챕터 다른 페이지에서)해서 채움.
      const fallback = ids[0] ?? next.chapters[chapterIdx].pages.flatMap((p) => p.photo_ids)[0];
      while (ids.length < targetCount && fallback) ids.push(fallback);
    } else if (ids.length > targetCount) {
      ids = ids.slice(0, targetCount);
    }
    page.template = newTemplate;
    page.photo_ids = ids;
    onChange(renumberPages(next));
  }

  // 페이지 삭제
  function deletePage(chapterIdx: number, pageIdx: number) {
    const next = structuredClone(layout) as AlbumLayout;
    next.chapters[chapterIdx].pages.splice(pageIdx, 1);
    onChange(renumberPages(next));
  }

  // 페이지 추가 (해당 챕터 끝에 T1 1장)
  function addPage(chapterIdx: number) {
    const next = structuredClone(layout) as AlbumLayout;
    const ch = next.chapters[chapterIdx];
    // 첫 사진을 가져와 placeholder 로 사용
    const fallback = ch.pages.flatMap((p) => p.photo_ids)[0];
    if (!fallback) return;
    ch.pages.push({
      page_number: ch.pages.length + 1,
      template: 'T1',
      photo_ids: [fallback],
      caption: null,
    });
    onChange(renumberPages(next));
  }

  // 챕터 위/아래 이동
  function moveChapter(chapterIdx: number, dir: -1 | 1) {
    const next = structuredClone(layout) as AlbumLayout;
    const target = chapterIdx + dir;
    if (target < 0 || target >= next.chapters.length) return;
    [next.chapters[chapterIdx], next.chapters[target]] = [next.chapters[target], next.chapters[chapterIdx]];
    // chapter_number 도 재부여
    next.chapters = next.chapters.map((ch, i) => ({ ...ch, chapter_number: i + 1 }));
    onChange(renumberPages(next));
  }

  return (
    <div
      className="flex flex-col gap-6"
      role="region"
      aria-label="앨범 편집"
    >
      {layout.chapters.map((chapter, chIdx) => (
        <section key={`${chIdx}-${chapter.title}`} className="flex flex-col gap-3">
          {/* 챕터 헤더 */}
          <div className="flex items-baseline justify-between border-b border-line pb-2">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[10px] tracking-[0.15em] text-coral">
                CH.{String(chapter.chapter_number).padStart(2, '0')}
              </span>
              <h3 className="font-display-md text-[18px] text-ink">{chapter.title}</h3>
              <span className="text-[12px] text-ink-muted">
                {chapter.pages.length}페이지
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => moveChapter(chIdx, -1)}
                disabled={chIdx === 0}
                aria-label="챕터 위로"
                className="px-2 py-1 text-[12px] text-ink-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ↑
              </button>
              <button
                onClick={() => moveChapter(chIdx, 1)}
                disabled={chIdx === layout.chapters.length - 1}
                aria-label="챕터 아래로"
                className="px-2 py-1 text-[12px] text-ink-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ↓
              </button>
            </div>
          </div>

          {/* 페이지 목록 */}
          <div className="flex flex-col gap-3">
            {chapter.pages.map((page, pgIdx) => (
              <div
                key={pgIdx}
                className="border border-line bg-bg flex flex-col"
              >
                {/* 페이지 컨트롤바 */}
                <div className="px-3 py-2 flex items-center justify-between border-b border-line text-[12px]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-ink-muted">P.{page.page_number}</span>
                    <select
                      value={page.template}
                      onChange={(e) => changeTemplate(chIdx, pgIdx, e.target.value as LayoutTemplate)}
                      className="bg-bg border border-line px-2 py-1 text-[11px] text-ink focus:outline-none focus:border-coral"
                      aria-label="레이아웃 템플릿"
                    >
                      {TEMPLATES.map((t) => (
                        <option key={t} value={t}>
                          {t} · {LAYOUT_INFO[t].name} ({LAYOUT_INFO[t].photoCount}장)
                        </option>
                      ))}
                    </select>
                    {page.caption && (
                      <span className="italic text-ink-muted truncate max-w-[180px]">
                        {page.caption}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => movePage(chIdx, pgIdx, -1)}
                      disabled={pgIdx === 0}
                      aria-label="페이지 위로"
                      className="px-2 py-0.5 text-ink-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => movePage(chIdx, pgIdx, 1)}
                      disabled={pgIdx === chapter.pages.length - 1}
                      aria-label="페이지 아래로"
                      className="px-2 py-0.5 text-ink-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => deletePage(chIdx, pgIdx)}
                      aria-label="페이지 삭제"
                      className="px-2 py-0.5 text-ink-muted hover:text-coral"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                {/* 페이지 본문 */}
                <div className="p-2">
                  <PageRenderer
                    page={page}
                    photos={photos}
                    onSlotPick={(slotIdx) =>
                      setPicker({
                        chapterIdx: chIdx,
                        pageIdx: pgIdx,
                        slotIdx,
                        currentId: page.photo_ids[slotIdx],
                      })
                    }
                  />
                </div>
              </div>
            ))}

            {/* 페이지 추가 */}
            <button
              type="button"
              onClick={() => addPage(chIdx)}
              className="border border-dashed border-line py-3 text-[13px] text-ink-muted hover:text-coral hover:border-coral transition-colors"
            >
              + 이 챕터에 빈 페이지 추가
            </button>
          </div>
        </section>
      ))}

      {/* 사진 선택 모달 */}
      {picker && (
        <PhotoPickerModal
          photos={photos}
          currentId={picker.currentId}
          onPick={(id) => replacePhoto(picker.chapterIdx, picker.pageIdx, picker.slotIdx, id)}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
