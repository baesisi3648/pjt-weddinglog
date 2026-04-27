// @TASK BookPreviewModal — 양면 펼침 책 미리보기 (react-pageflip)
//   각 챕터 페이지를 책 한 장씩으로 펼치고, spread (좌+우) 형태로 넘긴다.
import React, { forwardRef, useMemo } from 'react';
import HTMLFlipBook from 'react-pageflip';
import type { AlbumLayout, AlbumPage } from '../types/album';
import type { Photo } from '../types/photo';
import BlessingsPage from './BlessingsPage';

// 가로 앨범(landscape) — 결혼 양장본 정통 비율 (3:2).
// 양면 펼침 시 1080 x 360, 데스크톱 1280px 컨테이너에서 자연스럽게 fit.
const PAGE_W = 540;
const PAGE_H = 380;

interface Props {
  layout: AlbumLayout;
  photos: Photo[];
  /** 축하 메시지 페이지 메인 사진 (사용자가 교체했으면 그 URL, 아니면 기본값 사용) */
  blessingMainPhoto?: string;
  onClose: () => void;
}

function getPhoto(photos: Photo[], id: string): Photo | undefined {
  return photos.find((p) => p.id === id);
}

// ─── 페이지 1장 (책 1면) ───────────────────────────────────────────────────
const PageView = forwardRef<
  HTMLDivElement,
  { children?: React.ReactNode; className?: string }
>(function PageView({ children, className = '' }, ref) {
  return (
    <div
      ref={ref}
      className={`bg-bg ${className}`}
      style={{ width: PAGE_W, height: PAGE_H }}
    >
      {children}
    </div>
  );
});

function PhotoSlot({ id, photos, className = '' }: { id: string | undefined; photos: Photo[]; className?: string }) {
  const p = id ? getPhoto(photos, id) : undefined;
  return (
    <div className={`bg-bg overflow-hidden flex items-center justify-center ${className}`}>
      {p ? (
        <img src={p.file_url} alt={p.caption ?? ''} className="w-full h-full object-contain" />
      ) : null}
    </div>
  );
}

function ChapterCoverPage({
  chapterNumber,
  chapterTitle,
}: {
  chapterNumber: number;
  chapterTitle: string;
}) {
  // 챕터 인트로 — 글만, 가운데 정렬, 흰 바탕. 가로 페이지 비율에 맞춰 컴팩트.
  return (
    <div className="w-full h-full px-6 py-8 flex flex-col justify-center items-center bg-bg text-center">
      <div className="font-mono text-[9px] tracking-[0.3em] text-coral mb-5">
        CHAPTER · {String(chapterNumber).padStart(2, '0')}
      </div>
      <div className="w-10 h-px bg-coral mb-5" />
      <h2
        className="font-display-md text-[20px] leading-[1.3] text-ink max-w-[240px]"
        style={{ fontFamily: 'Fraunces, serif', fontWeight: 400, wordBreak: 'keep-all' }}
      >
        {chapterTitle}
      </h2>
    </div>
  );
}

function AlbumPageContent({ page, photos }: { page: AlbumPage; photos: Photo[] }) {
  const ids = page.photo_ids;
  const slot = (i: number, cls: string) => <PhotoSlot id={ids[i]} photos={photos} className={cls} />;

  if (page.template === 'T1') {
    // 1장 풀 페이지 — 사진 비율 유지(contain), 위아래 여백, 하단 캡션.
    return (
      <div className="w-full h-full p-6 flex flex-col bg-bg">
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          {slot(0, 'w-full h-full')}
        </div>
        {page.caption && (
          <p className="mt-4 text-[12px] text-ink-muted text-center italic truncate"
             style={{ fontFamily: 'Fraunces, serif' }}>
            {page.caption}
          </p>
        )}
      </div>
    );
  }
  if (page.template === 'T2') {
    return (
      <div className="w-full h-full p-3">
        <div className="flex gap-2 w-full h-full">
          {slot(0, 'flex-1 h-full')}
          {slot(1, 'flex-1 h-full')}
        </div>
      </div>
    );
  }
  if (page.template === 'T3') {
    return (
      <div className="w-full h-full p-3">
        <div className="grid grid-cols-3 grid-rows-2 gap-2 w-full h-full">
          {slot(0, 'col-span-2 row-span-2 h-full')}
          {slot(1, 'h-full')}
          {slot(2, 'h-full')}
        </div>
      </div>
    );
  }
  // T4
  return (
    <div className="w-full h-full p-3">
      <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full h-full">
        {slot(0, 'h-full')}
        {slot(1, 'h-full')}
        {slot(2, 'h-full')}
        {slot(3, 'h-full')}
      </div>
    </div>
  );
}

// 책 평탄화 항목 타입
type BookItem =
  | { kind: 'cover'; chapterNumber: number; chapterTitle: string }
  | { kind: 'page'; page: AlbumPage };

