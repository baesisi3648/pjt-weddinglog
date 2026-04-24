// @TASK STITCH-DESIGN - CoupleProfileCard 재작성 (Stitch home_desktop hero 구조)
// @SPEC specs/screens/01_home.yaml#couple_profile_card

import React from 'react';
import useDday from '../hooks/useDday';
import type { Couple, AlbumOrderDeadline, DeadlineUrgency } from '../types';

interface UrgencyStyle {
  bg: string;
  text: string;
  border: string;
}

const URGENCY_STYLES: Partial<Record<DeadlineUrgency, UrgencyStyle>> = {
  warning: { bg: '#f6eddd', text: '#524340', border: '#d7c2bd' },
  urgent: { bg: '#ffdad6', text: '#93000a', border: '#ba1a1a' },
  expired: { bg: '#ebe1d2', text: '#85736f', border: '#d7c2bd' },
};

interface SecondaryCountdownProps {
  album_order_deadline?: AlbumOrderDeadline | null;
}

function SecondaryCountdown({ album_order_deadline }: SecondaryCountdownProps) {
  const { urgency, days_remaining } = album_order_deadline ?? {};
  if (!urgency || urgency === 'normal') return null;
  const style = URGENCY_STYLES[urgency];
  if (!style) return null;
  const isExpired = urgency === 'expired';

  return (
    <span
      data-urgency={urgency}
      className="font-label-caps text-label-caps rounded-full px-3 py-1"
      style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
    >
      {isExpired ? '앨범 주문 기한 만료' : `앨범 주문 추천: D-${Math.abs(days_remaining ?? 0)}`}
    </span>
  );
}

interface CoupleProfileCardProps {
  couple: Couple;
  album_order_deadline?: AlbumOrderDeadline | null;
}

export default function CoupleProfileCard({ couple, album_order_deadline }: CoupleProfileCardProps) {
  const { label } = couple?.wedding_date
    ? useDday(couple.wedding_date)
    : { label: 'D-?' };

  return (
    <section className="flex flex-col items-center text-center gap-md border-b border-surface-dim pb-lg">
      {/* 아바타 플레이스홀더 (profile_photo_path 없을 때) */}
      {!couple?.profile_photo_path && (
        <span
          data-avatar-placeholder
          aria-hidden="true"
          className="text-3xl"
        >
          💑
        </span>
      )}

      {/* 커플 이름 */}
      <h1
        className="font-display-lg text-[44px] leading-tight text-on-surface"
        style={{ fontFamily: 'Fraunces, serif', fontWeight: 300 }}
      >
        {couple?.groom_name ?? '신랑'}{' '}
        <span className="text-primary-container">♥</span>{' '}
        {couple?.bride_name ?? '신부'}
      </h1>

      {/* 태그라인 */}
      {couple?.tagline && (
        <p className="font-body-md text-body-md text-on-surface-variant">{couple.tagline}</p>
      )}

      {/* D-day */}
      <div className="flex flex-col items-center gap-2">
        <span
          className="font-display-lg text-on-surface tracking-tighter"
          style={{ fontSize: '80px', fontFamily: 'Fraunces, serif', fontWeight: 300, lineHeight: 1 }}
        >
          {label}
        </span>
        <SecondaryCountdown album_order_deadline={album_order_deadline} />
      </div>
    </section>
  );
}
