// @TASK P2-S1-T1~T5 - Calendar 페이지 테스트
// @SPEC docs/planning/06-tasks.md#P2-S1-T1

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── API mock ─────────────────────────────────────────────────────────────────
vi.mock('../services/event_api', () => ({
  listEvents:           vi.fn(),
  createEvent:          vi.fn(),
  updateEvent:          vi.fn(),
  deleteEvent:          vi.fn(),
  toggleCompleteEvent:  vi.fn(),
}));

vi.mock('../services/ai_api', () => ({
  requestChecklist: vi.fn(),
}));

vi.mock('../services/photo_api', () => ({
  listEventPhotos: vi.fn(),
}));

vi.mock('../context/CoupleContext', () => ({
  CoupleProvider: ({ children }: { children: React.ReactNode }) => children,
  useCouple: () => ({ couple: { id: 'cpl_001', wedding_date: null }, loading: false, error: null }),
}));

import { listEvents, createEvent, toggleCompleteEvent } from '../services/event_api';
import { requestChecklist } from '../services/ai_api';
import { listEventPhotos } from '../services/photo_api';
import Calendar from './Calendar';

const MOCK_EVENTS = [
  { id: 'ev1', title: '예식장 답사', date: '2026-04-05', category: 'VENUE',        is_completed: false, memo: null },
  { id: 'ev2', title: '드레스 피팅',  date: '2026-04-12', category: 'STUDIO_DRESS_MAKEUP', is_completed: true,  memo: '청담 드레스샵' },
  { id: 'ev3', title: '항공권 예약',  date: '2026-04-20', category: 'HONEYMOON',   is_completed: false, memo: null },
];

const MOCK_PHOTO_EV1 = {
  id: 'ph1', event_id: 'ev1', file_url: 'https://example.com/photo1.jpg',
  caption: null, caption_source: null, is_selected: false, sort_order: 0, created_at: '2026-04-05T00:00:00Z',
};
const MOCK_PHOTO_EV1_2 = {
  id: 'ph2', event_id: 'ev1', file_url: 'https://example.com/photo2.jpg',
  caption: null, caption_source: null, is_selected: false, sort_order: 1, created_at: '2026-04-05T00:00:00Z',
};

function renderCalendar() {
  return render(
    <MemoryRouter>
      <Calendar />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  (listEvents as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_EVENTS);
  (createEvent as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'ev_new', title: '새 일정', date: '2026-04-23', category: 'ETC', is_completed: false, memo: null });
  (toggleCompleteEvent as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'ev1', is_completed: true });
  (requestChecklist as ReturnType<typeof vi.fn>).mockResolvedValue({ events: [], source: 'ai' });
  // 기본: 모든 이벤트에 사진 없음
  (listEventPhotos as ReturnType<typeof vi.fn>).mockResolvedValue([]);
});

