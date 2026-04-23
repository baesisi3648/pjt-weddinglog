// @TASK P0-T6 - Enum 상수 Strict TDD 테스트
import {
  CATEGORIES,
  CATEGORY_LIST,
  CATEGORY_LABELS,
  ORDER_FORMATS,
  COVER_TYPES,
  ORDER_STATUSES,
} from './enums.js';

describe('CATEGORIES', () => {
  it('has exactly 9 category values', () => {
    expect(Object.keys(CATEGORIES)).toHaveLength(9);
  });

  it('contains all expected category keys', () => {
    const expected = [
      'WEDDING_PHOTO',
      'STUDIO_DRESS_MAKEUP',
      'VENUE',
      'GIFT',
      'INVITATION',
      'REHEARSAL',
      'CEREMONY',
      'HONEYMOON',
      'ETC',
    ];
    expected.forEach((key) => {
      expect(CATEGORIES[key]).toBe(key);
    });
  });

  it('is frozen (immutable)', () => {
    expect(Object.isFrozen(CATEGORIES)).toBe(true);
  });
});

describe('CATEGORY_LIST', () => {
  it('has length 9', () => {
    expect(CATEGORY_LIST).toHaveLength(9);
  });

  it('contains all CATEGORIES values', () => {
    Object.values(CATEGORIES).forEach((value) => {
      expect(CATEGORY_LIST).toContain(value);
    });
  });
});

describe('CATEGORY_LABELS', () => {
  it('has Korean label for every category', () => {
    Object.keys(CATEGORIES).forEach((key) => {
      expect(CATEGORY_LABELS[key]).toBeTruthy();
    });
  });

  it('WEDDING_PHOTO label is 웨딩촬영', () => {
    expect(CATEGORY_LABELS.WEDDING_PHOTO).toBe('웨딩촬영');
  });
});

describe('ORDER_FORMATS', () => {
  it('has SQUARE and A4', () => {
    expect(ORDER_FORMATS.SQUARE).toBe('SQUARE');
    expect(ORDER_FORMATS.A4).toBe('A4');
  });
});

describe('COVER_TYPES', () => {
  it('has HARD and SOFT', () => {
    expect(COVER_TYPES.HARD).toBe('HARD');
    expect(COVER_TYPES.SOFT).toBe('SOFT');
  });
});

describe('ORDER_STATUSES', () => {
  it('pending === "pending"', () => {
    expect(ORDER_STATUSES.pending).toBe('pending');
  });

  it('processing === "processing"', () => {
    expect(ORDER_STATUSES.processing).toBe('processing');
  });

  it('completed === "completed"', () => {
    expect(ORDER_STATUSES.completed).toBe('completed');
  });
});
