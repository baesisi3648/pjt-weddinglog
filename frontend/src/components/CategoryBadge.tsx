// @TASK CategoryBadge — 텍스트 라벨만 (영상 원칙: 카테고리는 색·아이콘이 아닌 텍스트로)
import type { Category } from '../types';
import { CATEGORY_LABELS } from '../constants/enums';

// 하위 호환용 (테스트에서 일부 참조)
export const CATEGORY_EMOJIS: Record<Category, string> = {
  WEDDING_PHOTO: '',
  STUDIO_DRESS_MAKEUP: '',
  VENUE: '',
  GIFT: '',
  INVITATION: '',
  REHEARSAL: '',
  CEREMONY: '',
  HONEYMOON: '',
  ETC: '',
};

interface CategoryBadgeProps {
  category: Category;
  size?: 'sm' | 'md';
}

export default function CategoryBadge({ category, size = 'md' }: CategoryBadgeProps) {
  const label = CATEGORY_LABELS[category] ?? category;
  const isSm = size === 'sm';

  return (
    <span
      data-category={category}
      className={`inline-flex items-center font-medium tracking-tight border border-line text-ink-muted ${
        isSm ? 'text-[10px] px-2 py-[2px]' : 'text-[12px] px-2.5 py-[3px]'
      }`}
      style={{ borderRadius: '2px', whiteSpace: 'nowrap' }}
    >
      {label}
    </span>
  );
}
