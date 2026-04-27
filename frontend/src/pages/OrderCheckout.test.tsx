// @TASK P5-FRONTEND - OrderCheckout 실 API 연동 테스트
// @SPEC docs/planning/06-tasks.md#Phase5

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import OrderCheckout from './OrderCheckout';

// album_api mock
vi.mock('../services/album_api', () => ({
  composeAlbum: vi.fn(),
}));

// order_api mock
vi.mock('../services/order_api', () => ({
  createOrder: vi.fn(),
}));

// react-daum-postcode mock — 외부 iframe 의존 회피.
// "주소 검색" 버튼 클릭 후 모달이 뜨면 즉시 onComplete 트리거되는 가짜 컴포넌트.
vi.mock('react-daum-postcode', () => ({
  default: ({ onComplete }: { onComplete: (data: Record<string, string>) => void }) => {
    return (
      <button
        type="button"
        data-testid="mock-daum-select"
        onClick={() =>
          onComplete({
            zonecode: '06234',
            roadAddress: '서울 강남구 테헤란로 123',
            jibunAddress: '서울 강남구 역삼동 123',
            address: '서울 강남구 테헤란로 123',
            buildingName: '',
            autoRoadAddress: '',
          })
        }
      >
        가짜 주소 선택
      </button>
    );
  },
}));

import { composeAlbum } from '../services/album_api';
import { createOrder } from '../services/order_api';
import type { AlbumLayout } from '../types/album';

const MOCK_LAYOUT: AlbumLayout = {
  total_photos: 5,
  total_pages: 3,
  generated_by: 'ai',
  chapters: [
    {
      chapter_number: 1,
      title: '웨딩 준비',
      color: 'coral',
      pages: [
        { page_number: 1, template: 'T1', photo_ids: ['p1'], caption: null },
        { page_number: 2, template: 'T2', photo_ids: ['p2', 'p3'], caption: null },
      ],
    },
  ],
};

const MOCK_ORDER = {
  id: 'ORD-TEST-001',
  couple_id: 'cpl_sample_001',
  format: 'SQUARE' as const,
  cover_type: 'HARD' as const,
  quantity: 1,
  chapters_selected: {},
  album_layout: MOCK_LAYOUT,
  recipient_name: '홍길동',
  recipient_phone: '010-1234-5678',
  recipient_address: '서울시 성동구',
  status: 'pending' as const,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  total_price: 170000,
  total_pages_estimated: 3,
  base_price: 150000,
  cover_surcharge: 20000,
};

function renderOrderCheckout() {
  // localStorage에 photo_ids 미리 설정
  localStorage.setItem('weddinglog_selected_photos', JSON.stringify(['p1', 'p2', 'p3']));
  return render(
    <MemoryRouter>
      <OrderCheckout />
    </MemoryRouter>
  );
}

