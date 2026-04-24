// @TASK P5-FRONTEND, P6-LV3 - Orders 실 API 연동 + ZIP 다운로드 테스트
// @SPEC docs/planning/06-tasks.md#Phase5
// @SPEC docs/planning/05-architecture.md#sequence-4-데이터-익스포트-lv3

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import Orders from './Orders';

// order_api mock — getExportUrl 은 실 함수 대신 테스트용 경로 리턴.
vi.mock('../services/order_api', () => ({
  listOrders: vi.fn(),
  updateOrderStatus: vi.fn(),
  getExportUrl: vi.fn((orderId: string) => `/api/orders/${orderId}/export`),
}));

import { listOrders, updateOrderStatus, getExportUrl } from '../services/order_api';
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

  // ---- Lv3 ZIP 다운로드 ----------------------------------------------------
  it('각 주문에 "데이터 다운로드" 앵커 href 가 export URL 을 포함한다', async () => {
    renderOrders();
    await waitFor(() =>
      expect(screen.getByText(/WL-2024-001/)).toBeInTheDocument()
    );

    // 1 번 주문의 다운로드 링크 — data-testid 로 특정.
    const link = screen.getByTestId('download-WL-2024-001') as HTMLAnchorElement;
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/api/orders/WL-2024-001/export');
    // download 속성은 suggested filename 제공 (브라우저가 이를 사용).
    expect(link.getAttribute('download')).toBe('WL-2024-001.zip');

    // 헬퍼가 각 주문에 대해 호출되었음.
    expect(getExportUrl).toHaveBeenCalledWith('WL-2024-001');
    expect(getExportUrl).toHaveBeenCalledWith('WL-2024-002');
    expect(getExportUrl).toHaveBeenCalledWith('WL-2024-003');
  });

  it('완료 상태 주문도 다운로드 링크가 활성화된다 (파트너 재인계 대비)', async () => {
    renderOrders();
    await waitFor(() =>
      expect(screen.getByText(/WL-2024-003/)).toBeInTheDocument()
    );
    const link = screen.getByTestId('download-WL-2024-003') as HTMLAnchorElement;
    // disabled 속성 없음 + href 정상.
    expect(link).not.toHaveAttribute('disabled');
    expect(link.getAttribute('href')).toBe('/api/orders/WL-2024-003/export');
  });
});
