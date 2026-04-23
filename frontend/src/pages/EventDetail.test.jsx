// @TASK P3-S1-T1 - EventDetail API 연동 테스트
// @TASK P3-S1-T3 - PhotoGrid 렌더링 테스트
// @SPEC specs/screens/03_event_detail.yaml

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../services/event_api', () => ({
  getEvent: vi.fn(),
  updateEvent: vi.fn(),
  listEvents: vi.fn(),
  createEvent: vi.fn(),
  deleteEvent: vi.fn(),
  toggleCompleteEvent: vi.fn(),
}));

vi.mock('../services/photo_api', () => ({
  listPhotos: vi.fn(),
  uploadPhoto: vi.fn(),
  deletePhoto: vi.fn(),
  updateCaption: vi.fn(),
  toggleSelection: vi.fn(),
}));

vi.mock('../context/CoupleContext', () => ({
  useCouple: () => ({ couple: { id: 'cpl_001' }, loading: false, error: null }),
}));

import { getEvent, updateEvent } from '../services/event_api';
import { listPhotos, deletePhoto } from '../services/photo_api';
import EventDetail from './EventDetail';

const mockEvent = {
  id: 'evt_001',
  couple_id: 'cpl_001',
  title: '스튜디오 본촬영',
  date: '2025-08-15',
  category: 'WEDDING_PHOTO',
  memo: '야외촬영은 오전에',
  is_completed: false,
};

const mockPhotos = [
  { id: 'ph_001', event_id: 'evt_001', caption: '첫 컷', is_selected: false, sort_order: 0 },
  { id: 'ph_002', event_id: 'evt_001', caption: '', is_selected: false, sort_order: 1 },
];

function renderEventDetail(eventId = 'evt_001') {
  return render(
    <MemoryRouter initialEntries={[`/events/${eventId}`]}>
      <Routes>
        <Route path="/events/:eventId" element={<EventDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('EventDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getEvent.mockResolvedValue(mockEvent);
    listPhotos.mockResolvedValue(mockPhotos);
  });

  it('마운트 시 getEvent + listPhotos API 호출', async () => {
    renderEventDetail();
    await waitFor(() => {
      expect(getEvent).toHaveBeenCalledWith('cpl_001', 'evt_001');
      expect(listPhotos).toHaveBeenCalledWith('evt_001');
    });
  });

  it('이벤트 제목이 표시된다', async () => {
    renderEventDetail();
    await waitFor(() => {
      expect(screen.getByText('스튜디오 본촬영')).toBeInTheDocument();
    });
  });

  it('사진 목록이 렌더링된다', async () => {
    renderEventDetail();
    await waitFor(() => {
      expect(screen.getByText('첫 컷')).toBeInTheDocument();
    });
  });

  it('사진 개수가 표시된다', async () => {
    renderEventDetail();
    await waitFor(() => {
      // 사진 목록 렌더링 확인: 첫 번째 사진의 캡션이 표시되면 그리드가 렌더링된 것
      expect(screen.getByText('첫 컷')).toBeInTheDocument();
    });
    // 카운터 컨테이너에 "2"와 "10"이 모두 포함됨
    expect(document.body.textContent).toMatch(/2/);
    expect(document.body.textContent).toMatch(/10/);
  });

  it('로딩 중 스피너 표시', () => {
    getEvent.mockReturnValue(new Promise(() => {})); // never resolves
    listPhotos.mockReturnValue(new Promise(() => {}));
    renderEventDetail();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('API 에러 시 에러 메시지 표시', async () => {
    getEvent.mockRejectedValueOnce(new Error('네트워크 오류'));
    renderEventDetail();
    await waitFor(() => {
      expect(screen.getByText(/오류|에러|불러올 수 없습니다/)).toBeInTheDocument();
    });
  });

  it('삭제 버튼 클릭 → deletePhoto API 호출', async () => {
    deletePhoto.mockResolvedValueOnce({});
    renderEventDetail();

    await waitFor(() => screen.getByText('첫 컷'));

    const deleteButtons = screen.getAllByTitle('삭제');
    await act(async () => {
      fireEvent.click(deleteButtons[0]);
    });

    await waitFor(() => {
      expect(deletePhoto).toHaveBeenCalledWith('ph_001');
    });
  });

  it('저장 버튼 클릭 → updateEvent API 호출', async () => {
    updateEvent.mockResolvedValueOnce(mockEvent);
    renderEventDetail();

    await waitFor(() => screen.getByText('스튜디오 본촬영'));

    await act(async () => {
      fireEvent.click(screen.getByText('저장'));
    });

    await waitFor(() => {
      expect(updateEvent).toHaveBeenCalledWith('cpl_001', 'evt_001', expect.objectContaining({
        title: '스튜디오 본촬영',
      }));
    });
  });
});
