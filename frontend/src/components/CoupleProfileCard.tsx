// @TASK CoupleProfileCard — 영상 원칙 적용
//   "앨범 주문 기한 만료" 같은 압박성 카운트다운 제거.
//   앨범은 사진만 있으면 언제든 주문 가능하므로 시간 제약 표시는 도메인 정합성에 안 맞음.
import React from 'react';
import useDday from '../hooks/useDday';
import type { Couple, AlbumOrderDeadline } from '../types';

interface CoupleProfileCardProps {
  couple: Couple;
  /** @deprecated 사용하지 않음. 인터페이스 호환성을 위해 남겨둠. */
  album_order_deadline?: AlbumOrderDeadline | null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function CoupleProfileCard({ couple, album_order_deadline: _ }: CoupleProfileCardProps) {
  const { label } = couple?.wedding_date
    ? useDday(couple.wedding_date)
    : { label: 'D-?' };

  return (
    <section className="flex flex-col items-start gap-6 border-b border-line pb-12">
      {/* 라벨 */}
      <p className="font-label-caps text-[12px] tracking-[0.2em] text-coral uppercase">
        결혼 준비 기록
      </p>

      {/* 커플 이름 */}
      <h1
        className="font-display-lg leading-[1.05] text-ink"
        style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 'clamp(40px, 6vw, 64px)' }}
      >
        {couple?.groom_name ?? '신랑'}
        <span className="text-coral mx-3">·</span>
        {couple?.bride_name ?? '신부'}
      </h1>

      {/* D-day + 결혼일 한 줄 */}
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <span
          className="font-display-lg text-ink tracking-tight"
          style={{ fontSize: 'clamp(56px, 8vw, 88px)', fontFamily: 'Fraunces, serif', fontWeight: 300, lineHeight: 1 }}
        >
          {label}
        </span>
        {couple?.tagline && (
          <p className="text-[15px] text-ink-muted">{couple.tagline}</p>
        )}
      </div>

    </section>
  );
}
