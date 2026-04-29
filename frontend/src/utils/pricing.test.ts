// pricing 단일 소스 단위 테스트.
// 백엔드 backend/tests/services/test_export_service.py 의 가격 케이스와 동기 유지.

import { describe, it, expect } from 'vitest';
import { calcPrice, formatKrw, BASE_PRICES, COVER_SURCHARGES } from './pricing';

describe('calcPrice', () => {
  describe('format × cover 4가지 조합 (qty=1)', () => {
    it('SQUARE + HARD = 170,000', () => {
      expect(calcPrice('SQUARE', 'HARD', 1)).toEqual({
        base: 150_000,
        surcharge: 20_000,
        total: 170_000,
      });
    });

    it('SQUARE + SOFT = 150,000', () => {
      expect(calcPrice('SQUARE', 'SOFT', 1)).toEqual({
        base: 150_000,
        surcharge: 0,
        total: 150_000,
      });
    });

    it('A4 + HARD = 200,000', () => {
      expect(calcPrice('A4', 'HARD', 1)).toEqual({
        base: 180_000,
        surcharge: 20_000,
        total: 200_000,
      });
    });

    it('A4 + SOFT = 180,000', () => {
      expect(calcPrice('A4', 'SOFT', 1)).toEqual({
        base: 180_000,
        surcharge: 0,
        total: 180_000,
      });
    });
  });

  describe('수량 곱셈', () => {
    it('SQUARE + HARD × 3 = 510,000 (시드 ord_sample_001 케이스)', () => {
      const result = calcPrice('SQUARE', 'HARD', 3);
      expect(result.total).toBe(510_000);
    });

    it('A4 + SOFT × 1 = 180,000 (시드 ord_sample_002 케이스)', () => {
      const result = calcPrice('A4', 'SOFT', 1);
      expect(result.total).toBe(180_000);
    });

    it('SQUARE + SOFT × 1 = 150,000 (시드 ord_sample_003 케이스)', () => {
      const result = calcPrice('SQUARE', 'SOFT', 1);
      expect(result.total).toBe(150_000);
    });

    it('수량 10 (UI 상한)', () => {
      const result = calcPrice('A4', 'HARD', 10);
      expect(result.total).toBe(2_000_000); // (180000 + 20000) × 10
    });
  });

  describe('상수 노출 (백엔드 동기 검증용)', () => {
    it('BASE_PRICES 가 백엔드 값과 일치', () => {
      expect(BASE_PRICES.SQUARE).toBe(150_000);
      expect(BASE_PRICES.A4).toBe(180_000);
    });

    it('COVER_SURCHARGES 가 백엔드 값과 일치', () => {
      expect(COVER_SURCHARGES.HARD).toBe(20_000);
      expect(COVER_SURCHARGES.SOFT).toBe(0);
    });
  });
});

describe('formatKrw', () => {
  it('천단위 콤마 + 원 접미', () => {
    expect(formatKrw(150_000)).toBe('150,000원');
    expect(formatKrw(2_000_000)).toBe('2,000,000원');
  });

  it('0 도 정상', () => {
    expect(formatKrw(0)).toBe('0원');
  });
});
