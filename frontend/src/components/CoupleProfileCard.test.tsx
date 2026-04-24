// @TASK P4-S2-T2 - CoupleProfileCard 테스트
// @SPEC specs/screens/01_home.yaml#couple_profile_card.secondary_countdown
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import CoupleProfileCard from './CoupleProfileCard';
import type { Couple } from '../types';
import type { DeadlineUrgency } from '../types';

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
    render(<CoupleProfileCard couple={couple} album_order_deadline={{ days_remaining: 60, urgency: 'normal' as DeadlineUrgency }} />);
    expect(screen.getByText(/철수/)).toBeInTheDocument();
    expect(screen.getByText(/영희/)).toBeInTheDocument();
  });

  it('주 D-day 카운트다운이 표시된다', () => {
    const couple = { ...BASE_COUPLE, wedding_date: futureDate(30) };
    render(<CoupleProfileCard couple={couple} album_order_deadline={{ days_remaining: 30, urgency: 'normal' as DeadlineUrgency }} />);
    // 날짜 경계(UTC/로컬 오프셋)로 ±1 허용
    expect(screen.getByText(/D-[23]\d/)).toBeInTheDocument();
  });

  it('days_remaining > 21 (normal) → 2차 카운트다운 숨김', () => {
    const couple = { ...BASE_COUPLE, wedding_date: futureDate(60) };
    render(<CoupleProfileCard couple={couple} album_order_deadline={{ days_remaining: 60, urgency: 'normal' as DeadlineUrgency }} />);
    expect(screen.queryByText(/앨범 주문 추천/)).not.toBeInTheDocument();
  });

  it('urgency=warning (D-21~D-14) → yellow-400 배지 표시', () => {
    const couple = { ...BASE_COUPLE, wedding_date: futureDate(18) };
    render(<CoupleProfileCard couple={couple} album_order_deadline={{ days_remaining: 18, urgency: 'warning' as DeadlineUrgency }} />);
    const badge = screen.getByText(/앨범 주문 추천/);
    expect(badge).toBeInTheDocument();
    // yellow 배지
    expect(badge.closest('[data-urgency="warning"]')).toBeTruthy();
  });

  it('urgency=urgent (D-14 이하, 미래) → red-500 배지 표시', () => {
    const couple = { ...BASE_COUPLE, wedding_date: futureDate(10) };
    render(<CoupleProfileCard couple={couple} album_order_deadline={{ days_remaining: 10, urgency: 'urgent' as DeadlineUrgency }} />);
    const badge = screen.getByText(/앨범 주문 추천/);
    expect(badge).toBeInTheDocument();
    expect(badge.closest('[data-urgency="urgent"]')).toBeTruthy();
  });

  it('urgency=expired → "앨범 주문 기한 만료" gray 표시', () => {
    const couple = { ...BASE_COUPLE, wedding_date: pastDate(5) };
    render(<CoupleProfileCard couple={couple} album_order_deadline={{ days_remaining: -5, urgency: 'expired' as DeadlineUrgency }} />);
    expect(screen.getByText(/앨범 주문 기한 만료/)).toBeInTheDocument();
    const el = screen.getByText(/앨범 주문 기한 만료/);
    expect(el.closest('[data-urgency="expired"]')).toBeTruthy();
  });

  it('wedding_date가 과거 → "D+N" 형식으로 표시', () => {
    const couple = { ...BASE_COUPLE, wedding_date: pastDate(10) };
    render(<CoupleProfileCard couple={couple} album_order_deadline={{ days_remaining: -10, urgency: 'expired' as DeadlineUrgency }} />);
    expect(screen.getByText(/D\+\d+/)).toBeInTheDocument();
  });

  it('tagline이 표시된다', () => {
    const couple = { ...BASE_COUPLE, wedding_date: futureDate(30) };
    render(<CoupleProfileCard couple={couple} album_order_deadline={{ days_remaining: 30, urgency: 'normal' as DeadlineUrgency }} />);
    expect(screen.getByText('우리만의 이야기')).toBeInTheDocument();
  });

  it('profile_photo_path 없으면 이모지 플레이스홀더 표시', () => {
    const couple = { ...BASE_COUPLE, wedding_date: futureDate(30), profile_photo_path: null };
    render(<CoupleProfileCard couple={couple} album_order_deadline={{ days_remaining: 30, urgency: 'normal' as DeadlineUrgency }} />);
    // 이모지 기반 아바타 플레이스홀더
    expect(document.querySelector('[data-avatar-placeholder]')).toBeTruthy();
  });
});