describe('OrderCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom의 localStorage 초기화
    Object.defineProperty(window, 'localStorage', {
      value: (() => {
        let store: Record<string, string> = {};
        return {
          getItem: (k: string) => store[k] ?? null,
          setItem: (k: string, v: string) => { store[k] = v; },
          removeItem: (k: string) => { delete store[k]; },
          clear: () => { store = {}; },
        };
      })(),
      writable: true,
    });
    (composeAlbum as ReturnType<typeof vi.fn>).mockResolvedValue({
      album_layout: MOCK_LAYOUT,
      source: 'ai',
    });
    (createOrder as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_ORDER);
  });

  it('앨범 주문 크럼브가 표시된다', () => {
    renderOrderCheckout();
    expect(screen.getByText('앨범 주문')).toBeInTheDocument();
  });

  it('Step 1 마운트 시 compose API 호출', async () => {
    renderOrderCheckout();
    await waitFor(() => {
      expect(composeAlbum).toHaveBeenCalledWith('cpl_sample_001', ['p1', 'p2', 'p3']);
    });
  });

  it('compose 로딩 중 스피너/메시지 표시', () => {
    (composeAlbum as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    renderOrderCheckout();
    expect(screen.getByText(/앨범을 구성하고 있어요/)).toBeInTheDocument();
  });

  it('compose 성공 시 총 사진/페이지 요약 표시', async () => {
    renderOrderCheckout();
    await waitFor(() => {
      expect(screen.getByText(/5장/)).toBeInTheDocument();
    });
    expect(screen.getByText(/3페이지/)).toBeInTheDocument();
  });

  it('자동 추천 배지 표시', async () => {
    renderOrderCheckout();
    await waitFor(() => {
      expect(screen.getByText('자동 추천')).toBeInTheDocument();
    });
  });

  it('다시 구성 버튼 클릭 시 compose 재호출', async () => {
    renderOrderCheckout();
    await waitFor(() => expect(composeAlbum).toHaveBeenCalledTimes(1));
    const reBtn = screen.getByRole('button', { name: /다시 구성/ });
    fireEvent.click(reBtn);
    await waitFor(() => expect(composeAlbum).toHaveBeenCalledTimes(2));
  });

  it('Step 2 가격 계산: SQUARE + HARD + 1권 = 170000', async () => {
    renderOrderCheckout();
    await waitFor(() => expect(screen.getByText('자동 추천')).toBeInTheDocument());
    // 만족 버튼으로 Step 2 진입
    fireEvent.click(screen.getByRole('button', { name: /만족해요/ }));
    await waitFor(() => {
      expect(screen.getByText(/170,000원/)).toBeInTheDocument();
    });
  });

  it('Step 2 가격 계산: SQUARE + HARD + 2권 = 340000', async () => {
    renderOrderCheckout();
    await waitFor(() => expect(screen.getByText('자동 추천')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /만족해요/ }));
    await waitFor(() => expect(screen.getByText(/170,000원/)).toBeInTheDocument());
    // 수량 늘리기
    fireEvent.click(screen.getByRole('button', { name: '수량 늘리기' }));
    await waitFor(() => {
      expect(screen.getByText(/340,000원/)).toBeInTheDocument();
    });
  });

  it('Step 3 전화번호 포맷 검증 실패 → 에러 표시', async () => {
    renderOrderCheckout();
    await waitFor(() => expect(screen.getByText('자동 추천')).toBeInTheDocument());
    // Step 2 진입
    fireEvent.click(screen.getByRole('button', { name: /만족해요/ }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /옵션 선택/ })).toBeInTheDocument());
    // Step 3 진입 (다음으로)
    const nextBtns = screen.getAllByRole('button', { name: /다음으로/ });
    fireEvent.click(nextBtns[nextBtns.length - 1]);
    await waitFor(() => expect(screen.getByPlaceholderText(/홍길동/)).toBeInTheDocument());
    // 이름 입력
    const nameInput = screen.getByPlaceholderText(/홍길동/);
    fireEvent.change(nameInput, { target: { value: '홍' } });
    // 전화번호 잘못된 값 입력 — 010 으로 시작하지 않는 값.
    // 정책: "010-1234-5678" 또는 "01012345678" 둘 다 허용. 다른 형식은 거부.
    const phoneInput = screen.getByPlaceholderText(/010-/);
    fireEvent.change(phoneInput, { target: { value: '02-123-4567' } });
    // 주소 — Daum 검색 모달 열고 선택(mock)
    fireEvent.click(screen.getByRole('button', { name: '주소 검색' }));
    fireEvent.click(await screen.findByTestId('mock-daum-select'));
    // 상세 주소
    fireEvent.change(screen.getByPlaceholderText(/상세주소/), { target: { value: '404호' } });
    // 주문하기 클릭 (Step 3 액션 버튼)
    const orderBtns = screen.getAllByRole('button', { name: /주문하기/ });
    fireEvent.click(orderBtns[orderBtns.length - 1]);
    await waitFor(() => {
      expect(screen.getByText(/올바른 전화번호/)).toBeInTheDocument();
    });
  });

  it('Step 4 주문 생성 성공 → 주문 ID 렌더링', async () => {
    renderOrderCheckout();
    await waitFor(() => expect(screen.getByText('자동 추천')).toBeInTheDocument());
    // Step 2
    fireEvent.click(screen.getByRole('button', { name: /만족해요/ }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /옵션 선택/ })).toBeInTheDocument());
    // Step 3
    const nextBtns = screen.getAllByRole('button', { name: /다음으로/ });
    fireEvent.click(nextBtns[nextBtns.length - 1]);
    await waitFor(() => expect(screen.getByPlaceholderText(/홍길동/)).toBeInTheDocument());
    // 입력
    fireEvent.change(screen.getByPlaceholderText(/홍길동/), { target: { value: '홍길동' } });
    fireEvent.change(screen.getByPlaceholderText(/010-/), { target: { value: '010-1234-5678' } });
    // 주소 — Daum 검색 모달 열고 선택(mock) + 상세주소
    fireEvent.click(screen.getByRole('button', { name: '주소 검색' }));
    fireEvent.click(await screen.findByTestId('mock-daum-select'));
    fireEvent.change(screen.getByPlaceholderText(/상세주소/), { target: { value: '404호' } });
    // 주문하기
    const orderBtns = screen.getAllByRole('button', { name: /주문하기/ });
    fireEvent.click(orderBtns[orderBtns.length - 1]);
    await waitFor(() => {
      expect(screen.getByText(/ORD-TEST-001/)).toBeInTheDocument();
    });
  });
});
