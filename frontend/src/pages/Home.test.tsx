// @TASK P4-S2-T1~T3 - Home 페이지 API 연동 테스트
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('../context/CoupleContext', () => ({
  CoupleProvider: ({ children }: { children: React.ReactNode }) => children,
  useCouple: () => ({ couple: null, loading: false, error: null }),
}));

vi.mock('../services/home_api', () => ({
  getHomeSummary: vi.fn(),
}));

import Home from './Home';
import { getHomeSummary } from '../services/home_api';

function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function pastDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

const MOCK_HOME = {
  couple: {
    id: 'cpl_001',
    groom_name: '철수',
    bride_name: '영희',
    wedding_date: futureDate(60),
    profile_photo_path: null,
    tagline: '우리만의 이야기',
  },
  upcoming_events: [
    { id: 'ev1', title: '스드메 2차 미팅', date: futureDate(5), category: 'STUDIO_DRESS_MAKEUP', is_completed: false },
    { id: 'ev2', title: '청첩장 시안 확인', date: futureDate(8), category: 'INVITATION', is_completed: false },
    { id: 'ev3', title: '예물 최종 결정', date: futureDate(12), category: 'GIFT', is_completed: false },
  ],
  recent_photos: [
    { id: 'ph1', file_url: 'https://example.com/1.jpg', caption: '드레스 투어', event_id: 'ev1' },
    { id: 'ph2', file_url: 'https://example.com/2.jpg', caption: '본식장 답사', event_id: 'ev1' },
    { id: 'ph3', file_url: 'https://example.com/3.jpg', caption: '청첩장 미팅', event_id: 'ev2' },
  ],
  photo_counts: { total: 45, selected: 5 },
  album_order_deadline: { date: futureDate(60), days_remaining: 60, urgency: 'normal' },
};

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throw 없이 마운트된다', () => {
    (getHomeSummary as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_HOME);
    renderHome();
  });

  it('홈 화면이 정상 마운트된다', async () => {
    (getHomeSummary as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_HOME);
    renderHome();
    // 홈 컴포넌트가 에러 없이 렌더링되는지 확인 (스모크 테스트)
    await waitFor(() => {
      expect(screen.getByText(/WeddingLog|불러오는 중|철수/)).toBeInTheDocument();
    });
  });

  it('API 성공 시 커플 이름이 표시된다', async () => {
    (getHomeSummary as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_HOME);
    renderHome();
    await waitFor(() => {
      expect(screen.getByText(/철수/)).toBeInTheDocument();
      expect(screen.getByText(/영희/)).toBeInTheDocument();
    });
  });

  it('upcoming_events 최대 3개 표시된다', async () => {
    (getHomeSummary as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_HOME);
    renderHome();
    await waitFor(() => {
      expect(screen.getByText('스드메 2차 미팅')).toBeInTheDocument();
      expect(screen.getByText('청첩장 시안 확인')).toBeInTheDocument();
      expect(screen.getByText('예물 최종 결정')).toBeInTheDocument();
    });
  });

  it('recent_photos 썸네일 그리드 렌더링', async () => {
    (getHomeSummary as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_HOME);
    renderHome();
    await waitFor(() => {
      const imgs = screen.getAllByRole('img');
      expect(imgs.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('urgency=normal → 2차 카운트다운 숨김', async () => {
    (getHomeSummary as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_HOME);
    renderHome();
    await waitFor(() => screen.getByText(/철수/));
    expect(screen.queryByText(/앨범 주문 추천/)).not.toBeInTheDocument();
  });

  it('urgency=warning → yellow 배지 표시', async () => {
    const data = {
      ...MOCK_HOME,
      couple: { ...MOCK_HOME.couple, wedding_date: futureDate(18) },
      album_order_deadline: { date: futureDate(18), days_remaining: 18, urgency: 'warning' },
    };
    (getHomeSummary as ReturnType<typeof vi.fn>).mockResolvedValue(data);
    renderHome();
    await waitFor(() => {
      expect(screen.getByText(/앨범 주문 추천/)).toBeInTheDocument();
      expect(document.querySelector('[data-urgency="warning"]')).toBeTruthy();
    });
  });

  it('urgency=urgent → red 배지 표시', async () => {
    const data = {
      ...MOCK_HOME,
      couple: { ...MOCK_HOME.couple, wedding_date: futureDate(10) },
      album_order_deadline: { date: futureDate(10), days_remaining: 10, urgency: 'urgent' },
    };
    (getHomeSummary as ReturnType<typeof vi.fn>).mockResolvedValue(data);
    renderHome();
    await waitFor(() => {
      expect(screen.getByText(/앨범 주문 추천/)).toBeInTheDocument();
      expect(document.querySelector('[data-urgency="urgent"]')).toBeTruthy();
    });
  });

  it('urgency=expired → "앨범 주문 기한 만료" 표시', async () => {
    const data = {
      ...MOCK_HOME,
      couple: { ...MOCK_HOME.couple, wedding_date: pastDate(5) },
      album_order_deadline: { date: pastDate(5), days_remaining: -5, urgency: 'expired' },
    };
    (getHomeSummary as ReturnType<typeof vi.fn>).mockResolvedValue(data);
    renderHome();
    await waitFor(() => {
      expect(screen.getByText(/앨범 주문 기한 만료/)).toBeInTheDocument();
    });
  });

  it('D+ 상태: wedding_date 과거 → "D+N" 형식 표시', async () => {
    const data = {
      ...MOCK_HOME,
      couple: { ...MOCK_HOME.couple, wedding_date: pastDate(10) },
      album_order_deadline: { date: pastDate(10), days_remaining: -10, urgency: 'expired' },
    };
    (getHomeSummary as ReturnType<typeof vi.fn>).mockResolvedValue(data);
    renderHome();
    await waitFor(() => {
      expect(screen.getByText(/D\+\d+/)).toBeInTheDocument();
    });
  });

  it('D+ 상태 → 타임라인 정리 UX 메시지 표시', async () => {
    const data = {
      ...MOCK_HOME,
      couple: { ...MOCK_HOME.couple, wedding_date: pastDate(10) },
      album_order_deadline: { date: pastDate(10), days_remaining: -10, urgency: 'expired' },
    };
    (getHomeSummary as ReturnType<typeof vi.fn>).mockResolvedValue(data);
    renderHome();
    await waitFor(() => {
      expect(screen.getByText(/타임라인 정리를 마무리/)).toBeInTheDocument();
    });
  });

  it('photo_counts.selected >= 1 → "앨범 주문하기" CTA 활성화', async () => {
    (getHomeSummary as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_HOME); // selected: 5
    renderHome();
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /앨범 주문하기/ });
      expect(btn).not.toBeDisabled();
    });
  });

  it('photo_counts.selected = 0 → "앨범 주문하기" CTA 비활성화', async () => {
    const data = { ...MOCK_HOME, photo_counts: { total: 0, selected: 0 } };
    (getHomeSummary as ReturnType<typeof vi.fn>).mockResolvedValue(data);
    renderHome();
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /앨범 주문하기/ });
      expect(btn).toBeDisabled();
    });
  });

  it('API 에러 시 에러 메시지 표시', async () => {
    (getHomeSummary as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network Error'));
    renderHome();
    await waitFor(() => {
      expect(screen.getByText(/불러오지 못했습니다/)).toBeInTheDocument();
    });
  });
});