// ─── 메인 모달 ────────────────────────────────────────────────────────────
export default function BookPreviewModal({ layout, photos, blessingMainPhoto, onClose }: Props) {
  // 책 페이지 평탄화 — 빈 페이지 패리티 제거.
  // 챕터 인트로 페이지가 좌측에 와도 가운데 정렬 디자인이라 자연스럽고,
  // BlessingsPage 직후 P.1 이 같은 spread 에서 바로 보이도록.
  const flatPages = useMemo(() => {
    const out: BookItem[] = [];
    for (const ch of layout.chapters) {
      if (!ch.pages.length) continue;
      out.push({
        kind: 'cover',
        chapterNumber: ch.chapter_number,
        chapterTitle: ch.title,
      });
      // 첫 페이지(=원래 T5 cover)는 챕터 인트로 페이지로 대체했으므로 본문은 [1:] 부터.
      for (const pg of ch.pages.slice(1)) {
        out.push({ kind: 'page', page: pg });
      }
    }
    return out;
  }, [layout]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="앨범 책 미리보기"
      className="fixed inset-0 z-[1500] bg-ink/85 backdrop-blur-sm flex flex-col"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* 상단 바 */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="text-white">
          <div className="font-mono text-[10px] tracking-[0.2em] opacity-70">PREVIEW</div>
          <div className="font-display-md text-[18px]" style={{ fontFamily: 'Fraunces, serif' }}>
            앨범 미리보기
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="닫기"
          className="px-4 py-2 text-white/90 hover:text-white text-[14px] border border-white/30 hover:border-white/70 rounded-full transition-colors"
        >
          닫기
        </button>
      </div>

      {/* 책 본체 */}
      <div className="flex-1 flex items-center justify-center px-4 py-2 overflow-hidden">
        <HTMLFlipBook
          width={PAGE_W}
          height={PAGE_H}
          size="fixed"
          showCover={true}
          drawShadow={true}
          maxShadowOpacity={0.4}
          mobileScrollSupport={false}
          flippingTime={700}
          className=""
          style={{}}
          startPage={0}
          minWidth={380}
          maxWidth={620}
          minHeight={280}
          maxHeight={460}
          startZIndex={0}
          autoSize={true}
          usePortrait={false}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={30}
          showPageCorners={true}
          disableFlipByClick={false}
        >
          {/* 책 앞표지 — 흰 바탕 + 검은 글씨, 가운데 정렬 (가로 비율) */}
          <PageView className="bg-white text-ink">
            <div className="w-full h-full flex flex-col justify-center items-center text-center px-8 py-6">
              <div className="font-mono text-[9px] tracking-[0.4em] text-coral mb-6">
                WEDDING ALBUM
              </div>
              <div
                className="font-display-md text-[28px] leading-[1.2]"
                style={{ fontFamily: 'Fraunces, serif', fontWeight: 400 }}
              >
                우리의 결혼 기록
              </div>
              <div className="w-10 h-px bg-coral my-5" />
              <div className="font-mono text-[10px] text-ink-muted tracking-[0.15em]">
                CHEOLSU · YOUNGHEE
              </div>
              <div className="mt-6 text-[10px] text-ink-muted">
                {layout.total_pages} pages · {new Date().getFullYear()}
              </div>
            </div>
          </PageView>

          {/* 축복 메시지 첫 페이지 — 좌측 빈 면 + 우측 본식 사진 + 손글씨 */}
          <PageView className="bg-bg" />
          <PageView>
            <BlessingsPage variant="book" mainPhoto={blessingMainPhoto} />
          </PageView>

          {/* 본문 페이지들 — 챕터 인트로(글만) / 사진 페이지 */}
          {flatPages.map((item, idx) => {
            if (item.kind === 'cover') {
              return (
                <PageView key={idx}>
                  <ChapterCoverPage
                    chapterNumber={item.chapterNumber}
                    chapterTitle={item.chapterTitle}
                  />
                </PageView>
              );
            }
            return (
              <PageView key={idx}>
                <AlbumPageContent page={item.page} photos={photos} />
              </PageView>
            );
          })}

          {/* 책 뒤표지 — 흰 바탕 + 검은 글씨, 미니멀 (가로 비율) */}
          <PageView className="bg-white text-ink">
            <div className="w-full h-full flex flex-col justify-center items-center text-center px-8 py-6">
              <div className="w-10 h-px bg-coral mb-5" />
              <div
                className="font-display-md text-[18px] leading-tight"
                style={{ fontFamily: 'Fraunces, serif', fontWeight: 400 }}
              >
                The End.
              </div>
              <div className="mt-3 text-[11px] text-ink-muted leading-relaxed max-w-[240px]">
                지나간 날이 한 권의 책으로,
                <br />
                다시 함께 펼쳐 볼 수 있게.
              </div>
              <div className="mt-6 font-mono text-[9px] tracking-[0.3em] text-ink-muted">
                WEDDINGLOG · {new Date().getFullYear()}
              </div>
            </div>
          </PageView>
        </HTMLFlipBook>
      </div>

      <div className="text-center text-white/60 text-[11px] pb-4">
        모서리를 끌거나 클릭해 페이지를 넘기세요
      </div>
    </div>
  );
}
