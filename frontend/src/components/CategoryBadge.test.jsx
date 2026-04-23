// @TASK P2-S1-T4 - CategoryBadge 테스트
// @SPEC docs/planning/06-tasks.md#P2-S1-T4

import { render, screen } from '@testing-library/react';
import CategoryBadge, { CATEGORY_EMOJIS } from './CategoryBadge';
import { CATEGORIES, CATEGORY_LABELS } from '../constants/enums';

describe('CategoryBadge', () => {
  it('9개 카테고리 각각 올바른 한국어 라벨을 렌더링한다', () => {
    const categories = Object.values(CATEGORIES);
    categories.forEach((cat) => {
      const { unmount } = render(<CategoryBadge category={cat} />);
      expect(screen.getByText(CATEGORY_LABELS[cat])).toBeInTheDocument();
      unmount();
    });
  });

  it('9개 카테고리 각각 올바른 이모지를 렌더링한다', () => {
    const categories = Object.values(CATEGORIES);
    categories.forEach((cat) => {
      const { unmount } = render(<CategoryBadge category={cat} />);
      expect(screen.getByText(CATEGORY_EMOJIS[cat])).toBeInTheDocument();
      unmount();
    });
  });

  it('WEDDING_PHOTO — 웨딩촬영 + 📷', () => {
    render(<CategoryBadge category="WEDDING_PHOTO" />);
    expect(screen.getByText('웨딩촬영')).toBeInTheDocument();
    expect(screen.getByText('📷')).toBeInTheDocument();
  });

  it('STUDIO_DRESS_MAKEUP — 스드메 + 💄', () => {
    render(<CategoryBadge category="STUDIO_DRESS_MAKEUP" />);
    expect(screen.getByText('스드메')).toBeInTheDocument();
    expect(screen.getByText('💄')).toBeInTheDocument();
  });

  it('VENUE — 예식장 + 🏛️', () => {
    render(<CategoryBadge category="VENUE" />);
    expect(screen.getByText('예식장')).toBeInTheDocument();
    expect(screen.getByText('🏛️')).toBeInTheDocument();
  });

  it('GIFT — 예물·예단 + 💍', () => {
    render(<CategoryBadge category="GIFT" />);
    expect(screen.getByText('예물·예단')).toBeInTheDocument();
    expect(screen.getByText('💍')).toBeInTheDocument();
  });

  it('INVITATION — 청첩장 + ✉️', () => {
    render(<CategoryBadge category="INVITATION" />);
    expect(screen.getByText('청첩장')).toBeInTheDocument();
    expect(screen.getByText('✉️')).toBeInTheDocument();
  });

  it('REHEARSAL — 리허설 + 🎭', () => {
    render(<CategoryBadge category="REHEARSAL" />);
    expect(screen.getByText('리허설')).toBeInTheDocument();
    expect(screen.getByText('🎭')).toBeInTheDocument();
  });

  it('CEREMONY — 본식 + 💒', () => {
    render(<CategoryBadge category="CEREMONY" />);
    expect(screen.getByText('본식')).toBeInTheDocument();
    expect(screen.getByText('💒')).toBeInTheDocument();
  });

  it('HONEYMOON — 신혼여행 + ✈️', () => {
    render(<CategoryBadge category="HONEYMOON" />);
    expect(screen.getByText('신혼여행')).toBeInTheDocument();
    expect(screen.getByText('✈️')).toBeInTheDocument();
  });

  it('ETC — 기타 + 📌', () => {
    render(<CategoryBadge category="ETC" />);
    expect(screen.getByText('기타')).toBeInTheDocument();
    expect(screen.getByText('📌')).toBeInTheDocument();
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
