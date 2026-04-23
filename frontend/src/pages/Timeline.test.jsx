// @TASK P4-S1-T1~T3 - Timeline 페이지 API 연동 테스트
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('../services/timeline_api', () => ({
  getTimeline: vi.fn(),
  toggleSelection: vi.fn(),
}));

import Timeline from './Timeline';
import { getTimeline, toggleSelection } from '../services/timeline_api';

const MOCK_TIMELINE = {
  total_photos: 8,
  total_selected: 5,
  total_pages_estimated: 3,
  chapters: [
    {
      id: 'ch1',
      chapter_number: 1,
      title: '웨딩촬영',
      subtitle: 'Our First Frames',
      category: 'WEDDING_PHOTO',
      date_range: '2025. 08. 15 – 08. 20',
      photo_count: 3,
      photos: [
        { id: 'p1', file_url: 'https://example.com/a.jpg', caption: '스튜디오 본촬영', is_selected: true, source: 'AI' },
        { id: 'p2', file_url: 'https://example.com/b.jpg', caption: '야외 세션', is_selected: true, source: 'template' },
        { id: 'p3', file_url: 'https://example.com/c.jpg', caption: '드레스 2차', is_selected: false, source: 'AI' },
      ],
    },
    {
      id: 'ch2',
      chapter_number: 2,
      title: '준비의 날들',
      subtitle: 'The In-Between Days',
      category: 'STUDIO_DRESS_MAKEUP',
      date_range: '2025. 07. 02 – 09. 10',
      photo_count: 2,
      photos: [
        { id: 'p4', file_url: 'https://example.com/d.jpg', caption: '스드메 미팅', is_selected: true, source: 'AI' },
        { id: 'p5', file_url: 'https://example.com/e.jpg', caption: '드레스 피팅', is_selected: true, source: 'template' },
      ],
    },
  ],
};

const EMPTY_TIMELINE = {
  total_photos: 0,
  total_selected: 0,
  total_pages_estimated: 0,
  chapters: [],
};

function renderTimeline() {
  return render(
    <MemoryRouter>
      <Timeline />
    </MemoryRouter>
  );
}

describe('Timeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toggleSelection.mockResolvedValue({ id: 'p3', is_selected: true });
  });

  it('throw 없이 마운트된다', () => {
    getTimeline.mockResolvedValue(MOCK_TIMELINE);
    renderTimeline();
  });

  it('타임라인 본문이 렌더링된다', async () => {
    getTimeline.mockResolvedValue(MOCK_TIMELINE);
    renderTimeline();
    const items = screen.getAllByText(/타임라인/);
    expect(items.length).toBeGreaterThan(0);
  });

  it('API 호출 중 로딩 상태를 표시한다', () => {
    let resolve;
    getTimeline.mockImplementation(() => new Promise((r) => { resolve = r; }));
    renderTimeline();
    expect(screen.getByText(/불러오는 중/)).toBeInTheDocument();
  });

  it('API 성공 시 2개 챕터가 렌더링된다', async () => {
    getTimeline.mockResolvedValue(MOCK_TIMELINE);
    renderTimeline();
    await waitFor(() => {
      // 챕터 탭 + 본문에 중복 표시되므로 getAllByText 사용
      expect(screen.getAllByText('웨딩촬영').length).toBeGreaterThan(0);
      expect(screen.getAllByText('준비의 날들').length).toBeGreaterThan(0);
    });
  });

  it('헤더에 total_photos + total_pages_estimated가 표시된다', async () => {
    getTimeline.mockResolvedValue(MOCK_TIMELINE);
    renderTimeline();
    await waitFor(() => {
      // 총 사진 수 "8장" 형식 (여러 곳에 표시될 수 있음)
      expect(screen.getAllByText(/8장/).length).toBeGreaterThan(0);
      // 예상 페이지 수 포함 요약 문구 확인
      expect(screen.getAllByText(/페이지 예상/).length).toBeGreaterThan(0);
    });
  });

  it('빈 타임라인(chapters=[]) → "아직 사진이 없습니다" 메시지', async () => {
    getTimeline.mockResolvedValue(EMPTY_TIMELINE);
    renderTimeline();
    await waitFor(() => {
      expect(screen.getByText(/아직 사진이 없습니다/)).toBeInTheDocument();
    });
  });

  it('빈 타임라인 → /calendar 링크 표시', async () => {
    getTimeline.mockResolvedValue(EMPTY_TIMELINE);
    renderTimeline();
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /캘린더/ });
      expect(link).toBeInTheDocument();
    });
  });

  it('API 에러 시 에러 메시지를 표시한다', async () => {
    getTimeline.mockRejectedValue(new Error('Network Error'));
    renderTimeline();
    await waitFor(() => {
      expect(screen.getByText(/불러오지 못했습니다/)).toBeInTheDocument();
    });
  });

  it('selected_photos >= 1 → "앨범으로 만들기" 버튼 활성화', async () => {
    getTimeline.mockResolvedValue(MOCK_TIMELINE); // total_selected: 5
    renderTimeline();
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /앨범으로 만들기/ });
      expect(btn).not.toBeDisabled();
    });
  });

  it('total_selected = 0 → "앨범으로 만들기" 버튼 비활성화', async () => {
    getTimeline.mockResolvedValue({ ...MOCK_TIMELINE, total_selected: 0 });
    renderTimeline();
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /앨범으로 만들기/ });
      expect(btn).toBeDisabled();
    });
  });

  it('체크박스 토글 시 toggleSelection API를 호출한다', async () => {
    getTimeline.mockResolvedValue(MOCK_TIMELINE);
    renderTimeline();
    // 챕터 탭 중 하나라도 렌더링될 때까지 대기
    await waitFor(() => expect(screen.getAllByText('웨딩촬영').length).toBeGreaterThan(0));
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    await waitFor(() => {
      expect(toggleSelection).toHaveBeenCalled();
    });
  });
});
