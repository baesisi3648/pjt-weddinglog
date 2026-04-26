// @TASK CategoryBadge 테스트 — 영상 원칙 적용 후 (이모지 ❌ / 텍스트 라벨 ✅)
import { render, screen } from '@testing-library/react';
import CategoryBadge from './CategoryBadge';
import { CATEGORIES, CATEGORY_LABELS } from '../constants/enums';
import type { Category } from '../types';

describe('CategoryBadge', () => {
  it('9개 카테고리 각각 올바른 한국어 라벨을 렌더링한다', () => {
    const categories = Object.values(CATEGORIES) as Category[];
    categories.forEach((cat) => {
      const { unmount } = render(<CategoryBadge category={cat} />);
      expect(screen.getByText(CATEGORY_LABELS[cat])).toBeInTheDocument();
      unmount();
    });
  });

  it('이모지·아이콘 없이 텍스트 라벨만 렌더링된다 (영상 원칙)', () => {
    const { container } = render(<CategoryBadge category="WEDDING_PHOTO" />);
    // material-symbols 클래스 없음
    expect(container.querySelector('.material-symbols-outlined')).toBeNull();
    // 이모지(📷 등) 없음
    expect(container.textContent).toBe('웨딩촬영');
  });

  it.each([
    ['WEDDING_PHOTO', '웨딩촬영'],
    ['STUDIO_DRESS_MAKEUP', '스드메'],
    ['VENUE', '예식장'],
    ['GIFT', '예물·예단'],
    ['INVITATION', '청첩장'],
    ['REHEARSAL', '리허설'],
    ['CEREMONY', '본식'],
    ['HONEYMOON', '신혼여행'],
    ['ETC', '기타'],
  ] as const)('%s — %s 라벨 렌더링', (category, label) => {
    render(<CategoryBadge category={category} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('size sm 렌더링', () => {
    render(<CategoryBadge category="WEDDING_PHOTO" size="sm" />);
    expect(screen.getByText('웨딩촬영')).toBeInTheDocument();
  });

  it('size md 렌더링 (기본값)', () => {
    render(<CategoryBadge category="WEDDING_PHOTO" />);
    expect(screen.getByText('웨딩촬영')).toBeInTheDocument();
  });

  it('data-category 속성이 설정된다', () => {
    const { container } = render(<CategoryBadge category="CEREMONY" />);
    expect(container.querySelector('[data-category="CEREMONY"]')).toBeInTheDocument();
  });
});
