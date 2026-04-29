// 주문 가격 계산 — 단일 소스.
// 백엔드 backend/app/constants/pricing.py 와 1:1 동기.
//
// 공식: total_price = (base_price + cover_surcharge) * quantity
//   - SQUARE 양장본: 150,000원
//   - A4 (가로) 양장본: 180,000원
//   - HARD 커버: +20,000원
//   - SOFT 커버: +0원
//
// 클라이언트 가격 표시용. 실제 주문 생성 시 서버가 OrderResponse 의
// computed_field 로 재계산하므로 클라이언트 값은 신뢰되지 않는다 (UX 만 담당).

import type { OrderFormat, OrderCoverType } from '../types/order';

export const BASE_PRICES: Record<OrderFormat, number> = {
  SQUARE: 150_000,
  A4: 180_000,
};

export const COVER_SURCHARGES: Record<OrderCoverType, number> = {
  HARD: 20_000,
  SOFT: 0,
};

export interface PriceBreakdown {
  base: number;
  surcharge: number;
  total: number;
}

/**
 * 가격 분해 — base / cover surcharge / 합계 반환.
 *
 * @param format SQUARE | A4
 * @param coverType HARD | SOFT
 * @param quantity 1 이상 정수 (UI 에서 1~10 으로 제한)
 */
export function calcPrice(
  format: OrderFormat,
  coverType: OrderCoverType,
  quantity: number,
): PriceBreakdown {
  const base = BASE_PRICES[format];
  const surcharge = COVER_SURCHARGES[coverType];
  return { base, surcharge, total: quantity * (base + surcharge) };
}

/** 천단위 콤마 + '원' 접미. UI 표기 통일. */
export function formatKrw(amount: number): string {
  return amount.toLocaleString() + '원';
}
