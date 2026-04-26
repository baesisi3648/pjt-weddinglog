// @TASK P5-FRONTEND, P6-LV3 - Order API 서비스
// @SPEC docs/planning/06-tasks.md#Phase5
// @SPEC docs/planning/05-architecture.md#sequence-4-데이터-익스포트-lv3

import api from './api';
import type { Order, OrderFormat, OrderCoverType, OrderStatus } from '../types/order';
import type { AlbumLayout } from '../types/album';

// 브라우저 <a href download> 용 절대 URL 빌드용 origin.
// dev    → VITE_API_URL 미설정 → '' (Vite proxy 가 /api 를 백엔드로 전달)
// prod   → 'http://localhost:8100/api' → origin='http://localhost:8100'
const API_ORIGIN = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/api\/?$/, '');

// 백엔드 ChapterSelectionSchema 와 일치.
export interface ChapterSelection {
  chapter_number: number;
  title: string;
  photo_ids: string[];
}

export interface CreateOrderBody {
  format: OrderFormat;
  cover_type: OrderCoverType;
  quantity: number;
  chapters_selected: ChapterSelection[];
  album_layout: AlbumLayout | null;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
}

/**
 * 주문 생성
 * POST /api/couples/{couple_id}/orders
 */
export async function createOrder(coupleId: string, body: CreateOrderBody): Promise<Order> {
  const res = await api.post<Order>(`/couples/${coupleId}/orders`, body);
  return res.data;
}

/**
 * 주문 목록 조회
 * GET /api/couples/{couple_id}/orders
 */
export async function listOrders(coupleId: string): Promise<Order[]> {
  const res = await api.get<Order[]>(`/couples/${coupleId}/orders`);
  return res.data;
}

/**
 * 주문 상세 조회
 * GET /api/orders/{order_id}
 */
export async function getOrder(orderId: string): Promise<Order> {
  const res = await api.get<Order>(`/orders/${orderId}`);
  return res.data;
}

/**
 * 주문 상태 변경
 * PATCH /api/orders/{order_id}/status
 */
export async function updateOrderStatus(
  orderId: string,
  targetStatus: OrderStatus
): Promise<Order> {
  const res = await api.patch<Order>(`/orders/${orderId}/status`, {
    target_status: targetStatus,
  });
  return res.data;
}

/**
 * 주문 ZIP 익스포트 다운로드 URL (Lv3).
 * GET /api/orders/{order_id}/export
 *
 * axios 로 blob 을 받아오는 방식 대신 브라우저의 기본 다운로드 UI 를 활용하기 위해
 * <a href download> 나 window.location 에 바로 쓸 수 있는 절대 URL 을 반환한다.
 */
export function getExportUrl(orderId: string): string {
  return `${API_ORIGIN}/api/orders/${orderId}/export`;
}
