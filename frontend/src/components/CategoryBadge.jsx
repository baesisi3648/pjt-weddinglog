// @TASK P2-S1-T4 - CategoryBadge 공통 컴포넌트
// @SPEC docs/planning/06-tasks.md#P2-S1-T4
// @SPEC specs/shared/design-tokens.yaml#category_color_mapping

import { CATEGORY_LABELS } from '../constants/enums';

// 카테고리별 색상 (design-tokens.yaml 기반)
const CATEGORY_COLORS = {
  WEDDING_PHOTO:       { bg: '#FFE6DD', text: '#FF5533', border: '#FFCCBB' },
  STUDIO_DRESS_MAKEUP: { bg: '#F0E6FF', text: '#BB88FF', border: '#E6CCFF' },
  VENUE:               { bg: '#F0E6FF', text: '#BB88FF', border: '#E6CCFF' },
  GIFT:                { bg: '#F0E6FF', text: '#BB88FF', border: '#E6CCFF' },
  INVITATION:          { bg: '#F0E6FF', text: '#BB88FF', border: '#E6CCFF' },
  REHEARSAL:           { bg: '#D9FFEF', text: '#00FFAA', border: '#CCFFE6' },
  CEREMONY:            { bg: '#D9FFEF', text: '#00FFAA', border: '#CCFFE6' },
  HONEYMOON:           { bg: '#D9FFEF', text: '#00FFAA', border: '#CCFFE6' },
  ETC:                 { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
};

// 카테고리별 이모지 아이콘 (Council 리뷰 반영: 시각 식별 보강)
export const CATEGORY_EMOJIS = {
  WEDDING_PHOTO:       '📷',
  STUDIO_DRESS_MAKEUP: '💄',
  VENUE:               '🏛️',
  GIFT:                '💍',
  INVITATION:          '✉️',
  REHEARSAL:           '🎭',
  CEREMONY:            '💒',
  HONEYMOON:           '✈️',
  ETC:                 '📌',
};

/**
 * CategoryBadge — 카테고리 배지 (색상 + 이모지 + 한국어 라벨)
 * @param {string} category - CATEGORIES 상수 중 하나
 * @param {'sm'|'md'} size - 배지 크기
 */
export default function CategoryBadge({ category, size = 'md' }) {
  const label = CATEGORY_LABELS[category] ?? category;
  const emoji = CATEGORY_EMOJIS[category] ?? '📌';
  const colors = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.ETC;

  const sizeStyles = {
    sm: { fontSize: '11px', padding: '2px 7px', gap: '3px' },
    md: { fontSize: '13px', padding: '3px 10px', gap: '4px' },
  };

  const s = sizeStyles[size] ?? sizeStyles.md;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 500,
        lineHeight: 1.4,
        borderRadius: '9999px',
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        whiteSpace: 'nowrap',
      }}
      data-category={category}
    >
      <span aria-hidden="true">{emoji}</span>
      <span>{label}</span>
    </span>
  );
}
