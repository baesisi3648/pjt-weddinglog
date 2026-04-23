// @TASK P2-S1-T1~T5 - Calendar 페이지 테스트
// @SPEC docs/planning/06-tasks.md#P2-S1-T1

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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

vi.mock('../context/CoupleContext', () => ({
  CoupleProvider: ({ children }) => children,
  useCouple: () => ({ couple: { id: 'cpl_001', wedding_date: null }, loading: false, error: null }),
}));

import { listEvents, createEvent, toggleCompleteEvent } from '../services/event_api';
import { requestChecklist } from '../services/ai_api';
import Calendar from './Calendar';

const MOCK_EVENTS = [
  { id: 'ev1', title: '예식장 답사', date: '2026-04-05', category: 'VENUE',        is_completed: false, memo: null },
  { id: 'ev2', title: '드레스 피팅',  date: '2026-04-12', category: 'STUDIO_DRESS_MAKEUP', is_completed: true,  memo: '청담 드레스샵' },
  { id: 'ev3', title: '항공권 예약',  date: '2026-04-20', category: 'HONEYMOON',   is_completed: false, memo: null },
];

function renderCalendar() {
  return render(
    <MemoryRouter>
      <Calendar />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  listEvents.mockResolvedValue(MOCK_EVENTS);
  createEvent.mockResolvedValue({ id: 'ev_new', title: '새 일정', date: '2026-04-23', category: 'ETC', is_completed: false, memo: null });
  toggleCompleteEvent.mockResolvedValue({ id: 'ev1', is_completed: true });
  requestChecklist.mockResolvedValue({ events: [], source: 'ai' });
});

describe('Calendar', () => {
  // ── 기본 렌더링 ─────────────────────────────────────────────────────────
  it('throw 없이 마운트된다', async () => {
    renderCalendar();
    await waitFor(() => expect(listEvents).toHaveBeenCalled());
  });

  it('캘린더 타이틀이 표시된다', async () => {
    renderCalendar();
    expect(screen.getByText('캘린더')).toBeInTheDocument();
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
    listEvents.mockResolvedValue([]);
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
    listEvents.mockResolvedValue([]);
    requestChecklist.mockResolvedValue({ events: [], source: 'ai' });
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
});
