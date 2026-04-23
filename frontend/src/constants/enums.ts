// @TASK P0-T6 - Frontend Enum 상수 (Backend와 동기화)

import type { Category } from '../types';

export const CATEGORIES: Record<Category, Category> = Object.freeze({
  WEDDING_PHOTO: 'WEDDING_PHOTO',
  STUDIO_DRESS_MAKEUP: 'STUDIO_DRESS_MAKEUP',
  VENUE: 'VENUE',
  GIFT: 'GIFT',
  INVITATION: 'INVITATION',
  REHEARSAL: 'REHEARSAL',
  CEREMONY: 'CEREMONY',
  HONEYMOON: 'HONEYMOON',
  ETC: 'ETC',
}) as Record<Category, Category>;

export const CATEGORY_LIST: Category[] = Object.values(CATEGORIES);

// UI 표시용 한국어 라벨
export const CATEGORY_LABELS: Record<Category, string> = Object.freeze({
  WEDDING_PHOTO: '웨딩촬영',
  STUDIO_DRESS_MAKEUP: '스드메',
  VENUE: '예식장',
  GIFT: '예물·예단',
  INVITATION: '청첩장',
  REHEARSAL: '리허설',
  CEREMONY: '본식',
  HONEYMOON: '신혼여행',
  ETC: '기타',
}) as Record<Category, string>;

export const ORDER_FORMATS = Object.freeze({
  SQUARE: 'SQUARE',
  A4: 'A4',
} as const);

export const COVER_TYPES = Object.freeze({
  HARD: 'HARD',
  SOFT: 'SOFT',
} as const);

export const ORDER_STATUSES = Object.freeze({
  pending: 'pending',
  processing: 'processing',
  completed: 'completed',
} as const);
