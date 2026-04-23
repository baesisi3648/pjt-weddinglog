// @TASK P4-S2-T2 - CoupleProfileCard 컴포넌트
// @SPEC specs/screens/01_home.yaml#couple_profile_card.secondary_countdown
// @TEST src/components/CoupleProfileCard.test.tsx

import React from 'react';
import useDday from '../hooks/useDday';
import type { Couple, AlbumOrderDeadline, DeadlineUrgency } from '../types';

interface UrgencyStyle {
  background: string;
  color: string;
  border: string;
  pulse: boolean;
}

/**
 * 2차 카운트다운 urgency별 스타일
 */
const URGENCY_STYLES: Partial<Record<DeadlineUrgency, UrgencyStyle>> = {
  normal: undefined, // 숨김
  warning: {
    background: '#FEF08A',
    color: '#92400E',
    border: '1px solid #FDE047',
    pulse: false,
  },
  urgent: {
    background: '#FEE2E2',
    color: '#DC2626',
    border: '1px solid #FCA5A5',
    pulse: true,
  },
  expired: {
    background: '#F3F4F6',
    color: '#6B7280',
    border: '1px solid #E5E7EB',
    pulse: false,
  },
};

interface SecondaryCountdownProps {
  album_order_deadline?: AlbumOrderDeadline | null;
}

/**
 * SecondaryCountdown — 앨범 주문 추천 2차 카운트다운
 */
function SecondaryCountdown({ album_order_deadline }: SecondaryCountdownProps) {
  const { urgency, days_remaining } = album_order_deadline ?? {};

  if (!urgency || urgency === 'normal') return null;

  const style = URGENCY_STYLES[urgency];
  if (!style) return null;

  const isExpired = urgency === 'expired';

  return (
    <div
      data-urgency={urgency}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 12px',
        borderRadius: '9999px',
        ...style,
        animation: style.pulse ? 'wl-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' : undefined,
        fontSize: '13px',
        fontWeight: 600,
        marginTop: '8px',
      }}
    >
      {isExpired ? (
        <span>앨범 주문 기한 만료</span>
      ) : (
        <span>
          앨범 주문 추천: D-{Math.abs(days_remaining ?? 0)}
        </span>
      )}
    </div>
  );
}

interface CoupleProfileCardProps {
  couple: Couple;
  album_order_deadline?: AlbumOrderDeadline | null;
}

/**
 * CoupleProfileCard — 커플 프로필 + D-day + 2차 카운트다운
 */
export default function CoupleProfileCard({ couple, album_order_deadline }: CoupleProfileCardProps) {
  const { dDay, label } = couple?.wedding_date
    ? useDday(couple.wedding_date)
    : { dDay: null, label: 'D-?' };

  const isPast = dDay !== null && dDay > 0;

  return (
    <div className="wl-couple-profile-card" style={{ textAlign: 'center', padding: '24px 16px' }}>
      {/* 프로필 사진 / 이모지 플레이스홀더 */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', gap: '12px' }}>
        {couple?.profile_photo_path ? (
          <img
            src={couple.profile_photo_path}
            alt="커플 프로필"
            style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div
            data-avatar-placeholder
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg,#EBB99B,#F5D4BC)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              {couple?.groom_name?.[0] ?? '신'}
            </div>
            <span style={{ fontSize: '18px', color: '#FF5533' }}>♥</span>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg,#B7ABD4,#D9D2E8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              {couple?.bride_name?.[0] ?? '신'}
            </div>
          </div>
        )}
      </div>

      {/* 커플 이름 */}
      <div
        className="wl-couple-name serif"
        style={{ fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}
      >
        {couple?.groom_name ?? '신랑'} <span style={{ color: '#FF5533' }}>♥</span> {couple?.bride_name ?? '신부'}
      </div>

      {/* tagline */}
      {couple?.tagline && (
        <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>
          {couple.tagline}
        </div>
      )}

      {/* 주 D-day 카운트다운 */}
      <div
        className="wl-dday-main serif"
        style={{
          fontFamily: 'Fraunces, serif',
          fontSize: '48px',
          fontWeight: 700,
          color: '#FF5533',
          lineHeight: 1,
          marginBottom: '4px',
        }}
      >
        {label}
      </div>

      {/* D+ 상태 메시지 */}
      {isPast && (
        <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '4px' }}>
          결혼을 축하합니다!
        </div>
      )}

      {/* 결혼 날짜 */}
      {couple?.wedding_date && (
        <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '8px' }}>
          {couple.wedding_date}
        </div>
      )}

      {/* 2차 카운트다운 */}
      <SecondaryCountdown album_order_deadline={album_order_deadline} />
    </div>
  );
}