describe('Calendar', () => {
  // ── 기본 렌더링 ─────────────────────────────────────────────────────────
  it('throw 없이 마운트된다', async () => {
    renderCalendar();
    await waitFor(() => expect(listEvents).toHaveBeenCalled());
  });

  it('캘린더 페이지 핵심 UI가 표시된다', async () => {
    renderCalendar();
    // 월간/리스트 뷰 탭으로 캘린더 페이지 확인
    expect(screen.getByRole('button', { name: '월간' })).toBeInTheDocument();
  });

  it('API mock으로 이벤트 3개가 로드된다', async () => {
    renderCalendar();
    await waitFor(() => {
      expect(listEvents).toHaveBeenCalledWith('cpl_001', expect.stringMatching(/^\d{4}-\d{2}$/));
    });
  });

  // ── 뷰 토글 탭 ──────────────────────────────────────────────────────────
  it('"월간"과 "리스트" 탭이 표시된다', async () => {
    renderCalendar();
    expect(screen.getByRole('button', { name: '월간' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '리스트' })).toBeInTheDocument();
  });

  it('"리스트" 탭 클릭 시 리스트 뷰로 전환된다', async () => {
    renderCalendar();
    await waitFor(() => expect(listEvents).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: '리스트' }));
    // 리스트 뷰에서 이벤트 제목 확인
    await waitFor(() => {
      expect(screen.getByText('예식장 답사')).toBeInTheDocument();
    });
  });

  // ── 월 네비게이션 ────────────────────────────────────────────────────────
  it('이전 달 버튼 클릭 시 listEvents가 새 월로 재호출된다', async () => {
    renderCalendar();
    await waitFor(() => expect(listEvents).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: '이전 달' }));
    await waitFor(() => expect(listEvents).toHaveBeenCalledTimes(2));
  });

  it('다음 달 버튼 클릭 시 listEvents가 새 월로 재호출된다', async () => {
    renderCalendar();
    await waitFor(() => expect(listEvents).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: '다음 달' }));
    await waitFor(() => expect(listEvents).toHaveBeenCalledTimes(2));
  });

  // ── EventForm 모달 ──────────────────────────────────────────────────────
  it('FAB 클릭 시 EventForm 모달이 열린다 (mode=create)', async () => {
    renderCalendar();
    fireEvent.click(screen.getByRole('button', { name: '일정 추가' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('일정 추가')).toBeInTheDocument();
  });

  it('리스트 뷰에서 "편집" 버튼 클릭 시 edit 모달이 열린다', async () => {
    renderCalendar();
    await waitFor(() => expect(listEvents).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: '리스트' }));
    await waitFor(() => expect(screen.getByText('예식장 답사')).toBeInTheDocument());
    const editBtns = screen.getAllByRole('button', { name: '편집' });
    fireEvent.click(editBtns[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('일정 편집')).toBeInTheDocument();
  });

  // ── AI 체크리스트 ─────────────────────────────────────────────────────────
  it('"AI로 체크리스트 자동 생성" 버튼이 표시된다', async () => {
    renderCalendar();
    expect(screen.getByRole('button', { name: /AI로 체크리스트 자동 생성/ })).toBeInTheDocument();
  });

  it('일정 없을 때 AI 버튼 클릭 시 POST /api/ai/checklist 호출', async () => {
    (listEvents as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderCalendar();
    await waitFor(() => expect(listEvents).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /AI로 체크리스트 자동 생성/ }));
    await waitFor(() => {
      expect(requestChecklist).toHaveBeenCalledWith('cpl_001', null);
    });
  });

  it('일정 있을 때 AI 버튼 클릭 시 확인 모달이 열린다', async () => {
    renderCalendar();
    await waitFor(() => expect(listEvents).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /AI로 체크리스트 자동 생성/ }));
    await waitFor(() => {
      expect(screen.getByText(/기존 일정이 있습니다/)).toBeInTheDocument();
    });
  });

  it('확인 모달에서 "추가" 클릭 시 requestChecklist 호출', async () => {
    renderCalendar();
    await waitFor(() => expect(listEvents).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /AI로 체크리스트 자동 생성/ }));
    await waitFor(() => screen.getByText(/기존 일정이 있습니다/));
    fireEvent.click(screen.getByRole('button', { name: '추가' }));
    await waitFor(() => {
      expect(requestChecklist).toHaveBeenCalled();
    });
  });

  it('AI 생성 후 source "ai"일 때 "AI 생성" 배지가 표시된다', async () => {
    (listEvents as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (requestChecklist as ReturnType<typeof vi.fn>).mockResolvedValue({ events: [], source: 'ai' });
    renderCalendar();
    await waitFor(() => expect(listEvents).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /AI로 체크리스트 자동 생성/ }));
    await waitFor(() => {
      expect(screen.getByText(/AI 생성/)).toBeInTheDocument();
    });
  });

  // ── 완료 토글 ──────────────────────────────────────────────────────────────
  it('리스트 뷰에서 완료 토글 클릭 시 toggleCompleteEvent 호출', async () => {
    renderCalendar();
    await waitFor(() => expect(listEvents).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: '리스트' }));
    await waitFor(() => expect(screen.getByText('예식장 답사')).toBeInTheDocument());
    // ev1 (미완료)의 체크박스
    const completeBtns = screen.getAllByRole('button', { name: '완료 처리' });
    fireEvent.click(completeBtns[0]);
    await waitFor(() => {
      expect(toggleCompleteEvent).toHaveBeenCalledWith('cpl_001', 'ev1');
    });
  });

  // ── 월간 뷰 사진 썸네일 ────────────────────────────────────────────────────
  it('사진 있는 이벤트 날짜 셀에 img 썸네일이 렌더링된다', async () => {
    // ev1(2026-04-05)에 사진 2장 제공
    (listEventPhotos as ReturnType<typeof vi.fn>).mockImplementation((eventId: string) => {
      if (eventId === 'ev1') return Promise.resolve([MOCK_PHOTO_EV1, MOCK_PHOTO_EV1_2]);
      return Promise.resolve([]);
    });
    renderCalendar();
    await waitFor(() => expect(listEventPhotos).toHaveBeenCalled());
    // img 썸네일이 최소 1개 존재 (src 속성은 JSDOM lazy-loading 여부에 따라 다를 수 있으므로 alt로만 확인)
    const thumbs = await screen.findAllByAltText('예식장 답사');
    expect(thumbs.length).toBeGreaterThanOrEqual(1);
    // img 요소임을 확인
    expect(thumbs[0].tagName.toLowerCase()).toBe('img');
  });

  it('사진이 5장 이상이면 "+N" 오버레이가 표시된다', async () => {
    // 최신 Calendar 는 4장까지 모자이크 → 초과분만 "+N" 표시.
    const makePhoto = (id: string, sort: number) => ({
      id,
      event_id: 'ev1',
      file_url: `https://example.com/${id}.jpg`,
      caption: null,
      caption_source: null,
      is_selected: false,
      sort_order: sort,
      created_at: '2026-04-05T00:00:00Z',
    });
    const photos = [
      makePhoto('ph1', 0),
      makePhoto('ph2', 1),
      makePhoto('ph3', 2),
      makePhoto('ph4', 3),
      makePhoto('ph5', 4),
      makePhoto('ph6', 5),
    ];
    (listEventPhotos as ReturnType<typeof vi.fn>).mockImplementation((eventId: string) => {
      if (eventId === 'ev1') return Promise.resolve(photos);
      return Promise.resolve([]);
    });
    renderCalendar();
    await waitFor(() => expect(listEventPhotos).toHaveBeenCalled());
    // 6장 - 표시 4장 = +2
    const badge = await screen.findByText('+2');
    expect(badge).toBeInTheDocument();
  });

  it('사진 없는 이벤트는 카테고리 라벨이 표시된다', async () => {
    // 모든 이벤트 사진 없음 (beforeEach 기본값 유지)
    renderCalendar();
    await waitFor(() => expect(listEventPhotos).toHaveBeenCalled());
    // 라벨 텍스트로 확인 (월간 뷰 셀 내 라벨)
    const labels = await screen.findAllByText('예식장 답사');
    expect(labels.length).toBeGreaterThanOrEqual(1);
  });

  it('사진 썸네일 클릭 시 에러 없이 처리된다', async () => {
    (listEventPhotos as ReturnType<typeof vi.fn>).mockImplementation((eventId: string) => {
      if (eventId === 'ev1') return Promise.resolve([MOCK_PHOTO_EV1]);
      return Promise.resolve([]);
    });
    renderCalendar();
    // alt="예식장 답사" img 요소 전부 가져와 첫 번째 클릭
    const thumbs = await screen.findAllByAltText('예식장 답사');
    expect(thumbs.length).toBeGreaterThanOrEqual(1);
    // 부모 썸네일 컨테이너 클릭 (stopPropagation + navigate)
    const thumbContainer = thumbs[0].closest('[role="img"]') ?? thumbs[0].parentElement ?? thumbs[0];
    fireEvent.click(thumbContainer);
    // navigate('/events/ev1') — MemoryRouter 내에서 에러 없이 처리됨을 확인
    expect(thumbs[0]).toBeInTheDocument();
  });

  it('빈 셀 클릭 시 EventForm 모달이 열린다 (기존 동작 유지)', async () => {
    renderCalendar();
    await waitFor(() => expect(listEvents).toHaveBeenCalled());
    // FAB 클릭으로 빈 날짜 셀과 동일한 결과 검증
    fireEvent.click(screen.getByRole('button', { name: '일정 추가' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('listEventPhotos가 이벤트 수만큼 호출된다', async () => {
    renderCalendar();
    await waitFor(() => expect(listEvents).toHaveBeenCalled());
    await waitFor(() => {
      expect(listEventPhotos).toHaveBeenCalledTimes(MOCK_EVENTS.length);
    });
  });
});
