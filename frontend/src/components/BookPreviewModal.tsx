// @TASK BookPreviewModal — 양면 펼침 책 미리보기 (react-pageflip)
//   각 챕터 페이지를 책 한 장씩으로 펼치고, spread (좌+우) 형태로 넘긴다.
import React, { forwardRef, useMemo } from 'react';
import HTMLFlipBook from 'react-pageflip';
import type { AlbumLayout, AlbumPage } from '../types/album';
import type { Photo } from '../types/photo';

const PAGE_W = 420;
const PAGE_H = 540;

interface Props {
  layout: AlbumLayout;
  photos: Photo[];
  onClose: () => void;
}

function getPhoto(photos: Photo[], id: string): Photo | undefined {
  return photos.find((p) => p.id === id);
}

// ─── 페이지 1장 (책 1면) ───────────────────────────────────────────────────
const PageView = forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; className?: string }
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

function AlbumPageContent({ page, photos, chapterTitle }: { page: AlbumPage; photos: Photo[]; chapterTitle: string }) {
  const ids = page.photo_ids;
  const slot = (i: number, cls: string) => <PhotoSlot id={ids[i]} photos={photos} className={cls} />;

  if (page.template === 'T5') {
    // 챕터 표지 — 흰 바탕 + 검은 글씨, 사진은 contain 으로 위쪽에 배치.
    return (
      <div className="w-full h-full p-8 flex flex-col bg-bg">
        <div className="flex-1 flex items-center justify-center">
          {slot(0, 'w-full h-full max-h-[60%]')}
        </div>
        <div className="mt-6 pt-6 border-t border-line">
          <div className="font-mono text-[10px] tracking-[0.25em] text-coral mb-2">
            CHAPTER · {String(page.page_number).padStart(2, '0')}
          </div>
          <div
            className="font-display-md text-[24px] leading-tight text-ink"
            style={{ fontFamily: 'Fraunces, serif' }}
          >
            {chapterTitle}
          </div>
        </div>
      </div>
    );
  }

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

// ─── 메인 모달 ────────────────────────────────────────────────────────────
export default function BookPreviewModal({ layout, photos, onClose }: Props) {
  // 책 페이지 평탄화 — chapter.pages 순서대로 + 챕터 제목을 cover 페이지에 전달
  const flatPages = useMemo(() => {
    const out: { page: AlbumPage; chapterTitle: string }[] = [];
    for (const ch of layout.chapters) {
      for (const pg of ch.pages) {
        out.push({ page: pg, chapterTitle: ch.title });
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
          minWidth={300}
          maxWidth={500}
          minHeight={400}
          maxHeight={700}
          startZIndex={0}
          autoSize={true}
          usePortrait={true}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={30}
          showPageCorners={true}
          disableFlipByClick={false}
        >
          {/* 책 앞표지 — 흰 바탕 + 검은 글씨, 가운데 정렬 */}
          <PageView className="bg-white text-ink flex flex-col p-12">
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <div className="font-mono text-[10px] tracking-[0.4em] text-coral mb-10">
                WEDDING ALBUM
              </div>
              <div
                className="font-display-md text-[36px] leading-[1.2] mb-3"
                style={{ fontFamily: 'Fraunces, serif', fontWeight: 400 }}
              >
                우리의
                <br />
                결혼 기록
              </div>
              <div className="w-10 h-px bg-coral my-8" />
              <div className="font-mono text-[11px] text-ink-muted tracking-[0.15em]">
                CHEOLSU · YOUNGHEE
              </div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-ink-muted">
                {layout.total_pages} pages · {new Date().getFullYear()}
              </div>
            </div>
          </PageView>

          {/* 본문 페이지들 */}
          {flatPages.map(({ page, chapterTitle }, idx) => (
            <PageView key={idx}>
              <AlbumPageContent page={page} photos={photos} chapterTitle={chapterTitle} />
            </PageView>
          ))}

          {/* 책 뒤표지 — 흰 바탕 + 검은 글씨, 미니멀 */}
          <PageView className="bg-white text-ink flex flex-col p-12">
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <div className="w-10 h-px bg-coral mb-8" />
              <div
                className="font-display-md text-[20px] leading-tight"
                style={{ fontFamily: 'Fraunces, serif', fontWeight: 400 }}
              >
                The End.
              </div>
              <div className="mt-4 text-[12px] text-ink-muted leading-relaxed max-w-[260px]">
                지나간 날이 한 권의 책으로,
                <br />
                다시 함께 펼쳐 볼 수 있게.
              </div>
            </div>
            <div className="text-center">
              <div className="font-mono text-[10px] tracking-[0.3em] text-ink-muted">
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
