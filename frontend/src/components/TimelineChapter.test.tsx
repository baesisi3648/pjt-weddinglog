// @TASK P4-S1-T2 - TimelineChapter 컴포넌트 테스트
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('../services/timeline_api', () => ({
  toggleSelection: vi.fn(),
}));

import TimelineChapter from './TimelineChapter';
import { toggleSelection } from '../services/timeline_api';

const SAMPLE_CHAPTER = {
  id: 1,
  chapter_number: 1,
  title: '웨딩촬영',
  subtitle: 'Our First Frames',
  category: 'WEDDING_PHOTO',
  date_range: '2025. 08. 15 – 08. 20',
  photo_count: 3,
  photos: [
    { id: 'p1', file_url: 'https://example.com/a.jpg', caption: '스튜디오 본촬영', is_selected: true, source: 'AI' },
    { id: 'p2', file_url: 'https://example.com/b.jpg', caption: '야외 세션', is_selected: false, source: 'template' },
    { id: 'p3', file_url: 'https://example.com/c.jpg', caption: '드레스 2차', is_selected: true, source: 'AI' },
  ],
};

function renderChapter(props: Partial<Parameters<typeof TimelineChapter>[0]> = {}) {
  return render(
    <MemoryRouter>
      <TimelineChapter chapter={SAMPLE_CHAPTER as Parameters<typeof TimelineChapter>[0]['chapter']} onSelectionChange={() => {}} {...props} />
    </MemoryRouter>
  );
}

describe('TimelineChapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (toggleSelection as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'p1', is_selected: false });
  });

  it('챕터 헤더가 렌더링된다 — 번호, 제목, 사진 개수', () => {
    renderChapter();
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('웨딩촬영')).toBeInTheDocument();
    // 사진 개수 표시 (photo_count)
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it('챕터 부제목이 렌더링된다', () => {
    renderChapter();
    expect(screen.getByText('Our First Frames')).toBeInTheDocument();
  });

  it('날짜 범위가 렌더링된다', () => {
    renderChapter();
    expect(screen.getByText(/2025. 08. 15/)).toBeInTheDocument();
  });

  it('사진 그리드가 photo_count만큼 렌더링된다', () => {
    renderChapter();
    const imgs = screen.getAllByRole('img');
    expect(imgs.length).toBe(3);
  });

  it('각 사진에 캡션이 표시된다', () => {
    renderChapter();
    expect(screen.getByText('스튜디오 본촬영')).toBeInTheDocument();
    expect(screen.getByText('야외 세션')).toBeInTheDocument();
  });

  it('is_selected=false인 사진은 opacity 스타일이 낮다', () => {
    renderChapter();
    // 미선택 사진 카드에 data-selected="false" 속성 확인
    const unselected = document.querySelector('[data-selected="false"]');
    expect(unselected).toBeTruthy();
  });

  it('source 배지가 표시된다 (자동/template)', () => {
    renderChapter();
    const aiBadges = screen.getAllByText('자동');
    expect(aiBadges.length).toBeGreaterThan(0);
  });

  it('체크박스 클릭 시 toggleSelection API 호출', async () => {
    const onSelectionChange = vi.fn();
    renderChapter({ onSelectionChange });
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    await waitFor(() => {
      expect(toggleSelection).toHaveBeenCalledWith('p1');
    });
  });

  it('optimistic UI: 체크박스 클릭 시 즉시 상태 반영', async () => {
    renderChapter();
    const checkboxes = screen.getAllByRole('checkbox');
    // p1은 is_selected=true → 체크됨
    expect(checkboxes[0]).toBeChecked();
    fireEvent.click(checkboxes[0]);
    // 즉시 unchecked로 변경
    await waitFor(() => {
      expect(checkboxes[0]).not.toBeChecked();
    });
  });

  it('캡션 더블클릭 시 인라인 편집 모드 진입', () => {
    renderChapter();
    const caption = screen.getByText('스튜디오 본촬영');
    fireEvent.dblClick(caption);
    // input 필드가 나타남
    expect(screen.getByDisplayValue('스튜디오 본촬영')).toBeInTheDocument();
  });
});
