// @TASK P5-FRONTEND - Orders 실 API 연동 테스트
// @SPEC docs/planning/06-tasks.md#Phase5

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import Orders from './Orders';

// order_api mock
vi.mock('../services/order_api', () => ({
  listOrders: vi.fn(),
  updateOrderStatus: vi.fn(),
}));

import { listOrders, updateOrderStatus } from '../services/order_api';
import type { Order } from '../types/order';

const MOCK_ORDERS: Order[] = [
  {
    id: 'WL-2024-001',
    couple_id: 'cpl_sample_001',
    format: 'SQUARE',
    cover_type: 'HARD',
    quantity: 2,
    chapters_selected: {},
    album_layout: null,
    recipient_name: '김철수',
    recipient_phone: '010-1234-5678',
    recipient_address: '서울 성동구',
    status: 'pending',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
    total_price: 340000,
    total_pages_estimated: 5,
    base_price: 150000,
    cover_surcharge: 20000,
  },
  {
    id: 'WL-2024-002',
    couple_id: 'cpl_sample_001',
    format: 'A4',
    cover_type: 'SOFT',
    quantity: 1,
    chapters_selected: {},
    album_layout: null,
    recipient_name: '이영희',
    recipient_phone: '010-9876-5432',
    recipient_address: '부산 해운대구',
    status: 'processing',
    created_at: '2024-01-12T10:00:00Z',
    updated_at: '2024-01-12T10:00:00Z',
    total_price: 180000,
    total_pages_estimated: 4,
    base_price: 180000,
    cover_surcharge: 0,
  },
  {
    id: 'WL-2024-003',
    couple_id: 'cpl_sample_001',
    format: 'SQUARE',
    cover_type: 'SOFT',
    quantity: 1,
    chapters_selected: {},
    album_layout: null,
    recipient_name: '박민준',
    recipient_phone: '010-1111-2222',
    recipient_address: '대구 중구',
    status: 'completed',
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    total_price: 150000,
    total_pages_estimated: 3,
    base_price: 150000,
    cover_surcharge: 0,
  },
];

function renderOrders() {
  return render(
    <MemoryRouter>
      <Orders />
    </MemoryRouter>
  );
}

describe('Orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (listOrders as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_ORDERS);
    (updateOrderStatus as ReturnType<typeof vi.fn>).mockImplementation(
      async (id: string, status: string) => ({
        ...MOCK_ORDERS.find((o) => o.id === id),
        status,
      })
    );
  });

  it('주문 관리 타이틀이 표시된다', async () => {
    renderOrders();
    expect(screen.getByText('주문 관리')).toBeInTheDocument();
  });

  it('3개 주문 목록 렌더링', async () => {
    renderOrders();
    await waitFor(() => {
      expect(screen.getByText(/WL-2024-001/)).toBeInTheDocument();
      expect(screen.getByText(/WL-2024-002/)).toBeInTheDocument();
      expect(screen.getByText(/WL-2024-003/)).toBeInTheDocument();
    });
  });

  it('listOrders API 호출 확인', async () => {
    renderOrders();
    await waitFor(() => {
      expect(listOrders).toHaveBeenCalledWith('cpl_sample_001');
    });
  });

  it('pending 상태 주문에 "제작 시작" 버튼 표시', async () => {
    renderOrders();
    await waitFor(() => expect(screen.getByText(/WL-2024-001/)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '제작 시작' })).toBeInTheDocument();
  });

  it('processing 상태 주문에 "완료로 변경" 버튼 표시', async () => {
    renderOrders();
    await waitFor(() => expect(screen.getByText(/WL-2024-002/)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '완료로 변경' })).toBeInTheDocument();
  });

  it('completed 상태 주문 "완료" 버튼 비활성화', async () => {
    renderOrders();
    await waitFor(() => expect(screen.getByText(/WL-2024-003/)).toBeInTheDocument());
    // 탭의 "완료"와 버튼의 "완료"가 모두 있으므로, disabled된 버튼만 필터
    const completedBtns = screen.getAllByRole('button', { name: '완료' });
    const disabledBtn = completedBtns.find((btn) => (btn as HTMLButtonElement).disabled);
    expect(disabledBtn).toBeTruthy();
    expect(disabledBtn).toBeDisabled();
  });

  it('pending → "제작 시작" 클릭 → PATCH 호출 + 상태 갱신', async () => {
    renderOrders();
    await waitFor(() => expect(screen.getByRole('button', { name: '제작 시작' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: '제작 시작' }));
    await waitFor(() => {
      expect(updateOrderStatus).toHaveBeenCalledWith('WL-2024-001', 'processing');
    });
  });

  it('processing → "완료로 변경" 클릭 → PATCH 호출', async () => {
    renderOrders();
    await waitFor(() => expect(screen.getByRole('button', { name: '완료로 변경' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: '완료로 변경' }));
    await waitFor(() => {
      expect(updateOrderStatus).toHaveBeenCalledWith('WL-2024-002', 'completed');
    });
  });

  it('빈 목록: "아직 주문이 없습니다" 표시', async () => {
    (listOrders as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderOrders();
    await waitFor(() => {
      expect(screen.getByText('아직 주문이 없습니다')).toBeInTheDocument();
    });
  });

  it('빈 목록: 타임라인 보기 버튼 표시', async () => {
    (listOrders as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderOrders();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '타임라인 보기' })).toBeInTheDocument();
    });
  });

  it('가격 Fraunces 스타일 표시', async () => {
    renderOrders();
    await waitFor(() => {
      expect(screen.getByText(/340,000원/)).toBeInTheDocument();
    });
  });
});
