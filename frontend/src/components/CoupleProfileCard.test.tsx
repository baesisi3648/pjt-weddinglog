// @TASK CoupleProfileCard 테스트 — 압박성 카운트다운 제거 후
//   "앨범 주문 기한 만료" 같은 시간 압박 표현은 도메인 정합성에 안 맞아 제거됨.
//   이름/D-day/태그라인만 검증.
import { render, screen } from '@testing-library/react';
import CoupleProfileCard from './CoupleProfileCard';
import type { Couple } from '../types';

const BASE_COUPLE: Couple = {
  id: 'cpl_001',
  groom_name: '철수',
  bride_name: '영희',
  wedding_date: null,
  profile_photo_path: null,
  tagline: '우리만의 이야기',
};

function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function pastDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

describe('CoupleProfileCard', () => {
  it('커플 이름이 렌더링된다', () => {
    const couple = { ...BASE_COUPLE, wedding_date: futureDate(60) };
    render(<CoupleProfileCard couple={couple} />);
    expect(screen.getByText(/철수/)).toBeInTheDocument();
    expect(screen.getByText(/영희/)).toBeInTheDocument();
  });

  it('주 D-day 카운트다운이 표시된다', () => {
    const couple = { ...BASE_COUPLE, wedding_date: futureDate(30) };
    render(<CoupleProfileCard couple={couple} />);
    // 날짜 경계(UTC/로컬 오프셋)로 ±1 허용
    expect(screen.getByText(/D-[23]\d/)).toBeInTheDocument();
  });

  it('wedding_date가 과거 → "D+N" 형식으로 표시', () => {
    const couple = { ...BASE_COUPLE, wedding_date: pastDate(10) };
    render(<CoupleProfileCard couple={couple} />);
    expect(screen.getByText(/D\+\d+/)).toBeInTheDocument();
  });

  it('tagline이 표시된다', () => {
    const couple = { ...BASE_COUPLE, wedding_date: futureDate(30) };
    render(<CoupleProfileCard couple={couple} />);
    expect(screen.getByText('우리만의 이야기')).toBeInTheDocument();
  });

  it('압박성 카운트다운 메시지가 표시되지 않는다 (앨범은 언제든 주문 가능)', () => {
    const couple = { ...BASE_COUPLE, wedding_date: pastDate(5) };
    render(<CoupleProfileCard couple={couple} />);
    expect(screen.queryByText(/앨범 주문 기한 만료/)).not.toBeInTheDocument();
    expect(screen.queryByText(/앨범 주문 추천/)).not.toBeInTheDocument();
    expect(screen.queryByText(/D-\d+\s*까지/)).not.toBeInTheDocument();
  });

  it('album_order_deadline prop을 넘겨도 표시되지 않는다 (deprecated)', () => {
    const couple = { ...BASE_COUPLE, wedding_date: pastDate(5) };
    render(
      <CoupleProfileCard
        couple={couple}
        album_order_deadline={{ days_remaining: -5, urgency: 'expired' }}
      />
    );
    expect(screen.queryByText(/앨범 주문/)).not.toBeInTheDocument();
  });

  it('profile_photo_path 없어도 헤더가 정상 렌더된다 (이모지 ❌, 텍스트 헤딩만)', () => {
    const couple = { ...BASE_COUPLE, wedding_date: futureDate(30), profile_photo_path: null };
    render(<CoupleProfileCard couple={couple} />);
    // 영상 원칙 — 이모지 플레이스홀더 제거. 커플 이름 헤딩만 노출.
    expect(document.querySelector('[data-avatar-placeholder]')).toBeNull();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
