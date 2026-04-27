// @TASK BookPreviewModal — 양면 펼침 책 미리보기 (react-pageflip)
//   각 챕터 페이지를 책 한 장씩으로 펼치고, spread (좌+우) 형태로 넘긴다.
import React, { forwardRef, useMemo } from 'react';
import HTMLFlipBook from 'react-pageflip';
import type { AlbumLayout, AlbumPage } from '../types/album';
import type { Photo } from '../types/photo';
import type { OrderFormat } from '../types/order';
import BlessingsPage from './BlessingsPage';

// 결혼앨범 비율 — 한국 시장 표준.
//  • 정사각형 1:1 (30×30cm)        — 한국 스튜디오 클래식.
//  • 가로 양장본 3:2 (35×23cm)     — 본식·신혼여행 와이드 컷에 강함.
const FORMAT_DIMENSIONS: Record<OrderFormat, { width: number; height: number; label: string; ratio: string }> = {
  SQUARE: { width: 600, height: 600, label: '정사각형', ratio: '1:1' },
  A4:     { width: 810, height: 540, label: '가로 양장본', ratio: '3:2' },
};

interface Props {
  layout: AlbumLayout;
  photos: Photo[];
  /** 현재 선택된 판형 — 미리보기 비율을 결정한다. */
  format: OrderFormat;
  /** 미리보기 안에서 판형 변경 → 부모(OrderCheckout) 의 format 동기화. */
  onChangeFormat: (next: OrderFormat) => void;
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
  { children?: React.ReactNode; className?: string; width: number; height: number }
>(function PageView({ children, className = '', width, height }, ref) {
  return (
    <div
      ref={ref}
      className={`bg-bg ${className}`}
      style={{ width, height }}
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

// 페이지 하단 가운데 — `-N-` 폴리오. 양장본 정통 톤.
function PageFolio({ n }: { n: number }) {
  return (
    <div
      className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[10px] text-ink-muted/70 tracking-[0.15em] pointer-events-none"
      aria-hidden="true"
    >
      — {n} —
    </div>
  );
}

function AlbumPageContent({ page, photos, folio }: { page: AlbumPage; photos: Photo[]; folio?: number }) {
  const ids = page.photo_ids;
  const slot = (i: number, cls: string) => <PhotoSlot id={ids[i]} photos={photos} className={cls} />;

  if (page.template === 'T1' || page.template === 'T5') {
    // 1장 풀 페이지 — 사진 비율 유지(contain), 위아래 여백, 하단 캡션.
    // T5(챕터 커버 사진)도 동일 레이아웃으로 표시 (책에서는 텍스트 인트로가 따로 있음).
    return (
      <div className="relative w-full h-full p-6 flex flex-col bg-bg">
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          {slot(0, 'w-full h-full')}
        </div>
        {page.caption && (
          <p className="mt-4 mb-3 text-[12px] text-ink-muted text-center italic truncate"
             style={{ fontFamily: 'Fraunces, serif' }}>
            {page.caption}
          </p>
        )}
        {folio !== undefined && <PageFolio n={folio} />}
      </div>
    );
  }
  if (page.template === 'T2') {
    return (
      <div className="relative w-full h-full p-3">
        <div className="flex gap-2 w-full h-full pb-4">
          {slot(0, 'flex-1 h-full')}
          {slot(1, 'flex-1 h-full')}
        </div>
        {folio !== undefined && <PageFolio n={folio} />}
      </div>
    );
  }
  if (page.template === 'T3') {
    return (
      <div className="relative w-full h-full p-3">
        <div className="grid grid-cols-3 grid-rows-2 gap-2 w-full h-full pb-4">
          {slot(0, 'col-span-2 row-span-2 h-full')}
          {slot(1, 'h-full')}
          {slot(2, 'h-full')}
        </div>
        {folio !== undefined && <PageFolio n={folio} />}
      </div>
    );
  }
  // T4
  return (
    <div className="relative w-full h-full p-3">
      <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full h-full pb-4">
        {slot(0, 'h-full')}
        {slot(1, 'h-full')}
        {slot(2, 'h-full')}
        {slot(3, 'h-full')}
      </div>
      {folio !== undefined && <PageFolio n={folio} />}
    </div>
  );
}

// 책 평탄화 항목 타입 — folio 는 본문 사진 페이지에만 부여 (인트로/표지 제외).
type BookItem =
  | { kind: 'cover'; chapterNumber: number; chapterTitle: string }
  | { kind: 'page'; page: AlbumPage; folio: number };

// ─── 메인 모달 ────────────────────────────────────────────────────────────
export default function BookPreviewModal({ layout, photos, format, onChangeFormat, blessingMainPhoto, onClose }: Props) {
  const dim = FORMAT_DIMENSIONS[format];
  const PAGE_W = dim.width;
  const PAGE_H = dim.height;

  // 책 페이지 평탄화 — 빈 페이지 패리티 제거.
  // 각 챕터: [텍스트 인트로 페이지] + [T5 커버 사진(P.1)] + [T1 본문 사진들...]
  // T5 페이지를 건너뛰지 않음 — P.1 사진이 손실되지 않도록.
  // folio 는 사진 페이지에만 1, 2, 3... 으로 책 전체 통합 번호 부여.
  const flatPages = useMemo(() => {
    const out: BookItem[] = [];
    let folio = 0;
    for (const ch of layout.chapters) {
      if (!ch.pages.length) continue;
      out.push({
        kind: 'cover',
        chapterNumber: ch.chapter_number,
        chapterTitle: ch.title,
      });
      for (const pg of ch.pages) {
        folio += 1;
        out.push({ kind: 'page', page: pg, folio });
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
      <div className="flex items-center justify-between px-6 py-4 gap-4">
        <div className="text-white">
          <div className="font-mono text-[10px] tracking-[0.2em] opacity-70">PREVIEW</div>
          <div className="font-display-md text-[18px]" style={{ fontFamily: 'Fraunces, serif' }}>
            앨범 미리보기
          </div>
        </div>

        {/* 판형 토글 — 미리보기 안에서 즉시 비율 전환 */}
        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full p-1">
          {(['SQUARE', 'A4'] as const).map((opt) => {
            const meta = FORMAT_DIMENSIONS[opt];
            const active = format === opt;
            return (
              <button
                key={opt}
                onClick={() => onChangeFormat(opt)}
                aria-pressed={active}
                className={`px-4 py-1.5 rounded-full text-[12px] transition-colors ${
                  active
                    ? 'bg-white text-ink font-medium'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {meta.label}
                <span className="ml-1.5 font-mono text-[10px] opacity-60">{meta.ratio}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          aria-label="닫기"
          className="px-4 py-2 text-white/90 hover:text-white text-[14px] border border-white/30 hover:border-white/70 rounded-full transition-colors"
        >
          닫기
        </button>
      </div>

      {/* 책 본체 — format 변경 시 key 로 flipbook 재마운트 (size 동적 대응) */}
      <div className="flex-1 flex items-center justify-center px-4 py-2 overflow-hidden">
        <HTMLFlipBook
          key={format}
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
          minWidth={Math.round(PAGE_W * 0.6)}
          maxWidth={Math.round(PAGE_W * 1.1)}
          minHeight={Math.round(PAGE_H * 0.6)}
          maxHeight={Math.round(PAGE_H * 1.1)}
          startZIndex={0}
          autoSize={true}
          usePortrait={false}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={30}
          showPageCorners={true}
          disableFlipByClick={false}
        >
          {/* 책 앞표지 — 흰 바탕 + 검은 글씨, 가운데 정렬 */}
          <PageView width={PAGE_W} height={PAGE_H} className="bg-white text-ink">
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
          <PageView width={PAGE_W} height={PAGE_H} className="bg-bg" />
          <PageView width={PAGE_W} height={PAGE_H}>
            <BlessingsPage variant="book" mainPhoto={blessingMainPhoto} />
          </PageView>

          {/* 본문 페이지들 — 챕터 인트로(글만) / 사진 페이지 */}
          {flatPages.map((item, idx) => {
            if (item.kind === 'cover') {
              return (
                <PageView key={idx} width={PAGE_W} height={PAGE_H}>
                  <ChapterCoverPage
                    chapterNumber={item.chapterNumber}
                    chapterTitle={item.chapterTitle}
                  />
                </PageView>
              );
            }
            return (
              <PageView key={idx} width={PAGE_W} height={PAGE_H}>
                <AlbumPageContent page={item.page} photos={photos} folio={item.folio} />
              </PageView>
            );
          })}

          {/* 책 뒤표지 — 흰 바탕 + 검은 글씨, 미니멀 */}
          <PageView width={PAGE_W} height={PAGE_H} className="bg-white text-ink">
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
        모서리를 끌거나 클릭해 페이지를 넘기세요 · 현재 {dim.label} ({dim.ratio})
      </div>
    </div>
  );
}
