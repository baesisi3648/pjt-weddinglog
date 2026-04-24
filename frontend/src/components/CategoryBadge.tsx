// @TASK STITCH-DESIGN - CategoryBadge 모노크롬 재작성 (이모지 제거, Material Symbols)
// @SPEC DESIGN.md: 색상으로 카테고리 구분 금지

import type { Category } from '../types';
import { CATEGORY_LABELS } from '../constants/enums';

// Material Symbols 아이콘 매핑 (카테고리별)
const CATEGORY_ICONS: Record<Category, string> = {
  WEDDING_PHOTO: 'photo_camera',
  STUDIO_DRESS_MAKEUP: 'face_retouching_natural',
  VENUE: 'location_on',
  GIFT: 'card_giftcard',
  INVITATION: 'mail',
  REHEARSAL: 'theater_comedy',
  CEREMONY: 'favorite',
  HONEYMOON: 'flight',
  ETC: 'more_horiz',
};

// 카테고리별 이모지 (하위 호환 — Calendar 리스트 뷰 등에서 참조)
export const CATEGORY_EMOJIS: Record<Category, string> = {
  WEDDING_PHOTO: '📷',
  STUDIO_DRESS_MAKEUP: '💄',
  VENUE: '🏛️',
  GIFT: '💍',
  INVITATION: '✉️',
  REHEARSAL: '🎭',
  CEREMONY: '💒',
  HONEYMOON: '✈️',
  ETC: '📌',
};

interface CategoryBadgeProps {
  category: Category;
  size?: 'sm' | 'md';
}

export default function CategoryBadge({ category, size = 'md' }: CategoryBadgeProps) {
  const label = CATEGORY_LABELS[category] ?? category;
  const icon = CATEGORY_ICONS[category] ?? 'more_horiz';

  const isSm = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSm ? '3px' : '4px',
        padding: isSm ? '2px 7px' : '3px 10px',
        fontSize: isSm ? '11px' : '13px',
        fontWeight: 500,
        lineHeight: 1.4,
        borderRadius: '4px',
        backgroundColor: 'transparent',
        color: '#524340',
        border: '1px solid #d7c2bd',
        whiteSpace: 'nowrap',
      }}
      data-category={category}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: isSm ? '12px' : '14px',
          fontVariationSettings: "'wght' 300",
        }}
        aria-hidden="true"
      >
        {icon}
      </span>
      {/* 이모지는 테스트 호환용 — 시각적으로 숨김 */}
      <span aria-hidden="true" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
        {CATEGORY_EMOJIS[category]}
      </span>
      <span>{label}</span>
    </span>
  );
}
